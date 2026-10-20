import { defineStore } from "pinia"
import { doc, setDoc, updateDoc, getDoc  } from "firebase/firestore";
import { db } from "../firebase";
import { requireUser, assertCurrentUser } from "../firebase/session";


export const PostStore = defineStore({
    id: 'main',
    state: () => ({
            nombre1: "",
            apellido1: "",
            cuit1: "",
            empresa1: "",
            matricula1: "",
            telefono1: "",
            direccion1: "",
            datos: [],
    }),
    actions: {
        async obtenerDato(){
            const user = await requireUser();
            const id = user.email;
            const docRef = doc(db, "usuarios", id);
            const docSnap = await getDoc(docRef);
            assertCurrentUser(user);
            if (!docSnap.exists()) return;
            const datos = docSnap.data()
            this.datos = [datos];
            this.nombre1 = datos.nombre;
            this.apellido1 = datos.apellido;
            this.cuit1 = datos.cuit;
            this.empresa1 = datos.empresa;
            this.matricula1 = datos.matricula;
            this.telefono1 = datos.telefono;
            this.direccion1 = datos.direccion;
        },
        async addItem(email){
            const docData = {
                nombre: "",
                apellido: "",
                cuit: "",
                empresa: "",
                matricula:"",
                telefono: "",
                direccion: "",
            }
            const user = await requireUser({ verified: false, email });
            const id = user.email;
            const ref = doc(db, "usuarios", id);
            const snapshot = await getDoc(ref);
            assertCurrentUser(user);
            if (!snapshot.exists()) await setDoc(ref, docData);
        },
        async updateItem(nombre,apellido,cuit,empresa,matricula,telefono,direccion){
            const user = await requireUser();
            if (user !== null) {
                const id = user.email;

                const Ref = doc(db, "usuarios", id);
                await updateDoc(Ref, {
                nombre: nombre,
                apellido: apellido,
                cuit: cuit,
                empresa: empresa,
                matricula: matricula,
                telefono: telefono,
                direccion: direccion,
                });
            }
        }
    },
});
