import { defineStore } from "pinia"
import { doc, setDoc, updateDoc, getDoc  } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { useUserStore } from './user';

export const PostStore = defineStore({
    id: 'main',
    state: () => ({
            nombre1: "",
            apellido1: "",
            cuit1: "",
            empresa1: "",
            telefono1: "",
            direccion1: "",
            datos: [],               
    }),
    actions: {
        async obtenerDato(){
            const userStore = useUserStore();
            const auth = getAuth();
            const user = auth.currentUser;  
            const id = user.email;
            const docRef = doc(db, "usuarios", id);
            const docSnap = await getDoc(docRef);
            let datos = docSnap.data()
            this.datos.push(docSnap.data());
            this.nombre1 = datos.nombre;
            this.apellido1 = datos.apellido;
            this.cuit1 = datos.cuit;
            this.empresa1 = datos.empresa;
            this.telefono1 = datos.telefono;
            this.direccion1 = datos.direccion;
            if (docSnap.exists()) {
                console.log("Document data:", docSnap.data());
                console.log(id);
            } else {
                 // doc.data() will be undefined in this case
                 console.log("No such document!");
            }
        },
        async addItem(email){
            const docData = {
                nombre: "",
                apellido: "",
                cuit: "",
                empresa: "",
                telefono: "",
                direccion: "",  
            }
            const userStore = useUserStore();
            const auth = getAuth();
            const user = auth.currentUser;
            const id = email;
            await setDoc(doc(db, "usuarios", id), docData);
        },
        async updateItem(nombre,apellido,cuit,empresa,telefono,direccion){
            const userStore = useUserStore();
            const auth = getAuth();
            const user = auth.currentUser;
            if (user !== null) {
                const id = user.email;
                console.log(id);
                const Ref = doc(db, "usuarios", id);
                await updateDoc(Ref, {
                nombre: nombre,
                apellido: apellido,
                cuit: cuit,
                empresa: empresa,
                telefono: telefono,
                direccion: direccion,
                });
            }  
        }
    },
});