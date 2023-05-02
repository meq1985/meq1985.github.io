<script>
import { onMounted } from 'vue';
import { ref } from "vue";
import { ref as firebaseRef, getStorage, list} from "firebase/storage";
import { getAuth } from "firebase/auth";

export default {
  setup() {
    
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
        <span class="icon"><font-awesome-icon icon="fa-regular fa-file-pdf" /></span>
        <p>{{ pdf?.name }}</p>
      </div>
      <div>
        <span class="icon"><font-awesome-icon icon="fa-solid fa-envelope" /></span>
        <span class="icon"><font-awesome-icon icon="fa-solid fa-download" /></span>
        <span class="icon"><font-awesome-icon icon="fa-solid fa-share" /></span>
        <span class="icon"><font-awesome-icon icon="fa-solid fa-trash-can" /></span>
        
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
  display: flex;
  justify-content: space-between;
}
.pdfImg{
  max-width: 120px;
  background: transparent;
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