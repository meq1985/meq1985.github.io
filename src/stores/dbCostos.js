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
            canalizacionEmbutidaPVC: null,
            canalizacionALaVistaPVC: null,
            canalizacionDurlockPvc: null,
            cableadoPvcEmbutido: null,
            cableadoPvcALaVista: null,
            cableadoSubterraneoXmetro: null,
            conexionArtefactoExtractor: null,
            conexionArtefactoCampana: null,
            conexionArtefactoVentilador: null,
            conexionLuminariaAplique: null,
            conexionLuminariaColgante: null,
            conexionLuminariaExterior: null,
            conexionLuminariaLuzEmergencia: null,
            tableroTermomagneticaMonofasico: null,
            tableroTermomagneticaTrifasico: null,
            tableroDiferencialMonofasico: null,
            tableroDiferencialTrifasico: null,
            acometidaMonofasica: null,
            acometidaTrifasica: null,
            acometidaInstalacionMedidorMonofasico: null,
            acometidaInstalacionMedidorTrifasico: null,
            acometidaArmadoPilarMonofasico: null,
            acometidaArmadoPilarTrifasico: null,
            documentacionHasta30Bocas: null,
            documentacionHasta50Bocas: null,
            documentacionHasta100Bocas: null,
            emergenciasDiasHabiles: null,
            emergenciasFindesFeriados: null,
            codigoEmbutidaPVC: null,
            codigoALaVistaPVC: null,
            codigoDurlockPvc: null,
            codigoPvcEmbutido: null,
            codigoPvcALaVista: null,
            codigoSubterraneoXmetro: null,
            codigoArtefactoExtractor: null,
            codigoArtefactoCampana: null,
            codigoArtefactoVentilador: null,
            codigoLuminariaAplique: null,
            codigoLuminariaColgante: null,
            codigoLuminariaExterior: null,
            codigoLuminariaLuzEmergencia: null,
            codigoTermomagneticaMonofasico: null,
            codigoTermomagneticaTrifasico: null,
            codigoDiferencialMonofasico: null,
            codigoDiferencialTrifasico: null,
            codigoMonofasica: null,
            codigoTrifasica: null,
            codigoInstalacionMedidorMonofasico: null,
            codigoInstalacionMedidorTrifasico: null,
            codigoArmadoPilarMonofasico: null,
            codigoArmadoPilarTrifasico: null,
            codigoHasta30Bocas: null,
            codigoHasta50Bocas: null,
            codigoHasta100Bocas: null,
            codigoDiasHabiles: null,
            codigoFindesFeriados: null,
            datos: [],          
    }),

    actions: {
        async addCodigos(){
            const docData = {
            canalizacion:{
                codigoLosa: 101,
                codigoMamposteria: 102,
                codigoConstruccionSeca: 103,
                codigoEmbutidaPVC: 104,
                codigoALaVistaPVC: 105,
                codigoDurlockPvc: 106,
            },
            cableado:{
                codigoObraNueva: 201,
                codigoRecableado: 202,
                codigoPvcEmbutido: 203,
                codigoPvcALaVista: 204,
                codigoSubterraneoXmetro: 205,
            },
            conexion:{
                codigoSimple: 301,
                codigoDoble: 302,
                codigoCombinacion: 303,
                codigoArtefactoExtractor: 304,
                codigoArtefactoCampana: 305,
                codigoArtefactoVentilador: 306,
                codigoLuminariaAplique: 307,
                codigoLuminariaColgante: 308,
                codigoLuminariaExterior: 309,
                codigoLuminariaLuzEmergencia: 310,
            },
            tablero:{
                codigoPrincipal: 401,
                codigoSeccional8: 402,
                codigoSeccional36: 403,
                codigoSeccional54: 404,
                codigoTermomagneticaMonofasico: 405,
                codigoTermomagneticaTrifasico: 406,
                codigoDiferencialMonofasico: 407,
                codigoDiferencialTrifasico: 408,
            },
            acometida:{
                codigoGabinete: 501,
                codigoPat: 502,
                codigoPilar: 503,
                codigoMonofasica: 504,
                codigoTrifasica: 505,
                codigoInstalacionMedidorMonofasico: 506,
                codigoInstalacionMedidorTrifasico: 507,
                codigoArmadoPilarMonofasico: 508,
                codigoArmadoPilarTrifasico: 509,
            },
            documentacion:{
                codigoProyecto: 601,
                codigoPlano: 602,
                codigoLista: 603,
                codigoHasta30Bocas: 604,
                codigoHasta50Bocas: 605,
                codigoHasta100Bocas: 606,
            },   
            emergencias:{
                codigoDiasHabiles: 801,
                codigoFindesFeriados: 802,
            }
            }
            
            const id = "codigos";
            await setDoc(doc(db, "costos", id), docData);
        },
        async addCostos(email){
            const docData = {
            canalizacion:{
                canalizacionLosa: null,
                canalizacionMamposteria: null,
                canalizacionConstruccionSeca: null,
                canalizacionEmbutidaPVC: null,
                canalizacionALaVistaPVC: null,
                canalizacionDurlockPvc: null,
            },
            cableado:{
                cableadoObraNueva: null,
                cableadoRecableado: null,
                cableadoPvcEmbutido: null,
                cableadoPvcALaVista: null,
                cableadoSubterraneoXmetro: null,
            },
            conexion:{
                conexionSimple: null,
                conexionDoble: null,
                conexionCombinacion: null,
                conexionArtefactoExtractor: null,
                conexionArtefactoCampana: null,
                conexionArtefactoVentilador: null,
                conexionLuminariaAplique: null,
                conexionLuminariaColgante: null,
                conexionLuminariaExterior: null,
                conexionLuminariaLuzEmergencia: null,
            },
            tablero:{
                tableroPrincipal: null,
                tableroSeccional8: null,
                tableroSeccional36: null,
                tableroSeccional54: null,
                tableroTermomagneticaMonofasico: null,
                tableroTermomagneticaTrifasico: null,
                tableroDiferencialMonofasico: null,
                tableroDiferencialTrifasico: null,
            },
            acometida:{
                acometidaGabinete: null,
                acometidaPat: null,
                acometidaPilar: null,
                acometidaMonofasica: null,
                acometidaTrifasica: null,
                acometidaInstalacionMedidorMonofasico: null,
                acometidaInstalacionMedidorTrifasico: null,
                acometidaArmadoPilarMonofasico: null,
                acometidaArmadoPilarTrifasico: null,
            },
            documentacion:{
                documentacionProyecto: null,
                documentacionPlano: null,
                documentacionLista: null,
                documentacionHasta30Bocas: null,
                documentacionHasta50Bocas: null,
                documentacionHasta100Bocas: null,
            },
            emergencias:{
                emergenciasDiasHabiles: null,
                emergenciasFindesFeriados: null,
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
            documentacionPlano,documentacionLista,emergenciasDiasHabiles,emergenciasFindesFeriados,documentacionHasta30Bocas,documentacionHasta50Bocas,documentacionHasta100Bocas,
            acometidaMonofasica,acometidaTrifasica,acometidaInstalacionMedidorMonofasico,acometidaInstalacionMedidorTrifasico,acometidaArmadoPilarMonofasico,acometidaArmadoPilarTrifasico,
            tableroTermomagneticaMonofasico,tableroTermomagneticaTrifasico,tableroDiferencialMonofasico,tableroDiferencialTrifasico,conexionArtefactoCampana,conexionArtefactoExtractor,
            conexionArtefactoVentilador,conexionLuminariaAplique,conexionLuminariaColgante,conexionLuminariaExterior,conexionLuminariaLuzEmergencia,cableadoPvcALaVista,cableadoPvcEmbutido,
            cableadoSubterraneoXmetro,canalizacionALaVistaPVC,canalizacionEmbutidaPVC,canalizacionDurlockPvc){
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
                "canalizacion.canalizacionALaVistaPvc": canalizacionALaVistaPVC,
                "canalizacion.canalizacionEmbutidaPVC": canalizacionEmbutidaPVC,
                "canalizacion.canalizacionDurlockPvc": canalizacionDurlockPvc,
    
                "cableado.cableadoObraNueva": cableadoObraNueva,
                "cableado.cableadoRecableado": cableadoRecableado,
                "cableado.cableadoPvcALaVista": cableadoPvcALaVista,
                "cableado.cableadoPvcEmbutido": cableadoPvcEmbutido,
                "cableado.cableadoSubterraneoXmetro": cableadoSubterraneoXmetro,
                
                "conexion.conexionSimple": conexionSimple,
                "conexion.conexionDoble": conexionDoble,
                "conexion.conexionCombinacion": conexionCombinacion,
                "conexion.conexionArtefactoCampana": conexionArtefactoCampana,
                "conexion.conexionArtefactoExtractor": conexionArtefactoExtractor,
                "conexion.conexionArtefactoVentilador": conexionArtefactoVentilador,
                "conexion.conexionLuminariaAplique": conexionLuminariaAplique,
                "conexion.conexionLuminariaColgante": conexionLuminariaColgante,
                "conexion.conexionLuminariaExterior": conexionLuminariaExterior,
                "conexion.conexionLuminariaLuzEmergencia": conexionLuminariaLuzEmergencia,
                
                "tablero.tableroPrincipal": tableroPrincipal,
                "tablero.tableroSeccional8": tableroSeccional8,
                "tablero.tableroSeccional36": tableroSeccional36,
                "tablero.tableroSeccional54": tableroSeccional54,
                "tablero.tableroTermomagneticaMonofasico": tableroTermomagneticaMonofasico,
                "tablero.tableroTermomagneticaTrifasico": tableroTermomagneticaTrifasico,
                "tablero.tableroDiferencialMonofasico": tableroDiferencialMonofasico,
                "tablero.tableroDiferencialTrifasico": tableroDiferencialTrifasico,
               
                "acometida.acometidaGabinete": acometidaGabinete,
                "acometida.acometidaPat": acometidaPat,
                "acometida.acometidaPilar": acometidaPilar,
                "acometida.acometidaMonofasica": acometidaMonofasica,
                "acometida.acometidaTrifasica": acometidaTrifasica,
                "acometida.acometidaInstalacionMedidorMonofasico": acometidaInstalacionMedidorMonofasico,
                "acometida.acometidaInstalacionMedidorTrifasico": acometidaInstalacionMedidorTrifasico,
                "acometida.acometidaArmadoPilarMonofasico": acometidaArmadoPilarMonofasico,
                "acometida.acometidaArmadoPilarTrifasico": acometidaArmadoPilarTrifasico,

                "documentacion.documentacionProyecto": documentacionProyecto,
                "documentacion.documentacionPlano": documentacionPlano,
                "documentacion.documentacionLista": documentacionLista,
                "documentacion.documentacionHasta30Bocas": documentacionHasta30Bocas,
                "documentacion.documentacionHasta50Bocas": documentacionHasta50Bocas,
                "documentacion.documentacionHasta100Bocas": documentacionHasta100Bocas,

                "emergencias.emergenciasDiasHabiles": emergenciasDiasHabiles,
                "emergencias.emergenciasFindesFeriados": emergenciasFindesFeriados,
            });
            };
        },
        async updateCostosCanalizacion(canalizacionLosa,canalizacionMamposteria,canalizacionConstruccionSeca,canalizacionALaVistaPVC,canalizacionEmbutidaPVC,canalizacionDurlockPvc){
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
                    "canalizacion.canalizacionALaVistaPvc": canalizacionALaVistaPVC,
                    "canalizacion.canalizacionEmbutidaPVC": canalizacionEmbutidaPVC,
                    "canalizacion.canalizacionDurlockPvc": canalizacionDurlockPvc,
                });
                };
        },
        async updateCostosCableado(cableadoObraNueva,cableadoRecableado,cableadoPvcALaVista,cableadoPvcEmbutido,cableadoSubterraneoXmetro){
                    const userStore = useUserStore();
                    const auth = getAuth();
                    const user = auth.currentUser;
                    if (user !== null) {
                    const id = user.email;
                    
                    const Ref = doc(db, "costos", id);
                    await updateDoc(Ref, {
                        "cableado.cableadoObraNueva": cableadoObraNueva,
                        "cableado.cableadoRecableado": cableadoRecableado,
                        "cableado.cableadoPvcALaVista": cableadoPvcALaVista,
                        "cableado.cableadoPvcEmbutido": cableadoPvcEmbutido,
                        "cableado.cableadoSubterraneoXmetro": cableadoSubterraneoXmetro,
                    });
                    };
        },
        async updateCostosConexion(conexionSimple,conexionDoble,conexionCombinacion,conexionArtefactoCampana,conexionArtefactoExtractor,conexionArtefactoVentilador,
            conexionLuminariaAplique,conexionLuminariaColgante,conexionLuminariaExterior,conexionLuminariaLuzEmergencia){
                        const userStore = useUserStore();
                        const auth = getAuth();
                        const user = auth.currentUser;
                        if (user !== null) {
                        const id = user.email;
                        
                        const Ref = doc(db, "costos", id);
                        await updateDoc(Ref, {
                            "conexion.conexionSimple": conexionSimple,
                            "conexion.conexionDoble": conexionDoble,
                            "conexion.conexionCombinacion": conexionCombinacion,
                            "conexion.conexionArtefactoCampana": conexionArtefactoCampana,
                            "conexion.conexionArtefactoExtractor": conexionArtefactoExtractor,
                            "conexion.conexionArtefactoVentilador": conexionArtefactoVentilador,
                            "conexion.conexionLuminariaAplique": conexionLuminariaAplique,
                            "conexion.conexionLuminariaColgante": conexionLuminariaColgante,
                            "conexion.conexionLuminariaExterior": conexionLuminariaExterior,
                            "conexion.conexionLuminariaLuzEmergencia": conexionLuminariaLuzEmergencia,
                        });
                        };
        },
        async updateCostosTablero(tableroPrincipal,tableroSeccional8,tableroSeccional36,tableroSeccional54,tableroTermomagneticaMonofasico,tableroTermomagneticaTrifasico,
            tableroDiferencialMonofasico,tableroDiferencialTrifasico){
                            const userStore = useUserStore();
                            const auth = getAuth();
                            const user = auth.currentUser;
                            if (user !== null) {
                            const id = user.email;
                            
                            const Ref = doc(db, "costos", id);
                            await updateDoc(Ref, {
                                "tablero.tableroPrincipal": tableroPrincipal,
                                "tablero.tableroSeccional8": tableroSeccional8,
                                "tablero.tableroSeccional36": tableroSeccional36,
                                "tablero.tableroSeccional54": tableroSeccional54,
                                "tablero.tableroTermomagneticaMonofasico": tableroTermomagneticaMonofasico,
                                "tablero.tableroTermomagneticaTrifasico": tableroTermomagneticaTrifasico,
                                "tablero.tableroDiferencialMonofasico": tableroDiferencialMonofasico,
                                "tablero.tableroDiferencialTrifasico": tableroDiferencialTrifasico,
                            });
                            };
        },
        async updateCostosDocumentacion(documentacionProyecto,documentacionPlano,documentacionLista,documentacionHasta30Bocas,documentacionHasta50Bocas,documentacionHasta100Bocas){
            const userStore = useUserStore();
            const auth = getAuth();
            const user = auth.currentUser;
            if (user !== null) {
            const id = user.email;
            
            const Ref = doc(db, "costos", id);
            await updateDoc(Ref, {
                "documentacion.documentacionProyecto": documentacionProyecto,
                "documentacion.documentacionPlano": documentacionPlano,
                "documentacion.documentacionLista": documentacionLista,
                "documentacion.documentacionHasta30Bocas": documentacionHasta30Bocas,
                "documentacion.documentacionHasta50Bocas": documentacionHasta50Bocas,
                "documentacion.documentacionHasta100Bocas": documentacionHasta100Bocas,
            });
            };
        },
        async updateCostosEmergencias(emergenciasDiasHabiles,emergenciasFindesFeriados){
            const userStore = useUserStore();
            const auth = getAuth();
            const user = auth.currentUser;
            if (user !== null) {
            const id = user.email;
            
            const Ref = doc(db, "costos", id);
            await updateDoc(Ref, {
                "emergencias.emergenciasDiasHabiles": emergenciasDiasHabiles,
                "emergencias.emergenciasFindesFeriados": emergenciasFindesFeriados,
            });
            };
        },
        async updateCostosAcometida(acometidaGabinete,acometidaPat,acometidaPilar,acometidaMonofasica,acometidaTrifasica,acometidaInstalacionMedidorMonofasico,acometidaInstalacionMedidorTrifasico,
            acometidaArmadoPilarMonofasico,acometidaArmadoPilarTrifasico){
            const userStore = useUserStore();
            const auth = getAuth();
            const user = auth.currentUser;
            if (user !== null) {
            const id = user.email;
            
            const Ref = doc(db, "costos", id);
            await updateDoc(Ref, {
                "acometida.acometidaGabinete": acometidaGabinete,
                "acometida.acometidaPat": acometidaPat,
                "acometida.acometidaPilar": acometidaPilar,
                "acometida.acometidaMonofasica": acometidaMonofasica,
                "acometida.acometidaTrifasica": acometidaTrifasica,
                "acometida.acometidaInstalacionMedidorMonofasico": acometidaInstalacionMedidorMonofasico,
                "acometida.acometidaInstalacionMedidorTrifasico": acometidaInstalacionMedidorTrifasico,
                "acometida.acometidaArmadoPilarMonofasico": acometidaArmadoPilarMonofasico,
                "acometida.acometidaArmadoPilarTrifasico": acometidaArmadoPilarTrifasico,
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
                this.canalizacionALaVistaPVC = datos.canalizacion.canalizacionALaVistaPVC;
                this.canalizacionEmbutidaPVC = datos.canalizacion.canalizacionEmbutidaPVC;
                this.canalizacionDurlockPvc = datos.canalizacion.canalizacionDurlockPvc;
                this.cableadoPvcALaVista = datos.cableado.cableadoPvcALaVista;
                this.cableadoPvcEmbutido = datos.cableado.cableadoPvcEmbutido;
                this.cableadoSubterraneoXmetro = datos.cableado.cableadoSubterraneoXmetro;
                this.conexionArtefactoCampana = datos.conexion.conexionArtefactoCampana;
                this.conexionArtefactoExtractor = datos.conexion.conexionArtefactoExtractor;
                this.conexionArtefactoVentilador = datos.conexion.conexionArtefactoVentilador;
                this.conexionLuminariaAplique = datos.conexion.conexionLuminariaAplique;
                this.conexionLuminariaColgante = datos.conexion.conexionLuminariaColgante;
                this.conexionLuminariaExterior = datos.conexion.conexionLuminariaExterior;
                this.conexionLuminariaLuzEmergencia = datos.conexion.conexionLuminariaLuzEmergencia;
                this.tableroTermomagneticaMonofasico = datos.tablero.tableroTermomagneticaMonofasico;
                this.tableroTermomagneticaTrifasico = datos.tablero.tableroTermomagneticaTrifasico;
                this.tableroDiferencialMonofasico = datos.tablero.tableroDiferencialMonofasico;
                this.tableroDiferencialTrifasico = datos.tablero.tableroDiferencialTrifasico;
                this.emergenciasDiasHabiles = datos.emergencias.emergenciasDiasHabiles;
                this.emergenciasFindesFeriados = datos.emergencias.emergenciasFindesFeriados;
                this.documentacionHasta30Bocas = datos.documentacion.documentacionHasta30Bocas;
                this.documentacionHasta50Bocas = datos.documentacion.documentacionHasta50Bocas;
                this.documentacionHasta100Bocas = datos.documentacion.documentacionHasta100Bocas;
                this.acometidaMonofasica = datos.acometida.acometidaMonofasica;
                this.acometidaTrifasica = datos.acometida.acometidaTrifasica;
                this.acometidaInstalacionMedidorMonofasico = datos.acometida.acometidaInstalacionMedidorMonofasico;
                this.acometidaInstalacionMedidorTrifasico = datos.acometida.acometidaInstalacionMedidorTrifasico;
                this.acometidaArmadoPilarMonofasico = datos.acometida.acometidaArmadoPilarMonofasico;
                this.acometidaArmadoPilarTrifasico = datos.acometida.acometidaArmadoPilarTrifasico;
                
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
                    this.codigoALaVistaPVC = datos.canalizacion.codigoALaVistaPVC;
                    this.codigoEmbutidaPVC = datos.canalizacion.codigoEmbutidaPVC;
                    this.codigoDurlockPvc = datos.canalizacion.codigoDurlockPvc;
                    this.codigoPvcALaVista = datos.cableado.codigoPvcALaVista;
                    this.codigoPvcEmbutido = datos.cableado.codigoPvcEmbutido;
                    this.codigoSubterraneoXmetro = datos.cableado.codigoSubterraneoXmetro;
                    this.codigoArtefactoCampana = datos.conexion.codigoArtefactoCampana;
                    this.codigoArtefactoExtractor = datos.conexion.codigoArtefactoExtractor;
                    this.codigoArtefactoVentilador = datos.conexion.codigoArtefactoVentilador;
                    this.codigoLuminariaAplique = datos.conexion.codigoLuminariaAplique;
                    this.codigoLuminariaColgante = datos.conexion.codigoLuminariaColgante;
                    this.codigoLuminariaExterior = datos.conexion.codigoLuminariaExterior;
                    this.codigoLuminariaLuzEmergencia = datos.conexion.codigoLuminariaLuzEmergencia;
                    this.codigoTermomagneticaMonofasico = datos.tablero.codigoTermomagneticaMonofasico;
                    this.codigoTermomagneticaTrifasico = datos.tablero.codigoTermomagneticaTrifasico;
                    this.codigoDiferencialMonofasico = datos.tablero.codigoDiferencialMonofasico;
                    this.codigoDiferencialTrifasico = datos.tablero.codigoDiferencialTrifasico;
                    this.codigoDiasHabiles = datos.emergencias.codigoDiasHabiles;
                    this.codigoFindesFeriados = datos.emergencias.codigoFindesFeriados;
                    this.codigoHasta30Bocas = datos.documentacion.codigoHasta30Bocas;
                    this.codigoHasta50Bocas = datos.documentacion.codigoHasta50Bocas;
                    this.codigoHasta100Bocas = datos.documentacion.codigoHasta100Bocas;
                    this.codigoMonofasica = datos.acometida.codigoMonofasica;
                    this.codigoTrifasica = datos.acometida.codigoTrifasica;
                    this.codigoInstalacionMedidorMonofasico = datos.acometida.codigoInstalacionMedidorMonofasico;
                    this.codigoInstalacionMedidorTrifasico = datos.acometida.codigoInstalacionMedidorTrifasico;
                    this.codigoArmadoPilarMonofasico = datos.acometida.codigoArmadoPilarMonofasico;
                    this.codigoArmadoPilarTrifasico = datos.acometida.codigoArmadoPilarTrifasico;
                    
                    if (docSnap.exists()) {
                        
                    } else {
                         // doc.data() will be undefined in this case
                         console.log("No such document!");
                    }
                 },
        }
    })