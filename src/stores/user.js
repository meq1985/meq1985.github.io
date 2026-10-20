import { defineStore } from 'pinia';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { ensureAccountReady } from '../services/accountProvisioning';

export const useUserStore = defineStore('user', {
  state: () => ({ user: null, busy: false, notice: '', error: '' }),
  actions: {
    async register(email, password) {
      if (this.busy) return false;
      this.busy = true;
      this.notice = this.error = '';
      let signedIn = false;
      let complete = false;
      try {
        let credential;
        try { credential = await createUserWithEmailAndPassword(auth, email.trim(), password); }
        catch (error) {
          if (error.code !== 'auth/email-already-in-use') throw error;
          credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        }
        signedIn = true;
        if (credential.user.emailVerified) {
          await ensureAccountReady(credential.user);
          this.user = credential.user;
          await this.$router.push('/config');
          complete = true;
          return true;
        }
        await sendEmailVerification(credential.user);
        this.notice = 'Revisá tu correo para verificar la cuenta. Después ingresá para completar el registro. Si no llega, podés reintentar el registro con el mismo correo y contraseña.';
        return true;
      } catch (error) {
        this.error = signedIn
          ? 'No se completó el paso de verificación o configuración. Reintentá con el mismo correo y contraseña; tu cuenta se puede recuperar.'
          : 'No se pudo registrar. Revisá el correo y la contraseña (mínimo 6 caracteres) o recuperá tu contraseña.';
        return false;
      } finally {
        try { if (signedIn && !complete) await signOut(auth); }
        finally { this.user = auth.currentUser; this.busy = false; }
      }
    },
    async login(email, password) {
      if (this.busy) return false;
      this.busy = true;
      this.notice = this.error = '';
      let complete = false;
      try {
        const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (!user.emailVerified) {
          await sendEmailVerification(user);
          this.notice = 'Verificá tu correo para ingresar. Se reenvió el enlace de verificación.';
          return false;
        }
        await ensureAccountReady(user);
        this.user = user;
        await this.$router.push('/config');
        complete = true;
        return true;
      } catch (error) {
        this.error = 'No se pudo ingresar o completar la configuración. Revisá tus datos y reintentá; no se sobrescriben tus datos.';
        return false;
      } finally {
        try { if (!complete && auth.currentUser) await signOut(auth); }
        finally { this.user = auth.currentUser; this.busy = false; }
      }
    },
    async resetPassword(email) {
      if (this.busy) return;
      this.busy = true;
      this.notice = this.error = '';
      try {
        await sendPasswordResetEmail(auth, email.trim());
        this.notice = 'Si existe una cuenta, recibirás un correo para restablecer la contraseña.';
      } catch (error) { this.error = 'No se pudo enviar el correo. Revisá la dirección e intentá de nuevo.'; }
      finally { this.busy = false; }
    },
    async logout() {
      await signOut(auth);
      this.user = null;
      this.notice = this.error = '';
      await this.$router.push('/');
    }
  }
});
