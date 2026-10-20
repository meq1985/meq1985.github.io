<script>
import { useUserStore } from '../stores/user';
import { onMounted, ref } from 'vue';
import { requireUser } from '../firebase/session';
import { listBudgets, deleteBudget, downloadBudget } from '../services/localBudgets';

export default {
  setup() {
    const userStore = useUserStore();
    const pdfList = ref([]);
    const error = ref('');
    const loading = ref(true);
    const pageTokenExample = async () => {
      try {
        const user = await requireUser();
        pdfList.value = await listBudgets(user.uid);
      } catch (err) { error.value = 'No se pudieron cargar los presupuestos: ' + err.message; }
      finally { loading.value = false; }
    };
    const deletePdf = async pdf => {
      if (!confirm('¿Eliminar este presupuesto de este navegador?')) return;
      try {
        const user = await requireUser();
        await deleteBudget(user.uid, pdf.id);
        pdfList.value = pdfList.value.filter(item => item.id !== pdf.id);
      } catch (err) { error.value = 'No se pudo eliminar: ' + err.message; }
    };
    const descargarPdf = async pdf => {
      try {
        const user = await requireUser();
        if (pdf.owner !== user.uid) throw new Error('La cuenta no coincide.');
        downloadBudget(pdf);
      } catch (err) { error.value = 'No se pudo descargar: ' + err.message; }
    };
    onMounted(pageTokenExample);
    return { pdfList, error, loading, deletePdf, descargarPdf, logout: () => userStore.logout() };
  }
};
</script>

<template>
  <header class="head">
    <img class="img" src="../assets/logoelec.jpg">
    <h2 class="logo"></h2>
    <nav class="navigation">
      <router-link class="config__config" to="/dashboard">Presupuestar</router-link>
      <router-link class="config__config" to="/config">Configuracion</router-link>
      <button class="btnLogin-popup" @click.prevent="logout">Logout</button>
    </nav>
  </header>
  <div class="page-content">
  <div class="configuracion">
    <p style="color: white; grid-column: 1 / -1">Guardados en este navegador y dispositivo. Descargá una copia: borrar los datos del navegador elimina estos archivos. Los PDF antiguos de Firebase Storage no se migraron.</p>
    <p v-if="error" role="alert" style="color: white">{{ error }}</p>
    <p v-else-if="loading" style="color: white">Cargando…</p>
    <p v-else-if="!pdfList.length" style="color: white">Todavía no hay presupuestos locales.</p>
    <div class="pdfList" v-for="pdf in pdfList" :key="pdf.id">
      <div>
        <span class="iconPdf"><font-awesome-icon icon="fa-regular fa-file-pdf" /></span>
        <p>{{ pdf.cliente }} — {{ pdf.createdAt.slice(0, 10) }}</p>
      </div>
      <div class="iconos">

        <button type="button" class="icon" aria-label="Descargar presupuesto" @click.prevent="() => descargarPdf(pdf)"><font-awesome-icon icon="fa-solid fa-download" /></button>

        <button type="button" class="icon" aria-label="Eliminar presupuesto" @click.prevent="() => deletePdf(pdf)" ><font-awesome-icon icon="fa-solid fa-trash-can"  /></button>
      </div>
    </div>
  </div>
  </div>
</template>

<style scoped>
@import "../styles/navbar.css";
.configuracion {
  margin: 100px auto;
  width: 1400px;
  padding: 40px;
  background: #282828;
  box-sizing: border-box;
  box-shadow: 0 15px 25px rgba(0, 0, 0, 0.6);
  border-radius: 10px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
}
.pdfList{
  width: 200px;
  height: 200px;
  border: 2px solid rgb(212, 212, 212);
  border-radius: 6px;
  display: grid;
  grid-template-rows: 1fr auto;

}
.pdfList p{
  color:white;
  display: flex;
  justify-content: center;
  align-items: center;
}
.iconPdf{
  padding: 20px;
  font-size: 3em;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
}
.iconos{
  padding: 20px;
  font-size: 1.2em;
  display: flex;
  justify-content: end;
  gap: 20px;
  cursor: pointer;
}
.icon{
  color: white;
  background: transparent;
  border: 0;
  font-size: inherit;
  cursor: pointer;
}
.configuracion h2 {
  margin-bottom: 30px;
  color: rgb(212, 212, 212);
  text-align: center;
}
.btn {
  width: 200px;
  height: 50px;
  background: transparent;
  border: 2px solid rgb(212, 212, 212);
  outline: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1em;
  color: rgb(212, 212, 212);
  font-weight: 500;
  margin-left: 10px;
  transition: .5s;
}
.btn:hover{
  background: rgb(212, 212, 212);
  color:black;
}
</style>
