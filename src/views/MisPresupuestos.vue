<script>
import { useUserStore } from '../stores/user';
import { onMounted } from 'vue';
import { ref } from "vue";
import { ref as firebaseRef, getStorage, list, deleteObject, getDownloadURL} from "firebase/storage";
import { getAuth } from "firebase/auth";

export default {
  setup() {
    const userStore = useUserStore();
    const pdfList = ref([]);
    async function pageTokenExample(){
      
      const storage = getStorage();
      const auth = getAuth();
      const user = auth.currentUser;  
      const id = user.email;
      const listRef = firebaseRef(storage, 'pdfs/'+ id + '/');
      
      const firstPage = await list(listRef, { maxResults: 100 });
      pdfList.value = firstPage.items;
      
      if (firstPage.nextPageToken) {
        const secondPage = await list(listRef, {
          maxResults: 100,
          pageToken: firstPage.nextPageToken,
        });
        pdfList.value = pdfList.value.concat(secondPage.items);
        
      }
    }

    const deletePdf = async (pdf) => {
      const storage = getStorage();
      const auth = getAuth();
      const user = auth.currentUser;
      const id = user.email;
      const pdfRef = firebaseRef(storage, `pdfs/${id}/${pdf.name}`);
      await deleteObject(pdfRef);
      pdfList.value = pdfList.value.filter(item => item !== pdf);
    }
    
    const descargarPdf = async (pdf) => {
      const storage = getStorage();
      const auth = getAuth();
      const user = auth.currentUser;
      const id = user.email;
      const pdfRef = firebaseRef(storage, `pdfs/${id}/${pdf.name}`);
      const downloadUrl = await getDownloadURL(pdfRef);
      window.open(downloadUrl, '_blank'); // abrir la URL en una nueva pestaña
    }
  
    /*const imprimirPdf = async (pdf) => {
      const storage = getStorage();
      const auth = getAuth();
      const user = auth.currentUser;
      const id = user.email;
      const pdfRef = firebaseRef(storage, `pdfs/${id}/${pdf.name}`);
      const url = await getDownloadURL(pdfRef);
      window.print(url, '_blank');
      
    }*/
  
    const logout = () => {
      userStore.logout();
    };
    onMounted(async () => {
      await pageTokenExample();
    })
    return {
      pageTokenExample,
      logout,
      pdfList,
      deletePdf,
      descargarPdf,
    }
  }
}
</script>

<template>
  <header class="head">
    <img class="img" src="../assets/logoelec.jpg">
    <h2 class="logo">Mis Presupuestos</h2>
    <nav class="navigation">
      <router-link class="config__config" to="/dashboard">Dashboard</router-link>
      <router-link class="config__config" to="/config">Configuracion</router-link>
      <button class="btnLogin-popup" @click.prevent="logout">Logout</button>
    </nav>
  </header>
  <body>
  <div class="configuracion">
    <div class="pdfList" v-for="pdf in pdfList" :key="pdf.name">
      <div>
        <span class="iconPdf"><font-awesome-icon icon="fa-regular fa-file-pdf" /></span>
        <p>{{ pdf.name }}</p>
      </div>
      <div class="iconos">
        <span class="icon"><font-awesome-icon icon="fa-solid fa-envelope" /></span>
        <span class="icon" @click.prevent="() => descargarPdf(pdf)"><font-awesome-icon icon="fa-solid fa-download" /></span>
        <span class="icon" ><font-awesome-icon icon="fa-solid fa-share" /></span>
        <span class="icon" @click.prevent="() => deletePdf(pdf)" ><font-awesome-icon icon="fa-solid fa-trash-can"  /></span>
      </div>
    </div>
  </div>
  </body>
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
  gap: 20px;
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
  justify-content: space-between;
  gap: 20px;
  cursor: pointer;
}
.icon{
  color: white;
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