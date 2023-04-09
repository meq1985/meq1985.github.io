<script setup>
import { useUserStore } from '../stores/user';
import { onMounted } from 'vue';
import { ref } from "vue";
import { PostStore } from '../stores/dbUsers';
import { costoStore } from "../stores/dbCostos";

const store = PostStore();
const costosStore = costoStore();

onMounted(() => {
  store.obtenerDato();
  costosStore.obtenerCostos(); 
})

const nombre = ref(store.nombre1);
const apellido = ref(store.apellido1);
const cuit = ref(store.cuit1);
const empresa = ref(store.empresa1);
const telefono = ref(store.telefono1);
const direccion = ref(store.direccion1);

const canalizacionLosa = ref(costosStore.canalizacionLosa);
const canalizacionMamposteria = ref(costosStore.canalizacionMamposteria);
const canalizacionConstruccionSeca = ref(costosStore.canalizacionConstruccionSeca);
const cableadoObraNueva = ref(costosStore.cableadoObraNueva);
const cableadoRecableado = ref(costosStore.cableadoRecableado);
const conexionSimple = ref(costosStore.conexionSimple);
const conexionDoble = ref(costosStore.conexionDoble);
const conexionCombinacion = ref(costosStore.conexionCombinacion);
const tableroPrincipal = ref(costosStore.tableroPrincipal);
const tableroSeccional8 = ref(costosStore.tableroSeccional8);
const tableroSeccional36 = ref(costosStore.tableroSeccional36);
const tableroSeccional54 = ref(costosStore.tableroSeccional54);
const acometidaGabinete = ref(costosStore.acometidaGabinete);
const acometidaPat = ref(costosStore.acometidaPat);
const acometidaPilar = ref(costosStore.acometidaPilar);
const documentacionProyecto = ref(costosStore.documentacionProyecto);
const documentacionPlano = ref(costosStore.documentacionPlano);
const documentacionLista = ref(costosStore.documentacionLista); 

const userStore = useUserStore();
const update = () => {
  store.updateItem(nombre.value, apellido.value, cuit.value, empresa.value, telefono.value, direccion.value);
};

const updateC = () => {
  costosStore.updateCostos(canalizacionLosa.value, canalizacionMamposteria.value, canalizacionConstruccionSeca.value, cableadoObraNueva.value, cableadoRecableado.value, 
            conexionSimple.value, conexionDoble.value, conexionCombinacion.value,tableroPrincipal.value,tableroSeccional8.value,tableroSeccional36.value,tableroSeccional54.value,
            acometidaGabinete.value, acometidaPat.value, acometidaPilar.value, documentacionProyecto.value, documentacionPlano.value, documentacionLista.value);
};

const logout = () => {
  userStore.logout();
};
</script>

<template>
  <header class="head">
    <div class="config__var">
      <button class="config__logout" @click.prevent="logout">Logout</button>
      <router-link class="config__config" to="/dashboard">Dash</router-link
    >
    </div> 
  </header>
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

</template>

<style scoped>
.head {
  width: auto;
  height: 200px;
  margin-bottom: 0px;
  background-image: url(../assets/focos.jpg);
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  color: #fff;
  text-align: center;
  clip-path: polygon(100% 0, 100% 100%, 50% 100%, 0 100%, 0 0);
  margin-bottom: 10px;
}
.estructura{
  display: grid;
  grid-template-columns: 1fr 2fr;
}
.configuracion {
  margin:auto;
  
  width: 400px;
  padding: 40px;
  background: #282828;
  box-sizing: border-box;
  box-shadow: 0 15px 25px rgba(0, 0, 0, 0.6);
  border-radius: 10px;

  
}

h2 {
  margin-bottom: 30px;
  color: #fff;
  text-align: center;
}

.config__input {
  position: relative;
}


.config__input input {
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
  top: -20px;
  left: 0;
  color: #03e9f4;
  font-size: 12px;
}


.config__btn {
  display:flex;
  justify-content: center;
}

.config__submit {
  color: #1b1c1b;
  padding: 0.7em 1.7em;
  font-size: 18px;
  border-radius: 0.5em;
  background: #e8e8e8;
  border: none;
  cursor: pointer;
  margin-right: 2em;
}

.config__var {
  display:flex;
  justify-content:end;
}

.config__logout {
  color: #1b1c1b;
  padding: 0.7em 1.7em;
  font-size: 18px;
  border-radius: 0.5em;
  background: #e8e8e8;
  border: none;
  cursor: pointer;
  margin-right: 10px;
  margin-top: 10px;
}

.config__config {
  color: #1b1c1b;
  padding: 0.7em 1.7em;
  font-size: 18px;
  border-radius: 0.5em;
  background: #e8e8e8;
  border: none;
  cursor: pointer;
  margin-right: 10px;
  margin-top: 10px;
  outline: none;
  text-decoration: none;
}
.configuracion__costos {
  margin:auto;
  width: 1000px;
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
  gap: 20px;
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
.config__costos label {
  position: absolute;
  top: 0;
  left: 0;
  padding: 10px 0;
  color: #fff;
  pointer-events: none;
  transition: 0.5s;
}
.config__costos input:focus ~ label,
.config__costos input:valid ~ label {
  top: -20px;
  left: 0;
  color: #03e9f4;
  font-size: 12px;
}
.config__costos__ {
  position: relative;
  display:grid;
  grid-template-columns: 1fr 1fr;
  
  
}
.config__costos__ input {
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
  color: #03e9f4;
  font-size: 12px;
}


</style>
