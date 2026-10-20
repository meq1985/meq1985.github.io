import { defineStore } from 'pinia';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
    sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { PostStore } from './dbUsers';
import { costoStore } from './dbCostos';

export const useUserStore = defineStore('user', {
    state: () => ({ user: null, busy: false }),
    actions: {
        async register(email, password) {
            if (this.busy) return;
            this.busy = true;
            let created = false;
            try {
                const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
                created = true;
                await PostStore().addItem(user.email);
                await costoStore().addCostos(user.email);
                await sendEmailVerification(user);
                alert('Se envió un correo de verificación. Verificá tu correo antes de ingresar.');
            } catch (error) {
                const message = error.code === 'auth/email-already-in-use'
                    ? 'El correo ya está registrado. Ingresá o recuperá tu contraseña.'
                    : created
                        ? 'La cuenta se creó, pero no se completó la configuración o el envío del correo. Ingresá para reintentar.'
                        : 'No se pudo crear la cuenta. Revisá el correo y la contraseña (mínimo 6 caracteres).';
                alert(message);
            } finally {
                try { if (created) await signOut(auth); }
                finally { this.user = auth.currentUser; this.busy = false; }
            }
        },
        async login(email, password) {
            if (this.busy) return;
            this.busy = true;
            try {
                const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
                if (!user.emailVerified) {
                    try { await sendEmailVerification(user); }
                    finally { await signOut(auth); }
                    alert('Verificá tu correo para ingresar. Se reenvió el enlace de verificación.');
                    return;
                }
                // Repair incomplete registration without overwriting existing documents.
                await PostStore().addItem(user.email);
                await costoStore().addCostos(user.email);
                this.user = user;
                await this.$router.push('/config');
            } catch (error) {
                alert('No se pudo ingresar o completar la configuración. Revisá tus datos y reintentá.');
                await signOut(auth);
                this.user = null;
            } finally { this.busy = false; }
        },
        async resetPassword(email) {
            try {
                await sendPasswordResetEmail(auth, email.trim());
                alert('Si existe una cuenta, recibirás un correo para restablecer la contraseña.');
            } catch (error) { alert('No se pudo enviar el correo. Revisá la dirección e intentá de nuevo.'); }
        },
        async logout() {
            await signOut(auth);
            this.user = null;
            await this.$router.push('/');
        }
    }
});
