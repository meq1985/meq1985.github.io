<script>
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
    const nombre = ref('')
    const apellido = ref('')
    const cuit = ref('')
    const empresa = ref('')
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

    const update = () => {
      store.updateItem(nombre.value, apellido.value, cuit.value, empresa.value, telefono.value, direccion.value);
    }

    const updateC = () => {
      costosStore.updateCostos(canalizacionLosa.value, canalizacionMamposteria.value, canalizacionConstruccionSeca.value, cableadoObraNueva.value, cableadoRecableado.value, 
              conexionSimple.value, conexionDoble.value, conexionCombinacion.value,tableroPrincipal.value,tableroSeccional8.value,tableroSeccional36.value,tableroSeccional54.value,
              acometidaGabinete.value, acometidaPat.value, acometidaPilar.value, documentacionProyecto.value, documentacionPlano.value, documentacionLista.value);
    };

    const logout = () => {
      userStore.logout();
    };

    onMounted(async () => {
      await store.obtenerDato()
      await costosStore.obtenerCostos(); 
      nombre.value = store.nombre1
      apellido.value = store.apellido1
      cuit.value = store.cuit1
      empresa.value = store.empresa1
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
    })

    return {
      nombre,
      apellido,
      cuit,
      empresa,
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
      update,
      updateC,
      logout
    }
  }
}
</script>

<template>
  <header class="head">
    <img class="img" src="../assets/logoelec.jpg">
    <h2 class="logo">Configuracion</h2>
    <nav class="navigation">
      <router-link class="config__config" to="/dashboard">Dashboard</router-link>
      <button class="btnLogin-popup" @click.prevent="logout">Logout</button>
    </nav>
  </header>
  <body>
    <div class="estructura">
    <div class="configuracion">
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
  <div class="configuracion__costos">
    <h2>Costos</h2>
    <form @submit.prevent="updateC">
      <div class="config__costos">
        <div class="config__costos__">
        <div>
          <label>Canalizacion</label>
        </div>
        <div>
          <div class="config__input">
            <input type="number" v-model="canalizacionLosa">
            <label>En losa</label>
          </div>
         <div class="config__input">
            <input type="number" v-model="canalizacionMamposteria">
            <label>En manposteria</label>
         </div>
         <div class="config__input">
          <input type="number" v-model="canalizacionConstruccionSeca">
          <label>En construccion seca</label>
         </div>  
        </div>
      </div>
      <div class="config__costos__">
        <div>
          <label>Cableado</label>
        </div>
        <div>
          <div class="config__input">
            <input type="number" v-model="cableadoObraNueva">
            <label>Obra Nueva</label>
          </div>
         <div class="config__input">
            <input type="number" v-model="cableadoRecableado">
            <label>Recableado</label>
         </div>
        </div>
      </div>
      <div class="config__costos__">
        <div>
          <label>Conexion</label>
        </div>
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
        </div>
      </div>
      <div class="config__costos__">
        <div>
          <label>Tablero</label>
        </div>
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
        </div>
      </div>
      <div class="config__costos__">
        <div>
          <label>Acometida</label>
        </div>
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
        </div>
      </div>
      <div class="config__costos__">
        <div>
          <label>Documentacion</label>
        </div>
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
.estructura{
  margin-top: 10px;
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
}

.configuracion {
  margin:auto;
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
  color: #fff;
  text-align: center;
  font-size: 36px;
}
.configuracion__costos h2 {
  margin-bottom: 60px;
  color: #fff;
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
  color: #fff;
  margin-bottom: 40px;
  border: none;
  border-bottom: 1px solid #fff;
  outline: none;
  background: transparent;
}
.config__input label {
  position: absolute;
  top: 0;
  left: 0;
  padding: 10px 0;
  color: #fff;
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
  border: 2px solid white;
  outline: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1em;
  color: white;
  font-weight: 500;
  margin-left: 44%;
  transition: .5s;
  
}
.config__submit:hover{
  background: white;
  color:black;
}


.configuracion__costos {
  margin:auto;
  width: 1400px;
  padding: 40px;
  background: #282828;
  box-sizing: border-box;
  box-shadow: 0 15px 25px rgba(0, 0, 0, 0.6);
  border-radius: 10px;
 
}
.config__costos {
  position: relative;
  width:auto;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 40px;
}
.config__costos input {
  font-size: 18px;
  width: 100%;
  padding: 10px 0;
  color: #fff;
  margin-bottom: 30px;
  border: none;
  border-bottom: 1px solid #fff;
  outline: none;
  background: transparent;
}

.config__costos__ {
  position: relative;
  display:grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  font-size: 18px;
}
.config__costos__ input {
  width: 100%;
  padding: 20px 0;
  color: #fff;
  margin-bottom: 30px;
  border: none;
  border-bottom: 1px solid #fff;
  outline: none;
  background: transparent;
}
.config__costos__ label {
  position: absolute;
  top: 0;
  left: 0;
  padding: 10px 0;
  color: #fff;
  pointer-events: none;
  transition: 0.5s;
}
.config__costos__ input:focus ~ label,
.config__costos__ input:valid ~ label {
  top: -20px;
  left: 0;
  color: #9df0ff;
}


</style>
