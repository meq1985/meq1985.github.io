import { createCatalog } from './catalogPrices';

export function defaultProfile() {
  return { nombre: '', apellido: '', cuit: '', empresa: '', matricula: '', telefono: '', direccion: '' };
}

export function defaultCosts() {
return {
            catalog: createCatalog(),
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
            };
}
