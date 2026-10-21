<script setup>
import BrandMark from './BrandMark.vue';
import { useUserStore } from '../stores/user';
const userStore = useUserStore();
</script>
<template>
  <div class="catalog-nav">
    <router-link to="/" aria-label="Electricidad Domiciliaria, inicio"><BrandMark class="catalog-logo" /></router-link>
    <nav aria-label="Navegación principal">
      <router-link to="/dashboard">Presupuestar</router-link>
      <router-link to="/config">Configuración</router-link>
      <router-link to="/proyectos">Mis proyectos</router-link>
      <button @click="userStore.logout()">Salir</button>
    </nav>
  </div>
</template>
