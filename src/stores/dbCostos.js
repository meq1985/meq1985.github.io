import { defineStore } from "pinia";
import { doc, setDoc, updateDoc, getDoc  } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { useUserStore } from './user';

export const costoStore = defineStore({
    id: 'costos',
    state: () => ({
            canalizacionLosa: null,
            canalizacionMamposteria: null,
            canalizacionConstruccionSeca: null,
            cableadoObraNueva: null,
            cableadoRecableado: null,
            conexionSimple: null,
            conexionDoble: null,
            conexionCombinacion: null,
            tableroPrincipal: null,
            tableroSeccional8: null,
            tableroSeccional36: null,
            tableroSeccional54: null,
            acometidaGabinete: null,
            acometidaPat: null,
            acometidaPilar: null,
            documentacionProyecto: null,
            documentacionPlano: null,
            documentacionLista: null,
            codigoLosa: null,
            codigoMamposteria: null,
            codigoConstruccionSeca: null,
            codigoObraNueva: null,
            codigoRecableado: null,
            codigoSimple: null,
            codigoDoble: null,
            codigoCombinacion: null,
            codigoPrincipal: null,
            codigoSeccional8: null,
            codigoSeccional36: null,
            codigoSeccional54: null,
            codigoGabinete: null,
            codigoPat: null,
            codigoPilar: null,
            codigoProyecto: null,
            codigoPlano: null,
            codigoLista: null,
            datos: [],          
    }),

    actions: {
        async addCodigos(){
            const docData = {
            canalizacion:{
                codigoLosa: 101,
                codigoMamposteria: 102,
                codigoConstruccionSeca: 103,
            },
            cableado:{
                codigoObraNueva: 201,
                codigoRecableado: 202,
            },
            conexion:{
                codigoSimple: 301,
                codigoDoble: 302,
                codigoCombinacion: 303,
            },
            tablero:{
                codigoPrincipal: 401,
                codigoSeccional8: 402,
                codigoSeccional36: 403,
                codigoSeccional54: 404,
            },
            acometida:{
                codigoGabinete: 501,
                codigoPat: 502,
                codigoPilar: 503,
            },
            documentacion:{
                codigoProyecto: 601,
                codigoPlano: 602,
                codigoLista: 603,
            }   
            }
            const userStore = useUserStore();
            const auth = getAuth();
            const user = auth.currentUser;
            const id = "codigos";
            await setDoc(doc(db, "costos", id), docData);
        },
        async addCostos(email){
            const docData = {
            canalizacion:{
                canalizacionLosa: null,
                canalizacionMamposteria: null,
                canalizacionConstruccionSeca: null,
            },
            cableado:{
                cableadoObraNueva: null,
                cableadoRecableado: null,
            },
            conexion:{
                conexionSimple: null,
                conexionDoble: null,
                conexionCombinacion: null,
            },
            tablero:{
                tableroPrincipal: null,
                tableroSeccional8: null,
                tableroSeccional36: null,
                tableroSeccional54: null,
            },
            acometida:{
                acometidaGabinete: null,
                acometidaPat: null,
                acometidaPilar: null,
            },
            documentacion:{
                documentacionProyecto: null,
                documentacionPlano: null,
                documentacionLista: null,
            }   
            }
            const userStore = useUserStore();
            const auth = getAuth();
            const user = auth.currentUser;
            const id = email;
            await setDoc(doc(db, "costos", id), docData);
        },
        async updateCostos(canalizacionLosa,canalizacionMamposteria,canalizacionConstruccionSeca,cableadoObraNueva,cableadoRecableado,conexionSimple,conexionDoble,
            conexionCombinacion,tableroPrincipal,tableroSeccional8,tableroSeccional36,tableroSeccional54,acometidaGabinete,acometidaPat,acometidaPilar,documentacionProyecto,
            documentacionPlano,documentacionLista){
            const userStore = useUserStore();
            const auth = getAuth();
            const user = auth.currentUser;
            if (user !== null) {
            const id = user.email;
            
            const Ref = doc(db, "costos", id);
            await updateDoc(Ref, {
                "canalizacion.canalizacionLosa": canalizacionLosa,
                "canalizacion.canalizacionMamposteria": canalizacionMamposteria,
                "canalizacion.canalizacionConstruccionSeca": canalizacionConstruccionSeca,
    
                "cableado.cableadoObraNueva": cableadoObraNueva,
                "cableado.cableadoRecableado": cableadoRecableado,
                
                "conexion.conexionSimple": conexionSimple,
                "conexion.conexionDoble": conexionDoble,
                "conexion.conexionCombinacion": conexionCombinacion,
                
                "tablero.tableroPrincipal": tableroPrincipal,
                "tablero.tableroSeccional8": tableroSeccional8,
                "tablero.tableroSeccional36": tableroSeccional36,
                "tablero.tableroSeccional54": tableroSeccional54,
               
                "acometida.acometidaGabinete": acometidaGabinete,
                "acometida.acometidaPat": acometidaPat,
                "acometida.acometidaPilar": acometidaPilar,
                
                "documentacion.documentacionProyecto": documentacionProyecto,
                "documentacion.documentacionPlano": documentacionPlano,
                "documentacion.documentacionLista": documentacionLista,
            });
            };
            },
        async obtenerCostos(){
                const userStore = useUserStore();
                const auth = getAuth();
                const user = auth.currentUser;  
                const id = user.email;
                const docRef = doc(db, "costos", id);
                const docSnap = await getDoc(docRef);
                let datos = docSnap.data()
                this.datos.push(docSnap.data());
                this.canalizacionLosa = datos.canalizacion.canalizacionLosa;
                this.canalizacionMamposteria = datos.canalizacion.canalizacionMamposteria;
                this.canalizacionConstruccionSeca = datos.canalizacion.canalizacionConstruccionSeca;
                this.cableadoObraNueva = datos.cableado.cableadoObraNueva;
                this.cableadoRecableado = datos.cableado.cableadoRecableado;
                this.conexionSimple = datos.conexion.conexionSimple;
                this.conexionDoble = datos.conexion.conexionDoble;
                this.conexionCombinacion = datos.conexion.conexionCombinacion;
                this.tableroPrincipal = datos.tablero.tableroPrincipal;
                this.tableroSeccional8 = datos.tablero.tableroSeccional8;
                this.tableroSeccional36 = datos.tablero.tableroSeccional36;
                this.tableroSeccional54 = datos.tablero.tableroSeccional54;
                this.acometidaGabinete = datos.acometida.acometidaGabinete;
                this.acometidaPat = datos.acometida.acometidaPat;
                this.acometidaPilar = datos.acometida.acometidaPilar;
                this.documentacionProyecto = datos.documentacion.documentacionProyecto;
                this.documentacionPlano = datos.documentacion.documentacionPlano;
                this.documentacionLista = datos.documentacion.documentacionLista;
                
                if (docSnap.exists()) {
                    
                } else {
                     // doc.data() will be undefined in this case
                     console.log("No such document!");
                }
                },
        async obtenerCodigos(){
                    const userStore = useUserStore();
                    const auth = getAuth();
                    const user = auth.currentUser;  
                    const id = "codigos";
                    const docRef = doc(db, "costos", id);
                    const docSnap = await getDoc(docRef);
                    let datos = docSnap.data()
                    this.datos.push(docSnap.data());
                    this.codigoLosa = datos.canalizacion.codigoLosa;
                    this.codigoMamposteria = datos.canalizacion.codigoMamposteria;
                    this.codigoConstruccionSeca = datos.canalizacion.codigoConstruccionSeca;
                    this.codigoObraNueva = datos.cableado.codigoObraNueva;
                    this.codigoRecableado = datos.cableado.codigoRecableado;
                    this.codigoSimple = datos.conexion.codigoSimple;
                    this.codigoDoble = datos.conexion.codigoDoble;
                    this.codigoCombinacion = datos.conexion.codigoCombinacion;
                    this.codigoPrincipal = datos.tablero.codigoPrincipal;
                    this.codigoSeccional8 = datos.tablero.codigoSeccional8;
                    this.codigoSeccional36 = datos.tablero.codigoSeccional36;
                    this.codigoSeccional54 = datos.tablero.codigoSeccional54;
                    this.codigoGabinete = datos.acometida.codigoGabinete;
                    this.codigoPat = datos.acometida.codigoPat;
                    this.codigoPilar = datos.acometida.codigoPilar;
                    this.codigoProyecto = datos.documentacion.codigoProyecto;
                    this.codigoPlano = datos.documentacion.codigoPlano;
                    this.codigoLista = datos.documentacion.codigoLista;
                    
                    if (docSnap.exists()) {
                        
                    } else {
                         // doc.data() will be undefined in this case
                         console.log("No such document!");
                    }
                 },
        }
    })