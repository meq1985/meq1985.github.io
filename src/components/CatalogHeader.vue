<script setup>
import { useUserStore } from '../stores/user';
const userStore = useUserStore();
</script>
<template>
  <div class="catalog-nav">
    <img src="../assets/logoelec.jpg" alt="Presupuestos eléctricos" />
    <nav aria-label="Navegación principal">
      <router-link to="/dashboard">Presupuestar</router-link>
      <router-link to="/config">Configuración</router-link>
      <router-link to="/mispresupuestos">Mis presupuestos</router-link>
      <button @click="userStore.logout()">Salir</button>
    </nav>
  </div>
</template>
