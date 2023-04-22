import { defineStore } from "pinia";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, getAuth, sendEmailVerification, sendPasswordResetEmail} from "firebase/auth";

export const useUserStore = defineStore("user",{
    state: () => {
        return{
            user: null,
        };
        
    },

    actions:{
        async register(email, password){
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                
                
            } catch (error) {
                switch(error.code){
                    case "auth/amil-already-in-use":
                        alert("Email ya esta en uso");
                        break;
                    case "auth/invalid-email":
                        alert("Email invalido");
                        break;
                }
                return;
            }
        this.user = auth.currentUser;
        await sendEmailVerification(auth.currentUser);
        alert("Se envio un mail de verificacion a su correo.")
        await signOut(auth);
        this.user = null;
        },

        async resetPassword(email) {
            try {
              await sendPasswordResetEmail(auth, email);
              alert("Correo electrónico enviado para restablecer la contraseña");
            } catch (error) {
                switch(error.code){
                    case "auth/invalid-email":
                        alert("Email invalido");
                        break;
                }
                return;
            }
        },

        async login(email, password){
            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (error) {
                switch(error.code){
                    case "auth/user-not-found":
                        alert("Usuario no encontrado");
                        break;
                    case "auth/wrong-password":
                        alert("Contraseña invalida");
                        break;
                }
                return;
            }
        this.user = auth.currentUser;
        if (this.user && this.user.emailVerified) {
            // El usuario ha verificado su correo electrónico
            this.$router.push("/config")
          } else {
            // El usuario no ha verificado su correo electrónico
            alert('El usuario no ha verificado su correo electrónico');
            await signOut(auth);
            this.user = null;
          }
        /*this.$router.push("/dashboard")*/
        },

        async logout(){
            await signOut(auth);
            this.user = null;
            this.$router.push("/");
        },
        
        
        
    },
});