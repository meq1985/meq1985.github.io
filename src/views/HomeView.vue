<script type="module">

import { ref } from "/node_modules/vue/dist/vue.esm-browser.js";
import { useUserStore } from "../stores/user";
import { getAuth } from "firebase/auth";
import { PostStore } from '../stores/dbUsers';
import { costoStore } from "../stores/dbCostos";

export default {
  setup() {
    const store = PostStore();
    const costosStore = costoStore();
    const email = ref("");
    const password = ref("");
    const userStore = useUserStore();

    const register = () => {
      userStore.register(email.value, password.value);
      store.addItem(email.value);
      costosStore.addCostos(email.value);
    };

    const login = () => {
      userStore.login(email.value, password.value);
      
      
    };

    const recoveryPassword = () => {
      userStore.resetPassword(email.value); 
    };

    const auth = getAuth();
    const user = auth.currentUser;

    const isActive = ref(false);
    function toggleLogin() {
          isActive.value = !isActive.value;
          const conectar = document.querySelector('.form-box login');
          const login = document.querySelector('.form-box register');
        }

    const isActiveR = ref(false);
    function toggleRecovery() {
          isActiveR.value = !isActiveR.value;
          const conectar = document.querySelector('.form-box login');
          const recovery = document.querySelector('.form-box recovery');
        }

    const isActiveC = ref(false);
    function toggleContact() {
          isActiveC.value = !isActiveC.value;
          const contact = document.querySelector('.contact');
          const conectar = document.querySelector('.conectar');
          const about = document.querySelector('.about');
          
          conectar.style.transform = isActiveC.value = 'scale(0)';
          about.style.transform = isActiveC.value = 'scale(0)';
          contact.style.transform = isActiveC.value ? 'scale(1)' : 'scale(0)';
        }

    const isActiveW = ref(false);
    function toggleWrapper() {
          isActiveW.value = !isActiveW.value;
          const contact = document.querySelector('.contact');
          const conectar = document.querySelector('.conectar');
          const about = document.querySelector('.about');
          contact.style.transform = isActiveW.value = 'scale(0)';
          about.style.transform = isActiveW.value = 'scale(0)';
          conectar.style.transform = isActiveW.value ? 'scale(1)' : 'scale(0)';
        } 

    const isActiveA = ref(false);
    function toggleAbout() {
          isActiveA.value = !isActiveA.value;
          const contact = document.querySelector('.contact');
          const conectar = document.querySelector('.conectar');
          const about = document.querySelector('.about');
          contact.style.transform = isActiveA.value = 'scale(0)';
          conectar.style.transform = isActiveA.value = 'scale(0)';
          about.style.transform = isActiveA.value ? 'scale(1)' : 'scale(0)';
        }  

    const isClosed = ref(false);
    function toggleClose() {
          isClosed.value = !isClosed.value;
          const contact = document.querySelector('.contact');
          const conectar = document.querySelector('.conectar');
          const about = document.querySelector('.about');
          contact.style.transform = isActiveW.value = 'scale(0)';
          conectar.style.transform = isActiveW.value = 'scale(0)';
          about.style.transform = isActiveW.value = 'scale(0)';
        }

    function toggleWhatsapp(){
        window.location.href = 'https://wa.me/+542964606826';  
    }
    function toggleFacebook(){
        window.location.href = 'https://www.facebook.com/emanuel.quiroga.714';  
    }
    function toggleEmail(){
        window.location.href = 'mailto:emanuelquiroga.bgh@gmail.com';  
    }
    function toggleInstagram(){
        window.location.href = 'https://www.instagram.com/emanuel.quiroga.714';  
    }

    return {
      email,
      password,
      isActive,
      isActiveR,
      isActiveC,
      isActiveW,
      isActiveA,
      register,
      login,
      recoveryPassword,
      toggleLogin,
      toggleRecovery,
      toggleContact,
      toggleWrapper,
      toggleAbout,
      toggleClose,
      toggleWhatsapp,
      toggleFacebook,
      toggleEmail,
      toggleInstagram
    }
      }
}
</script>

<template>
<body>
  <header class="head_home">
    <h2 class="logo">Electricidad Domiciliaria</h2>
    <nav class="navigation">
      <a href="#" class="about-link" @click="toggleAbout">Acerca de</a>
      <a href="#" class="contact-link" @click="toggleContact">Contacto</a>
      <a href="#" class="login-link" @click="toggleWrapper">Conectarse</a>
      
    </nav>
  </header>
  <div class="about" :class="{ active: isActiveA }" >
    <span class="icon-close" @click="toggleClose"><font-awesome-icon icon="fa-solid fa-xmark" /></span>
    <div class="about-box">
      <h1>Acerca de</h1>
        <p>Nuestra página web está diseñada específicamente para electricistas matriculados que 
        buscan una herramienta eficiente para generar presupuestos para sus clientes. Con una 
        interfaz intuitiva y fácil de usar, nuestros usuarios pueden crear presupuestos en pocos 
        minutos y enviarlos directamente a sus clientes. Además, ofrecemos una variedad de plantillas 
        de presupuesto y opciones de personalización para adaptarse a las necesidades específicas de 
        cada electricista. Ahorre tiempo y aumente su productividad con nuestra plataforma en línea.</p> 
    </div> 
  </div>
  <div class="contact" :class="{ active: isActiveC }" >
    <span class="icon-close" @click="toggleClose"><font-awesome-icon icon="fa-solid fa-xmark" /></span>
    <div class="contact-box">
      <h1>Contacto</h1>
      <div class="input-box" >
        <span class="icon"><font-awesome-icon icon="fa-brands fa-whatsapp" /></span>
        <a href="#" class="register-link" @click="toggleWhatsapp">Whatsapp</a>
      </div>
      <div class="input-box">
        <span class="icon"><font-awesome-icon icon="fa-solid fa-envelope" /></span>
        <a href="#" class="register-link" @click="toggleEmail">Email</a>
      </div>
      <div class="input-box">
        <span class="icon"><font-awesome-icon icon="fa-solid fa-thumbs-up" /></span>
        <a href="#" class="register-link" @click="toggleFacebook">Facebook</a>
      </div>
      <div class="input-box">
        <span class="icon"><font-awesome-icon icon="fa-solid fa-camera-retro" /></span>
        <a href="#" class="register-link" @click="toggleInstagram">Instagram</a>
      </div>  
    </div>
  </div>
  <div class="conectar" :class="{ active: isActiveW, active: isActive, activeR:isActiveR }" >
    <span class="icon-close" @click="toggleClose"><font-awesome-icon icon="fa-solid fa-xmark" /></span>
    <div class="form-box login">
      <h2>Conectarse</h2>
      <form action="#" @submit.prevent="login">
        <div class="input-box">
          <span class="icon"><font-awesome-icon icon="fa-solid fa-user" /></span>
          <input type="email" required v-model="email">
          <label>Email</label>
        </div>
        <div class="input-box">
          <span class="icon"><font-awesome-icon icon="fa-solid fa-unlock-keyhole" /></span>
          <input type="password" required v-model="password">
          <label>Password</label>
        </div>
        <button type="submit" class="btn">Login</button>
        <div class="login-register">
          <p>Olvidaste tu contraseña? <a href="#" class="register-link" @click="toggleRecovery">Recuperar</a></p>
        </div>
        <div class="login-register">
          <p>No tienes cuenta? <a href="#" class="register-link" @click="toggleLogin">Registrarse</a></p>
        </div>
      </form>
    </div>
    <div class="form-box register">
      <h2>Registrarse</h2>
      <form action="#" @submit.prevent="register">
        <div class="input-box">
          <span class="icon"><font-awesome-icon icon="fa-solid fa-user" /></span>
          <input type="email" required v-model="email">
          <label>Email</label>
        </div>
        <div class="input-box">
          <span class="icon"><font-awesome-icon icon="fa-solid fa-unlock-keyhole" /></span>
          <input type="password" required v-model="password">
          <label>Password</label>
        </div>
        <button type="submit" class="btn">Register</button>
        <div class="login-register">
          <p>Ya tienes cuenta? <a href="#" class="login-link" @click="toggleLogin">Conectarse</a></p>
        </div>
      </form>
    </div>
    <div class="form-box recovery">
      <h2>Recuperar contraseña</h2>
      <form action="#" @submit.prevent="recoveryPassword">
        <div class="input-box">
          <span class="icon"><font-awesome-icon icon="fa-solid fa-user" /></span>
          <input type="email" required v-model="email">
          <label>Email</label>
        </div>
        <button type="submit" class="btn">Enviar</button>
        <div class="login-register">
          <p>Ya tienes cuenta? <a href="#" class="login-link" @click="toggleRecovery">Conectarse</a></p>
        </div>
      </form>
    </div>
  </div>
  
  <footer>
    <p>Diseño y desarrollo realizado por Martin E. Quiroga</p>
    <div class="footer_link">
      <span href="#" class="register-link" @click="toggleWhatsapp"><font-awesome-icon icon="fa-brands fa-whatsapp" /></span>
      <span href="#" class="register-link" @click="toggleInstagram"><font-awesome-icon icon="fa-solid fa-camera-retro" /></span>
    </div>
    
  </footer>
</body>

</template>

<style scoped>
@import "../styles/navbar.css";

body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: url(../assets/foco-sobrio.jpg) no-repeat;
  background-size: cover;
  background-position: center;
}
footer{
  position:absolute;
  bottom: 20px;
  right: 50px;
  color:rgb(212, 212, 212);
  display:flex;
  gap: 7px;
}
footer .footer_link{
  display:flex;
  color:blanchedalmond;
  margin-left: 10px;
  cursor: pointer;
  display:flex;
  gap: 10px;
}
.conectar {
  position: absolute;
  top: 200px;
  right: 200px ;
  width: 400px;
  height: 440px;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, .5);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  transform: scale(0);
  transition: transform .5s ease;
}
.conectar .form-box {
  width: 100%;
  padding: 40px;
}
.conectar .form-box.login {
  transition: transform .18s ease;
  transform: translateX(0);
}
.conectar.active .form-box.login {
  transition: none;
  transform: translateX(-400px);
}
.conectar.activeR .form-box.login {
  transition: none;
  transform: translateX(-400px);
}
.conectar .form-box.register {
  position: absolute;
  transition: none;
  transform: translateX(400px);
}
.conectar.active .form-box.register {
  transition: transform .18s ease;
  transform: translateX(0);
}
.conectar .form-box.recovery {
  position: absolute;
  transition: none;
  transform: translateX(400px);
}
.conectar.activeR .form-box.recovery {
  transition: transform .18s ease;
  transform: translateX(0);
}
.form-box h2 {
  font-size: 2em;
  color: white;
  text-align: center;
}
.input-box {
  position: relative;
  width: 100%;
  height: 50px;
  border-bottom: 2px solid rgb(41, 41, 41);
  margin: 30px 0;
}
.input-box label {
  position: absolute;
  top: 50%;
  left: 5px;
  transform: translateY(-50%);
  font-size: 1em;
  color: white;
  font-weight: 500;
  pointer-events: none;
  transition: .5s;
}
.input-box input:focus~label,
.input-box input:valid~label {
  top: -5px;
}
.input-box input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 1em;
  color: white;
  font-weight: 600;
  padding: 0 35px 0 5px;
}
.input-box .icon {
  position: absolute;
  right: 8px;
  font-size: 1.2em;
  color: white;
  line-height: 57px;
}
.btn {
  width: 100%;
  height: 45px;
  background: rgb(41, 41, 41);
  border: none;
  outline: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  color: white;
  font-weight: 500;
}
.login-register {
  font-size: .9em;
  color: white;
  text-align: center;
  font-weight: 500;
  margin: 25px 0 10px;
}
.login-register p a {
  color: white;
  text-decoration: none;
  font-weight: 600;
}
.login-register p a:hover {
  text-decoration: underline;
}
.icon-close {
  position: absolute;
  top: 0;
  right: 0;
  width: 45px;
  height: 45px;
  background: rgb(41, 41, 41);
  font-size: 2em;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom-left-radius: 20px;
  border-top-right-radius: 20px;
  cursor: pointer;
  z-index: 1;
}
.contact {
  position: absolute;
  top: 200px;
  right: 200px ;
  width: 400px;
  height: 440px;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, .5);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content:center;
  align-items:center;
  overflow: hidden;
  transform: scale(0);
  transition: transform .5s ease;
}
.contact-box h1 {
  color: white;
  text-decoration: none;
  font-weight: 900;
  display: flex;
}
.contact-box a {
  position: relative;
  font-size: 1.1em;
  color: white;
  text-decoration: none;
  font-weight: 500;
  margin-left: 10px;
}
.contact-box a::after{
  content:"";
  position: absolute;
  left: 0;
  bottom: -6px;
  width: 100%;
  height: 3px;
  background: white;
  border-radius: 5px;
  transform-origin: right;
  transform: scaleX(0);
  transition: transform .5s;
}
.contact-box a:hover::after{
  transform-origin: left;
  transform: scaleX(1);
}
.contact.active-contactup{
  transform: scale(1);
}
.contact-box .icon {
  position: absolute;
  right: 8px;
  font-size: 1.2em;
  color: white;
  line-height: 0px;
}
.about {
  position: absolute;
  top: 200px;
  right: 200px ;
  width: 500px;
  height: 600px;
  background: transparent;
  border: 2px solid rgba(255, 255, 255, .5);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  transform: scale(0);
  transition: transform .5s ease;
}
.about .about-box{
  position: relative;
  width: 90%;
  top: -20px;
  left: 20px;
  color: white;
  margin: 30px 0;
  display: grid;
  row-gap: 50px;
}
.about .about-box h1{
  display: flex;
  justify-content: center;
}
.about .about-box p{
  display: flex;
  justify-content: center;
  text-align: justify;
  font-size: 1.4em;
}
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;  /* Preferred icon size */
  color: white;
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
}
</style>
