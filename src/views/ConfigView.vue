<script type="module">
import { useUserStore } from '../stores/user';
import { onMounted } from 'vue';
import { ref } from "vue";
import { PostStore } from '../stores/dbUsers';
import { costoStore } from "../stores/dbCostos";

export default {

  setup() {
    const userStore = useUserStore();
    const costosStore = costoStore();
    const store = PostStore()
    /*costosStore.addCodigos();*/
    const nombre = ref('')
    const apellido = ref('')
    const cuit = ref('')
    const empresa = ref('')
    const matricula = ref('')
    const telefono = ref('')
    const direccion = ref('')
    const canalizacionLosa = ref('');
    const canalizacionMamposteria = ref('');
    const canalizacionConstruccionSeca = ref('');
    const cableadoObraNueva = ref('');
    const cableadoRecableado = ref('');
    const conexionSimple = ref('');
    const conexionDoble = ref('');
    const conexionCombinacion = ref('');
    const tableroPrincipal = ref('');
    const tableroSeccional8 = ref('');
    const tableroSeccional36 = ref('');
    const tableroSeccional54 = ref('');
    const acometidaGabinete = ref('');
    const acometidaPat = ref('');
    const acometidaPilar = ref('');
    const documentacionProyecto = ref('');
    const documentacionPlano = ref('');
    const documentacionLista = ref('');
    const codigoLosa = ref('');
    const codigoMamposteria = ref('');
    const codigoConstruccionSeca = ref('');
    const codigoObraNueva = ref('');
    const codigoRecableado = ref('');
    const codigoSimple = ref('');
    const codigoDoble = ref('');
    const codigoCombinacion = ref('');
    const codigoPrincipal = ref('');
    const codigoSeccional8 = ref('');
    const codigoSeccional36 = ref('');
    const codigoSeccional54 = ref('');
    const codigoGabinete = ref('');
    const codigoPat = ref('');
    const codigoPilar = ref('');
    const codigoProyecto = ref('');
    const codigoPlano = ref('');
    const codigoLista = ref('');
    const canalizacionEmbutidaPVC = ref('');
    const canalizacionALaVistaPVC = ref('');
    const canalizacionDurlockPvc = ref('');
    const cableadoPvcEmbutido = ref('');
    const cableadoPvcALaVista = ref('');
    const cableadoSubterraneoXmetro = ref('');
    const conexionArtefactoExtractor = ref('');
    const conexionArtefactoCampana = ref('');
    const conexionArtefactoVentilador = ref('');
    const conexionLuminariaAplique = ref('');
    const conexionLuminariaColgante = ref('');
    const conexionLuminariaExterior = ref('');
    const conexionLuminariaLuzEmergencia = ref('');
    const tableroTermomagneticaMonofasico = ref('');
    const tableroTermomagneticaTrifasico = ref('');
    const tableroDiferencialMonofasico = ref('');
    const tableroDiferencialTrifasico = ref('');
    const acometidaMonofasica = ref('');
    const acometidaTrifasica = ref('');
    const acometidaInstalacionMedidorMonofasico = ref('');
    const acometidaInstalacionMedidorTrifasico = ref('');
    const acometidaArmadoPilarMonofasico = ref('');
    const acometidaArmadoPilarTrifasico = ref('');
    const documentacionHasta30Bocas = ref('');
    const documentacionHasta50Bocas = ref('');
    const documentacionHasta100Bocas = ref('');
    const emergenciasDiasHabiles = ref('');
    const emergenciasFindesFeriados = ref('');
    const codigoEmbutidaPVC = ref('');
    const codigoALaVistaPVC = ref('');
    const codigoDurlockPvc = ref('');
    const codigoPvcEmbutido = ref('');
    const codigoPvcALaVista = ref('');
    const codigoSubterraneoXmetro = ref('');
    const codigoArtefactoExtractor = ref('');
    const codigoArtefactoCampana = ref('');
    const codigoArtefactoVentilador = ref('');
    const codigoLuminariaAplique = ref('');
    const codigoLuminariaColgante = ref('');
    const codigoLuminariaExterior = ref('');
    const codigoLuminariaLuzEmergencia = ref('');
    const codigoTermomagneticaMonofasico = ref('');
    const codigoTermomagneticaTrifasico = ref('');
    const codigoDiferencialMonofasico = ref('');
    const codigoDiferencialTrifasico = ref('');
    const codigoMonofasica = ref('');
    const codigoTrifasica = ref('');
    const codigoInstalacionMedidorMonofasico = ref('');
    const codigoInstalacionMedidorTrifasico = ref('');
    const codigoArmadoPilarMonofasico = ref('');
    const codigoArmadoPilarTrifasico = ref('');
    const codigoHasta30Bocas = ref('');
    const codigoHasta50Bocas = ref('');
    const codigoHasta100Bocas = ref('');
    const codigoDiasHabiles = ref('');
    const codigoFindesFeriados = ref('');


    const update = () => {
      store.updateItem(nombre.value, apellido.value, cuit.value, empresa.value, matricula.value, telefono.value, direccion.value);
    }
    const updateC = () => {
      costosStore.updateCostos(canalizacionLosa.value, canalizacionMamposteria.value, canalizacionConstruccionSeca.value, cableadoObraNueva.value, cableadoRecableado.value, 
              conexionSimple.value, conexionDoble.value, conexionCombinacion.value,tableroPrincipal.value,tableroSeccional8.value,tableroSeccional36.value,tableroSeccional54.value,
              acometidaGabinete.value, acometidaPat.value, acometidaPilar.value, documentacionProyecto.value, documentacionPlano.value, documentacionLista.value, canalizacionALaVistaPVC.value,
              canalizacionEmbutidaPVC.value, canalizacionDurlockPvc.value, cableadoPvcALaVista.value, cableadoPvcEmbutido.value, cableadoSubterraneoXmetro.value, 
              conexionArtefactoCampana.value, conexionArtefactoExtractor.value, conexionArtefactoVentilador.value, conexionLuminariaAplique.value, conexionLuminariaColgante.value,
              conexionLuminariaExterior.value, conexionLuminariaLuzEmergencia.value, tableroTermomagneticaMonofasico.value, tableroTermomagneticaTrifasico.value, tableroDiferencialMonofasico.value,
              tableroDiferencialTrifasico.value, acometidaMonofasica.value, acometidaTrifasica.value, acometidaInstalacionMedidorMonofasico.value, acometidaInstalacionMedidorTrifasico.value,
              acometidaArmadoPilarMonofasico.value, acometidaArmadoPilarTrifasico.value, documentacionHasta30Bocas.value, documentacionHasta50Bocas.value, documentacionHasta100Bocas.value,
              emergenciasDiasHabiles.value, emergenciasFindesFeriados.value);
    };
    const updateCanalizacion = () => {
      costosStore.updateCostosCanalizacion(canalizacionLosa.value, canalizacionMamposteria.value, canalizacionConstruccionSeca.value, canalizacionALaVistaPVC.value,
              canalizacionEmbutidaPVC.value, canalizacionDurlockPvc.value);
    };
    const updateCableado = () => {
      costosStore.updateCostosCableado(cableadoObraNueva.value, cableadoRecableado.value, cableadoPvcALaVista.value, cableadoPvcEmbutido.value, cableadoSubterraneoXmetro.value);
    };
    const updateConexion = () => {
      costosStore.updateCostosConexion(conexionSimple.value, conexionDoble.value, conexionCombinacion.value, conexionArtefactoCampana.value, conexionArtefactoExtractor.value,
      conexionArtefactoVentilador.value, conexionLuminariaAplique.value, conexionLuminariaColgante.value, conexionLuminariaExterior.value, conexionLuminariaLuzEmergencia.value);
    };
    const updateTablero = () => {
      costosStore.updateCostosTablero(tableroPrincipal.value,tableroSeccional8.value,tableroSeccional36.value,tableroSeccional54.value, tableroTermomagneticaMonofasico.value,
      tableroTermomagneticaTrifasico.value, tableroDiferencialMonofasico.value, tableroDiferencialTrifasico.value);
    };
    const updateAcometida = () => {
      costosStore.updateCostosAcometida(acometidaGabinete.value, acometidaPat.value, acometidaPilar.value, acometidaMonofasica.value, acometidaTrifasica.value,
      acometidaInstalacionMedidorMonofasico.value, acometidaInstalacionMedidorTrifasico.value, acometidaArmadoPilarMonofasico.value, acometidaArmadoPilarTrifasico.value);
    };
    const updateDocumentacion = () => {
      costosStore.updateCostosDocumentacion(documentacionProyecto.value, documentacionPlano.value, documentacionLista.value, documentacionHasta30Bocas.value,
      documentacionHasta50Bocas.value, documentacionHasta100Bocas.value);
    };
    const updateEmergencias = () => {
      costosStore.updateCostosEmergencias(emergenciasDiasHabiles.value, emergenciasFindesFeriados.value);
    };
    const logout = () => {
      userStore.logout();
    };

    const sidebarItems = ref([
      {
        id: 'datos',
        name: 'Mis datos',
      },
      {
        id: 'canalizacion',
        name: 'Canalizacion',
      },
      {
        id: 'cableado',
        name: 'Cableado',
      },
      {
        id: 'conexion',
        name: 'Conexion',
      },
      {
        id: 'tablero',
        name: 'Tablero',
      },
      {
        id: 'acometida',
        name: 'Acometida',
      },
      {
        id: 'documentacion',
        name: 'Documentacion',
      },
      {
        id: 'emergencias',
        name: 'Urgencias',
      },
    ]);

    const scrollToSection = (id) => {
      const element = document.getElementById(id);
      element.scrollIntoView({ behavior: 'smooth' });
    };

    onMounted(async () => {
      await store.obtenerDato();
      await costosStore.obtenerCostos();
      await costosStore.obtenerCodigos();
      nombre.value = store.nombre1
      apellido.value = store.apellido1
      cuit.value = store.cuit1
      empresa.value = store.empresa1
      matricula.value = store.matricula1
      telefono.value = store.telefono1
      direccion.value = store.direccion1
      canalizacionLosa.value = costosStore.canalizacionLosa
      canalizacionMamposteria.value = costosStore.canalizacionMamposteria
      canalizacionConstruccionSeca.value = costosStore.canalizacionConstruccionSeca
      cableadoObraNueva.value = costosStore.cableadoObraNueva
      cableadoRecableado.value = costosStore.cableadoRecableado
      conexionSimple.value = costosStore.conexionSimple
      conexionDoble.value = costosStore.conexionDoble
      conexionCombinacion.value = costosStore.conexionCombinacion
      tableroPrincipal.value = costosStore.tableroPrincipal
      tableroSeccional8.value = costosStore.tableroSeccional8
      tableroSeccional36.value = costosStore.tableroSeccional36
      tableroSeccional54.value = costosStore.tableroSeccional54
      acometidaGabinete.value = costosStore.acometidaGabinete
      acometidaPat.value = costosStore.acometidaPat
      acometidaPilar.value = costosStore.acometidaPilar
      documentacionProyecto.value = costosStore.documentacionProyecto
      documentacionPlano.value = costosStore.documentacionPlano
      documentacionLista.value = costosStore.documentacionLista
      canalizacionALaVistaPVC.value = costosStore.canalizacionALaVistaPVC
      canalizacionEmbutidaPVC.value = costosStore.canalizacionEmbutidaPVC
      canalizacionDurlockPvc.value = costosStore.canalizacionDurlockPvc
      cableadoPvcALaVista.value = costosStore.cableadoPvcALaVista
      cableadoPvcEmbutido.value = costosStore.cableadoPvcEmbutido
      cableadoSubterraneoXmetro.value = costosStore.cableadoSubterraneoXmetro 
      conexionArtefactoCampana.value = costosStore.conexionArtefactoCampana
      conexionArtefactoExtractor.value = costosStore.conexionArtefactoExtractor
      conexionArtefactoVentilador.value = costosStore.conexionArtefactoVentilador
      conexionLuminariaAplique.value = costosStore.conexionLuminariaAplique
      conexionLuminariaColgante.value = costosStore.conexionLuminariaColgante
      conexionLuminariaExterior.value = costosStore.conexionLuminariaExterior
      conexionLuminariaLuzEmergencia.value = costosStore.conexionLuminariaLuzEmergencia
      tableroTermomagneticaMonofasico.value = costosStore.tableroTermomagneticaMonofasico
      tableroTermomagneticaTrifasico.value = costosStore.tableroTermomagneticaTrifasico
      tableroDiferencialMonofasico.value = costosStore.tableroDiferencialMonofasico
      tableroDiferencialTrifasico.value = costosStore.tableroDiferencialTrifasico
      acometidaMonofasica.value = costosStore.acometidaMonofasica
      acometidaTrifasica.value = costosStore.acometidaTrifasica
      acometidaInstalacionMedidorMonofasico.value = costosStore.acometidaInstalacionMedidorMonofasico
      acometidaInstalacionMedidorTrifasico.value = costosStore.acometidaInstalacionMedidorTrifasico
      acometidaArmadoPilarMonofasico.value = costosStore.acometidaArmadoPilarMonofasico
      acometidaArmadoPilarTrifasico.value = costosStore.acometidaArmadoPilarTrifasico
      documentacionHasta30Bocas.value = costosStore.documentacionHasta30Bocas
      documentacionHasta50Bocas.value = costosStore.documentacionHasta50Bocas
      documentacionHasta100Bocas.value = costosStore.documentacionHasta100Bocas
      emergenciasDiasHabiles.value = costosStore.emergenciasDiasHabiles
      emergenciasFindesFeriados.value = costosStore.emergenciasFindesFeriados
      codigoLosa.value = costosStore.codigoLosa
      codigoMamposteria.value = costosStore.codigoMamposteria
      codigoConstruccionSeca.value = costosStore.codigoConstruccionSeca
      codigoObraNueva.value = costosStore.codigoObraNueva
      codigoRecableado.value = costosStore.codigoRecableado
      codigoSimple.value = costosStore.codigoSimple
      codigoDoble.value = costosStore.codigoDoble
      codigoCombinacion.value = costosStore.codigoCombinacion
      codigoPrincipal.value = costosStore.codigoPrincipal
      codigoSeccional8.value = costosStore.codigoSeccional8
      codigoSeccional36.value = costosStore.codigoSeccional36
      codigoSeccional54.value = costosStore.codigoSeccional54
      codigoGabinete.value = costosStore.codigoGabinete
      codigoPat.value = costosStore.codigoPat
      codigoPilar.value = costosStore.codigoPilar
      codigoProyecto.value = costosStore.codigoProyecto
      codigoPlano.value = costosStore.codigoPlano
      codigoLista.value = costosStore.codigoLista
      codigoALaVistaPVC.value = costosStore.codigoALaVistaPVC
      codigoEmbutidaPVC.value = costosStore.codigoEmbutidaPVC
      codigoDurlockPvc.value = costosStore.codigoDurlockPvc
      codigoPvcALaVista.value = costosStore.codigoPvcALaVista
      codigoPvcEmbutido.value = costosStore.codigoPvcEmbutido
      codigoSubterraneoXmetro.value = costosStore.codigoSubterraneoXmetro 
      codigoArtefactoCampana.value = costosStore.codigoArtefactoCampana
      codigoArtefactoExtractor.value = costosStore.codigoArtefactoExtractor
      codigoArtefactoVentilador.value = costosStore.codigoArtefactoVentilador
      codigoLuminariaAplique.value = costosStore.codigoLuminariaAplique
      codigoLuminariaColgante.value = costosStore.codigoLuminariaColgante
      codigoLuminariaExterior.value = costosStore.codigoLuminariaExterior
      codigoLuminariaLuzEmergencia.value = costosStore.codigoLuminariaLuzEmergencia
      codigoTermomagneticaMonofasico.value = costosStore.codigoTermomagneticaMonofasico
      codigoTermomagneticaTrifasico.value = costosStore.codigoTermomagneticaTrifasico
      codigoDiferencialMonofasico.value = costosStore.codigoDiferencialMonofasico
      codigoDiferencialTrifasico.value = costosStore.codigoDiferencialTrifasico
      codigoMonofasica.value = costosStore.codigoMonofasica
      codigoTrifasica.value = costosStore.codigoTrifasica
      codigoInstalacionMedidorMonofasico.value = costosStore.codigoInstalacionMedidorMonofasico
      codigoInstalacionMedidorTrifasico.value = costosStore.codigoInstalacionMedidorTrifasico
      codigoArmadoPilarMonofasico.value = costosStore.codigoArmadoPilarMonofasico
      codigoArmadoPilarTrifasico.value = costosStore.codigoArmadoPilarTrifasico
      codigoHasta30Bocas.value = costosStore.codigoHasta30Bocas
      codigoHasta50Bocas.value = costosStore.codigoHasta50Bocas
      codigoHasta100Bocas.value = costosStore.codigoHasta100Bocas
      codigoDiasHabiles.value = costosStore.codigoDiasHabiles
      codigoFindesFeriados.value = costosStore.codigoFindesFeriados
    })
    return {
      nombre,
      apellido,
      cuit,
      empresa,
      matricula,
      telefono,
      direccion,
      canalizacionLosa,
      canalizacionMamposteria,
      canalizacionConstruccionSeca,
      cableadoObraNueva,
      cableadoRecableado,
      conexionSimple,
      conexionDoble,
      conexionCombinacion,
      tableroPrincipal,
      tableroSeccional8,
      tableroSeccional36,
      tableroSeccional54,
      acometidaGabinete,
      acometidaPat,
      acometidaPilar,
      documentacionProyecto,
      documentacionPlano,
      documentacionLista,
      canalizacionEmbutidaPVC,
      canalizacionALaVistaPVC,
      canalizacionDurlockPvc,
      cableadoPvcEmbutido,
      cableadoPvcALaVista,
      cableadoSubterraneoXmetro,
      conexionArtefactoExtractor,
      conexionArtefactoCampana,
      conexionArtefactoVentilador,
      conexionLuminariaAplique,
      conexionLuminariaColgante,
      conexionLuminariaExterior,
      conexionLuminariaLuzEmergencia,
      tableroTermomagneticaMonofasico,
      tableroTermomagneticaTrifasico,
      tableroDiferencialMonofasico,
      tableroDiferencialTrifasico,
      acometidaMonofasica,
      acometidaTrifasica,
      acometidaInstalacionMedidorMonofasico,
      acometidaInstalacionMedidorTrifasico,
      acometidaArmadoPilarMonofasico,
      acometidaArmadoPilarTrifasico,
      documentacionHasta30Bocas,
      documentacionHasta50Bocas,
      documentacionHasta50Bocas,
      documentacionHasta100Bocas,
      emergenciasDiasHabiles,
      emergenciasFindesFeriados,
      codigoLosa,
      codigoMamposteria,
      codigoConstruccionSeca,
      codigoObraNueva,
      codigoRecableado,
      codigoSimple,
      codigoDoble,
      codigoCombinacion,
      codigoPrincipal,
      codigoSeccional8,
      codigoSeccional36,
      codigoSeccional54,
      codigoGabinete,
      codigoPat,
      codigoPilar,
      codigoProyecto,
      codigoPlano,
      codigoLista,
      codigoEmbutidaPVC,
      codigoALaVistaPVC,
      codigoDurlockPvc,
      codigoPvcEmbutido,
      codigoPvcALaVista,
      codigoSubterraneoXmetro,
      codigoArtefactoExtractor,
      codigoArtefactoCampana,
      codigoArtefactoVentilador,
      codigoLuminariaAplique,
      codigoLuminariaColgante,
      codigoLuminariaExterior,
      codigoLuminariaLuzEmergencia,
      codigoTermomagneticaMonofasico,
      codigoTermomagneticaTrifasico,
      codigoDiferencialMonofasico,
      codigoDiferencialTrifasico,
      codigoMonofasica,
      codigoTrifasica,
      codigoInstalacionMedidorMonofasico,
      codigoInstalacionMedidorTrifasico,
      codigoArmadoPilarMonofasico,
      codigoArmadoPilarTrifasico,
      codigoHasta30Bocas,
      codigoHasta50Bocas,
      codigoHasta100Bocas,
      codigoDiasHabiles,
      codigoFindesFeriados,
      update,
      updateC,
      logout,
      sidebarItems,
      scrollToSection,
      updateCanalizacion,
      updateCableado,
      updateConexion,
      updateTablero,
      updateAcometida,
      updateDocumentacion,
      updateEmergencias,
    }
  }
}
</script>

<template>
  <header class="head">
    <img class="img" src="../assets/logoelec.jpg">
    <h2 class="logo"></h2>
    <nav class="navigation">
      <router-link class="config__config" to="/mispresupuestos">Mis presupuestos</router-link>
      <router-link class="config__config" to="/dashboard">Presupuestar</router-link>
      <button class="btnLogin-popup" @click.prevent="logout">Logout</button>
    </nav>
  </header>
  <body>
    <div class="wrapper">
        <!--Top menu -->
        <div class="sidebar">
            <ul>
            <li v-for="item in sidebarItems" :key="item.id">
              <a :href="'#' + item.id" @click.prevent="scrollToSection(item.id)">
                <span class="icon"><i :class="item.icon"></i></span>
                <span class="item">{{ item.name }}</span>
              </a>
            </li>
          </ul>
        </div>

    </div>
    <div class="content">
  <div class="configuracion" id="datos">
    <h2>Mis datos</h2>
    <form @submit.prevent="update">
      <div class="config__input">
        <input type="text" required v-model="nombre"/>
        <label>Nombre</label>
      </div>
      <div class="config__input">
        <input type="text" required v-model="apellido" />
        <label>Apellido</label>
      </div>
      <div class="config__input">
        <input type="text" required v-model="cuit" />
        <label>Cuit</label>
      </div>
      <div class="config__input">
        <input type="text" required v-model="empresa" />
        <label>Empresa</label>
      </div>
      <div class="config__input">
        <input type="text" required v-model="matricula" />
        <label>Matricula</label>
      </div>
      <div class="config__input">
        <input type="text" required v-model="telefono" />
        <label>Telefono</label>
      </div>
      <div class="config__input">
        <input type="text" required v-model="direccion" />
        <label>Direccion</label>
      </div>
      <div class="config__btn">
        <button class="config__submit" type="submit">Guardar</button>
      </div>                        
    </form>
                  
  </div>
  <div class="configuracion" id="canalizacion">
    <h2>Canalizacion</h2>
    <form @submit.prevent="updateCanalizacion">
      <div class="config__costos">
      <div class="config__costos__">
        <div>
          <div class="config__input">
            <input type="number" v-model="canalizacionLosa">
            <label>En losa</label>
          </div>
         <div class="config__input">
            <input type="number" v-model="canalizacionMamposteria">
            <label>En mamposteria</label>
         </div>
         <div class="config__input">
            <input type="number" v-model="canalizacionConstruccionSeca">
            <label>Construccion Seca</label>
         </div>
         <div class="config__input">
            <input type="number" v-model="canalizacionALaVistaPVC">
            <label>A la vista con PVC</label>
         </div>
         <div class="config__input">
            <input type="number" v-model="canalizacionEmbutidaPVC">
            <label>Embutida con PVC</label>
         </div>
         <div class="config__input">
            <input type="number" v-model="canalizacionDurlockPvc">
            <label>En paredes de yeso con PVC</label>
         </div>
        </div>
      </div>
      <div class="descripcion">
        <p>INCLUYE</p>
        <p>-Instalación de centro de iluminación y caño de bajada, pudiendo encontrarse dentro de esta especificación un aplique de iluminación en pared.</p>
        <p>-Canaleteado e instalación de cañería plastica de 3/4 pulgada, más una caja rectangular para interruptores o tomas.</p>
        <p>-Tramo de cañería adicional para la interconexión con las otras cajas de defecto, o derivación de la instalación.</p>
        <p>-Empotrado de cajas y punteado de fijación de instalación con cemento u otro material.</p>
        <p>NO INCLUYE</p>
        <P>-Cobertura o revoque de la totalidad de la instalación.</P>
        <P>-Cableado de la cañería.</P>
        <P>-Montaje de tomas de energía e interruptores de efecto.</P>
        <P>-Instalación de artefactos lumínicos o ventilación.</P>
        <P>-Material de instalación.</P>
      </div>
      </div>
      <div class="config__btn">
        <button class="config__submit" type="submit">Guardar</button>
      </div>   
    </form>
  </div>
  <div class="configuracion" id="cableado">
    <h2>Cableado</h2>
    <form @submit.prevent="updateCableado">
      <div class="config__costos">
      <div class="config__costos__">
        <div>
          <div class="config__input">
            <input type="number" v-model="cableadoObraNueva">
            <label>Obra Nueva</label>
          </div>
         <div class="config__input">
            <input type="number" v-model="cableadoRecableado">
            <label>Recableado</label>
         </div>
         <div class="config__input">
            <input type="number" v-model="cableadoPvcALaVista">
            <label>Pvc a la vista</label>
         </div>
         <div class="config__input">
            <input type="number" v-model="cableadoPvcEmbutido">
            <label>Pvc embutido</label>
         </div>
         <div class="config__input">
            <input type="number" v-model="cableadoSubterraneoXmetro">
            <label>Subterraneo por metro</label>
         </div>
        </div>
      </div>
      <div class="descripcion">
        <p>INCLUYE</p>
        <p>-Cableado de hasta 5 m en cañería metálica o plástica ,embutida, en durlock, a la vista.</p>
        <p>-Conexión de conductores a elementos terminales, entre, la caja de interruptores o tomas, al centro de iluminación, aplique en pared o tablero de comando.</p>
        <p>-El conductor de instalación está previsto de, hasta 2,5 mm de sección.</p>
        <p>-Conexión de hasta un interruptor de efecto, toma, o elemento electrónicos, tales como tomas USB, vareadores lumínicos, o cualquier otro de similares características.</p>
        <p>RECABLEADO</p>
        <P>-Desmontaje de instalacion electrica existente.</P>
        <p>-Re-conexion de interruptores, tomas y demas elementos instalados previamente.</p>
        <p>-Reinstalacion de luminarias y artefactos.</p>
        <P>SUBTERRANEO POR METRO</P>
        <P>-Zanjeo, colocacion del cable, proteccion mecanica, cierre de zanja, verificar con centro de distrubucion reglamentacion para el trabajo.</P>
      </div>
      </div>
      <div class="config__btn">
        <button class="config__submit" type="submit">Guardar</button>
      </div>   
    </form>
  </div>
  <div class="configuracion" id="conexion">
    <h2>Conexion</h2>
    <form @submit.prevent="updateConexion">
      <div class="config__costos">
        <div class="config__costos__">
          <div>
            <div class="config__input">
              <input type="number" v-model="conexionSimple">
              <label>Punto,Toma Simple</label>
            </div>
          <div class="config__input">
              <input type="number" v-model="conexionDoble">
              <label>Toma Doble</label>
          </div>
          <div class="config__input">
            <input type="number" v-model="conexionCombinacion">
            <label>Punto Combinacion</label>
          </div>
          <div class="config__input">
            <input type="number" v-model="conexionArtefactoCampana">
            <label>Colocacion campana</label>
          </div>  
          <div class="config__input">
            <input type="number" v-model="conexionArtefactoExtractor">
            <label>Colocacion extractor</label>
          </div>  
          <div class="config__input">
            <input type="number" v-model="conexionArtefactoVentilador">
            <label>Colocacion ventilador</label>
          </div>  
          <div class="config__input">
            <input type="number" v-model="conexionLuminariaAplique">
            <label>Luminaria: aplique</label>
          </div>  
          <div class="config__input">
            <input type="number" v-model="conexionLuminariaColgante">
            <label>Luminaria: colgante</label>
          </div>  
          <div class="config__input">
            <input type="number" v-model="conexionLuminariaExterior">
            <label>Luminaria: exterior</label>
          </div>  
          <div class="config__input">
            <input type="number" v-model="conexionLuminariaLuzEmergencia">
            <label>Luz de emergencia</label>
          </div>    
          </div>
          <div class="descripcion">
            <p>INCLUYE</p>
            <P>LUMINARIA</P>
            <p>-Armado de aplique.</p>
            <p>-Fijación de aplique a pared o caja.</p>
            <p>-Conexión de alimentación al punto habilitado más próximo.</p>
            <P>ARTEFACTOS</P>
            <P>-Fijacion del artefacto.</P>
            <p>-Conexion a la instalacion electrica.</p>
          </div>
        </div>
      </div>
      <div class="config__btn">
        <button class="config__submit" type="submit">Guardar</button>
      </div>   
    </form>
  </div>
  <div class="configuracion" id="tablero">
    <h2>Tablero</h2>
    <form @submit.prevent="updateTablero">
      <div class="config__costos">
        <div class="config__costos__">

          <div>
            <div class="config__input">
              <input type="number" v-model="tableroPrincipal">
              <label>Principal</label>
            </div>
          <div class="config__input">
              <input type="number" v-model="tableroSeccional8">
              <label>Seccional 8 polos</label>
          </div>
          <div class="config__input">
            <input type="number" v-model="tableroSeccional36">
            <label>Seccional 8/36 polos</label>
          </div> 
          <div class="config__input">
            <input type="number" v-model="tableroSeccional54">
            <label>Seccional +36 polos</label>
          </div>  
          <div class="config__input">
            <input type="number" v-model="tableroTermomagneticaMonofasico">
            <label>Termomagnetica Monofasico</label>
          </div>  
          <div class="config__input">
            <input type="number" v-model="tableroTermomagneticaTrifasico">
            <label>Termomagnetica Trifasico</label>
          </div>  
          <div class="config__input">
            <input type="number" v-model="tableroDiferencialMonofasico">
            <label>DIferencial Monofasico</label>
          </div>  
          <div class="config__input">
            <input type="number" v-model="tableroDiferencialTrifasico">
            <label>Diferencia Trifasico</label>
          </div>  
          </div>
          <div class="descripcion">
            <p>INCLUYE</p>
            <p>Conexión mecánica de cañerías de circuitos mediante conectores.</p>
            <p>Fijacion o empotrado de gabinete.</p>
            <p>Armado de tablero.</p>
            <p>Conexión de protecciones a circuitos.</p>
          </div>
        </div>
      </div>
      <div class="config__btn">
        <button class="config__submit" type="submit">Guardar</button>
      </div>   
    </form>
  </div>
  <div class="configuracion" id="acometida">
    <h2>Acometida</h2>
    <form @submit.prevent="updateAcometida">
      <div class="config__costos">
      <div class="config__costos__">
        <div>
          <div class="config__input">
            <input type="number" v-model="acometidaGabinete">
            <label>Gabinete</label>
          </div>
         <div class="config__input">
          <input type="number" v-model="acometidaPat">
          <label>PAT de servicio</label>
         </div>
         <div class="config__input">
          <input type="number" v-model="acometidaPilar">
          <label>Pilar completo</label>
         </div>  
         <div class="config__input">
          <input type="number" v-model="acometidaMonofasica">
          <label>Acometida Monofasica</label>
         </div>  
         <div class="config__input">
          <input type="number" v-model="acometidaTrifasica">
          <label>Acometida Trifasica</label>
         </div>  
         <div class="config__input">
          <input type="number" v-model="acometidaInstalacionMedidorMonofasico">
          <label>Instalacion Medidor Monofasico</label>
         </div>  
         <div class="config__input">
          <input type="number" v-model="acometidaInstalacionMedidorTrifasico">
          <label>Instalacion Medidor Trifasico</label>
         </div>  
         <div class="config__input">
          <input type="number" v-model="acometidaArmadoPilarMonofasico">
          <label>Armado Completo Pilar Monofasico</label>
         </div>  
         <div class="config__input">
          <input type="number" v-model="acometidaArmadoPilarTrifasico">
          <label>Armado Completo Pilar Trifasico</label>
         </div>  
        </div>
      </div>
      <div class="descripcion">
        <P>INLCUYE</P>
        <p>Cantaleteado de pared y empotrado de caño de bajada de doble Aislación. </p>
        <p>Amurado de gabinete de medición de energía.</p>
        <p>Instalación y conexión de la jabalina para puesta a tierra de servicio al gabinete de medidor.</p>
        <p>Amurado de gabinete de protecciones.</p>
        <p>Cableado e instalación de protección termomagnética y diferencial.</p>
      </div>
      </div>
      <div class="config__btn">
        <button class="config__submit" type="submit">Guardar</button>
      </div>   
    </form>
  </div>
  <div class="configuracion" id="documentacion">
    <h2>Documentacion</h2>
    <form @submit.prevent="updateDocumentacion">
      <div class="config__costos">
      <div class="config__costos__">
        <div>
          <div class="config__input">
            <input type="number" v-model="documentacionProyecto">
            <label>Proyecto elect x m2</label>
          </div>
         <div class="config__input">
            <input type="number" v-model="documentacionPlano">
            <label>Plano electrico x m2</label>
         </div>
         <div class="config__input">
          <input type="number" v-model="documentacionLista">
          <label>Lista de materiales</label>
         </div> 
         <div class="config__input">
          <input type="number" v-model="documentacionHasta30Bocas">
          <label>Proyecto completo hasta 30 bocas</label>
         </div> 
         <div class="config__input">
          <input type="number" v-model="documentacionHasta50Bocas">
          <label>Proyecto completo hasta 50 bocas</label>
         </div> 
         <div class="config__input">
          <input type="number" v-model="documentacionHasta100Bocas">
          <label>Proyecto completo hasta 100 bocas</label>
         </div> 
        </div>
        <div class="descripcion">
          <P>INCLUYE</P>
          <p>Distribución de los circuitos, bocas, líneas seccionales, tableros , etc. </p>
          <p>Plano de obra. Esquemas unifilares de tableros. Planillas de Carga.</p>
          <p>Memoria Técnica.</p>
          <p>Listado de materiales.</p>
        </div>
        </div>
        </div>
        <div class="config__btn">
          <button class="config__submit" type="submit">Guardar</button>
        </div>   
    </form>
  </div>
  <div class="configuracion" id="emergencias">
    <h2>Urgencias</h2>
    <form @submit.prevent="updateEmergencias">
      <div class="config__costos">
      <div class="config__costos__">
        <div>
          <div class="config__input">
            <input type="number" v-model="emergenciasDiasHabiles">
            <label>Dias habiles</label>
          </div>
         <div class="config__input">
            <input type="number" v-model="emergenciasFindesFeriados">
            <label>Fines de semana y Feriados</label>
         </div>
        </div>
        <div class="descripcion">
          <p>INCLUYE</p>
          <p>Considerar un tiempo maximo de urgencia entre 3 y 5 horas.</p>
          <p>Traslado al lugar de emergencia dentro de los limites de la ciudad.</p>
          <p>Reparacion de la anomalia.</p>
        </div>
      </div>
      </div>
      <div class="config__btn">
        <button class="config__submit" type="submit">Guardar</button>
      </div>   
    </form>
  </div>
    </div>
  </body>
</template>

<style scoped>
@import "../styles/navbar.css";


body{
  position: absolute;
  display: grid;
  grid-template-columns: 1fr auto;
  margin-top: 100px;
}
.content{
  margin-left: 250px;
}
.configuracion {
  margin-bottom: 20px;
  width: 1400px;
  padding: 40px;
  background: #282828;
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
  box-sizing: border-box;
  box-shadow: 0 15px 25px rgba(0, 0, 0, 0.6);
  border-radius: 10px;
}
.configuracion h2 {
  margin-bottom: 60px;
  color: rgb(212, 212, 212);
  text-align: center;
  font-size: 36px;
}

.config__input {
  position: relative;
}
.config__input input {
  font-size: 18px;
  width: 100%;
  padding: 10px 0;
  color: rgb(212, 212, 212);
  margin-bottom: 40px;
  border: none;
  border-bottom: 1px solid rgb(212, 212, 212);
  outline: none;
  background: transparent;
}
.config__input label {
  position: absolute;
  top: 0;
  left: 0;
  padding: 10px 0;
  color: rgb(212, 212, 212);
  pointer-events: none;
  transition: 0.5s;
}
.config__input input:focus ~ label,
.config__input input:valid ~ label {
  top: -30px;
  left: 0;
  color: #9df0ff;
  font-size: 18px;
}
.config__submit {
  width: 130px;
  height: 50px;
  background: transparent;
  border: 2px solid rgb(212, 212, 212);
  outline: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1em;
  color: rgb(212, 212, 212);
  font-weight: 500;
  margin-left: 44%;
  transition: .5s;
}
.config__submit:hover{
  background: rgb(212, 212, 212);
  color:black;
}
.config__btn{
  padding: 50px;
}

.config__costos__ {
  position: relative;
  display:grid;
  font-size: 18px;
}
.config__costos__ input {
  width: 20%;
  padding: 20px 0;
  color: rgb(212, 212, 212);
  margin-bottom: 30px;
  border: none;
  border-bottom: 1px solid rgb(212, 212, 212);
  outline: none;
  background: transparent;
}
.descripcion p {
  padding: 15px;
  font-size: 18px;
  color: rgb(212, 212, 212);
  
}
.config__costos__ label {
  position: absolute;
  top: 0;
  left: 0;
  padding: 10px 0;
  color: rgb(212, 212, 212);
  pointer-events: none;
  transition: 0.5s;
}
.config__costos__ input:focus ~ label,
.config__costos__ input:valid ~ label {
  top: -20px;
  left: 0;
  color: #9df0ff;
}

.wrapper .sidebar{
    background: rgb(0, 0, 0);
    position: fixed;
    margin-top: 70px;
    top: 0;
    left: 0;
    width: 225px;
    height: 100%;
    padding: 20px;
    transition: all 0.5s ease;
}
.wrapper .sidebar ul li a{
  display: block;
  padding: 0px 0px;
  position: relative;
  font-size: 1.1em;
  
  color: rgb(212, 212, 212);
  text-decoration: none;
  font-weight: 500;
  margin-left: 40px;
  margin-top: 40px;
  
}
.sidebar a::after{
  content:"";
  position: absolute;
  left: 0;
  bottom: -6px;
  width: 100%;
  height: 3px;
  background: rgb(212, 212, 212);
  border-radius: 5px;
  transform-origin: right;
  transform: scaleX(0);
  transition: transform .5s;
}
.sidebar a:hover::after{
  transform-origin: left;
  transform: scaleX(1);
}


</style>