<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { CONSENT_KEY, analytics } from '../services/analytics';
const opened = ref(false), choice = ref(null);
function sync(event) { if (event.key !== CONSENT_KEY) return; if (event.newValue === 'denied' && choice.value === 'granted') window.location.reload(); else { choice.value = analytics().consent(); if (choice.value) analytics().apply(choice.value, false); } }
onMounted(() => { choice.value = analytics().consent(); opened.value = choice.value === null; window.addEventListener('storage', sync); });
onUnmounted(() => window.removeEventListener('storage', sync));
function choose(value) {
  const previous = choice.value;
  analytics().apply(value); choice.value = value; opened.value = false;
  if (previous === 'granted' && value === 'denied') window.location.reload();
}
</script>
<template>
  <aside v-if="opened" class="analytics-consent" aria-labelledby="analytics-title">
    <h2 id="analytics-title">Tu privacidad, tu elección</h2>
    <p>Con tu permiso, Google Analytics nos ayuda a conocer las visitas y el uso de la web. Google procesa datos técnicos de navegación; no enviamos nombres, correos ni datos de tus proyectos. Podés usar la aplicación sin aceptarlo.</p>
    <RouterLink to="/privacidad">Ver política de privacidad</RouterLink>
    <div class="consent-actions"><button @click="choose('denied')">Rechazar Analytics</button><button @click="choose('granted')">Aceptar Analytics</button><button v-if="choice" @click="opened = false">Cerrar</button></div>
  </aside>
  <button v-else class="privacy-preferences" @click="opened = true">Preferencias de privacidad</button>
</template>
<style scoped>
.analytics-consent{position:fixed;bottom:18px;left:18px;right:18px;max-width:620px;z-index:1000;padding:22px;background:#122637;color:#eef6ff;border:1px solid #6e97b5;border-radius:16px;box-shadow:0 12px 45px #0007;font:15px/1.5 system-ui}.analytics-consent h2{font-size:20px;margin-bottom:8px}.analytics-consent p{margin-bottom:10px}.analytics-consent a{color:#acd9ff}.consent-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px}.consent-actions button{padding:10px 16px;border:1px solid #92b7d0;border-radius:8px;background:#e4f2fc;color:#122637;font:600 14px system-ui;cursor:pointer}.privacy-preferences{display:block;margin:16px auto;padding:8px 14px;border:1px solid #7b95a7;border-radius:8px;background:#142c3c;color:#e8f3ff;cursor:pointer}.consent-actions button:focus-visible,.privacy-preferences:focus-visible{outline:3px solid #fdd07a;outline-offset:3px}
</style>
