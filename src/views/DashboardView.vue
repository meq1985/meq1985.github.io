<script setup>
import { useUserStore } from '../stores/user';
import { onMounted } from 'vue';
import { PostStore } from '../stores/dbUsers';
import { costoStore } from "../stores/dbCostos";

const userStore = useUserStore();
const store = PostStore();
const costosStore = costoStore();

onMounted(() => {
  store.obtenerDato();
  costosStore.obtenerCostos();
})

const logout = () => {
  userStore.logout();
};
</script>


<template>
  <header class="head">
    <div class="config__var">
      <button class="config__logout" @click.prevent="logout">Logout</button>    
      <router-link class="config__config" to="/config">Config</router-link
    >
    </div> 
  </header>
  <div class="configuracion">
    <h2>Dash</h2>
       
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
.configuracion {
  margin: 100px auto;
  width: 400px;
  padding: 40px;
  background: #282828;
  box-sizing: border-box;
  box-shadow: 0 15px 25px rgba(0, 0, 0, 0.6);
  border-radius: 10px;
}

.configuracion h2 {
  margin-bottom: 30px;
  color: #fff;
  text-align: center;
}

.configuracion .config__input {
  position: relative;
}

.configuracion .config__input input {
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
.configuracion .config__input label {
  position: absolute;
  top: 0;
  left: 0;
  padding: 10px 0;
  color: #fff;
  pointer-events: none;
  transition: 0.5s;
}

.configuracion .config__input input:focus ~ label,
.configuracion .config__input input:valid ~ label {
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
  padding: 0.7em 1.2em;
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
  padding: 0.7em 1.2em;
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

</style>
