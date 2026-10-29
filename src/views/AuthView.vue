<script setup>
import BotCheck from '../components/BotCheck.vue';
import BrandMark from '../components/BrandMark.vue';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useUserStore } from '../stores/user';
const route = useRoute();
const store = useUserStore();
const email = ref('');
const password = ref('');
const acceptedTerms = ref(false), verification = ref(''), botCheck = ref(null);
const mode = computed(() => route.meta.authMode || 'login');
const title = computed(() => ({ login: 'Ingresá a tu cuenta', register: 'Creá tu cuenta', recovery: 'Recuperá tu contraseña' }[mode.value]));
watch(mode, () => { password.value = ''; acceptedTerms.value = false; verification.value = ''; store.error = ''; store.notice = ''; });
async function submit() {
  if (store.busy || (mode.value === 'register' && (!acceptedTerms.value || !verification.value))) return;
  if (mode.value === 'recovery') await store.resetPassword(email.value);
  else if (mode.value === 'register') {
    await store.register(email.value, password.value, verification.value);
    verification.value = ''; botCheck.value?.reset?.();
  }
  else await store.login(email.value, password.value);
}
</script>
<template>
  <div class="auth-page">
    <RouterLink class="brand" to="/"><BrandMark class="auth-logo" /><span>Electricista Xpress</span></RouterLink>
    <section aria-labelledby="auth-title" class="auth-card">
      <RouterLink class="back" to="/">← Volver al inicio</RouterLink>
      <h1 id="auth-title">{{ title }}</h1>
      <p v-if="mode === 'register'">Verificá tu correo para completar el registro y acceder a tu catálogo de mano de obra.</p>
      <p v-else-if="mode === 'recovery'">Te enviaremos un enlace para elegir una nueva contraseña.</p>
      <p v-else>Continuá con tus precios y presupuestos.</p>
      <p v-if="store.notice" role="status" class="notice">{{ store.notice }}</p>
      <p v-if="store.error" role="alert" class="error">{{ store.error }}</p>
      <form @submit.prevent="submit" :aria-busy="store.busy">
        <fieldset :disabled="store.busy">
          <label for="auth-email">Correo electrónico</label>
          <input id="auth-email" v-model="email" type="email" autocomplete="email" required>
          <template v-if="mode !== 'recovery'"><label for="auth-password">Contraseña</label><input id="auth-password" v-model="password" type="password" :autocomplete="mode === 'register' ? 'new-password' : 'current-password'" minlength="6" required aria-describedby="password-help"><small id="password-help">Mínimo 6 caracteres.</small></template>
          <label v-if="mode === 'register'" class="terms"><input v-model="acceptedTerms" type="checkbox" required data-testid="legal-consent"><span>Acepto las <RouterLink to="/condiciones">condiciones de uso</RouterLink> y leí la <RouterLink to="/privacidad">política de privacidad</RouterLink>. Prueba de 30 días, sin tarjeta ni cobro automático.</span></label>
          <BotCheck v-if="mode === 'register'" ref="botCheck" @verified="verification = $event" />
          <button type="submit" :disabled="mode === 'register' && (!acceptedTerms || !verification)">{{ store.busy ? 'Procesando…' : mode === 'register' ? 'Crear cuenta' : mode === 'recovery' ? 'Enviar enlace' : 'Ingresar' }}</button>
        </fieldset>
      </form>
      <nav aria-label="Opciones de acceso"><RouterLink v-if="mode === 'login'" to="/recuperar">Olvidé mi contraseña</RouterLink><RouterLink v-if="mode !== 'register'" to="/registrarse">Crear una cuenta</RouterLink><RouterLink v-if="mode !== 'login'" to="/ingresar">Ya tengo cuenta · Ingresar</RouterLink></nav>
    </section>
  </div>
</template>
<style scoped>
.terms{display:flex;gap:12px;align-items:flex-start;font-weight:400}.terms input{width:20px;min-height:20px;flex-shrink:0}.auth-page{min-height:100vh;background:#101720;color:#edf2f8;font:16px/1.6 Arial,sans-serif;padding:32px 20px;box-sizing:border-box}.auth-logo{width:32px;height:38px;flex-shrink:0}.brand{display:flex;align-items:center;justify-content:center;gap:12px;text-align:left;color:#99d2ff;font-size:20px;font-weight:700;text-decoration:none;margin-bottom:32px}.auth-card{box-sizing:border-box;width:100%;max-width:460px;margin:auto;padding:32px;background:#19232f;border:1px solid #3a4d60;border-radius:12px}.back{font-size:13px}a{color:#99d2ff;text-underline-offset:4px}h1{font-size:28px;line-height:1.25;margin:24px 0 12px}p,small{color:#b6c3d2}fieldset{border:0;margin:24px 0 0;padding:0;min-width:0}label{display:block;font-size:14px;font-weight:700;margin:18px 0 7px}input{box-sizing:border-box;width:100%;min-height:48px;border:1px solid #647789;border-radius:6px;background:#101720;color:#edf2f8;padding:10px 12px;font:inherit}small{display:block;font-size:12px;margin-top:6px}button{width:100%;min-height:48px;margin-top:26px;border:0;border-radius:6px;background:#99d2ff;color:#102335;font-size:16px;font-weight:700;cursor:pointer}fieldset:disabled{opacity:.65}nav{display:flex;flex-direction:column;gap:15px;margin-top:24px;font-size:14px}.notice,.error{padding:12px;margin-top:20px;border-radius:6px}.notice{background:#1c3c45;color:#d9f5ef}.error{background:#482c31;color:#ffe0e2}:where(a,input,button):focus-visible{outline:3px solid #ffda84;outline-offset:4px}@media(max-width:400px){.auth-card{padding:24px}.terms{display:flex;gap:12px;align-items:flex-start;font-weight:400}.terms input{width:20px;min-height:20px;flex-shrink:0}.auth-page{padding:24px 16px}}
</style>
