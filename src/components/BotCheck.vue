<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
const emit = defineEmits(['verified']);
const box = ref(null), error = ref(''); let widget, disposed = false;
const sitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
let pending;
async function render() {
  emit('verified', ''); error.value = '';
  try {
    if (!sitekey) throw new Error();
    if (!window.turnstile) {
      if (!pending) pending = new Promise((resolve, reject) => {
        const script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true; script.onload = resolve; script.onerror = () => { pending = null; reject(new Error()); }; document.head.append(script);
      });
      await pending;
    }
    if (disposed) return;
    if (widget !== undefined) window.turnstile.remove(widget);
    widget = window.turnstile.render(box.value, { sitekey, action: 'signup', theme: 'dark',
      callback: token => emit('verified', token), 'expired-callback': () => emit('verified', ''),
      'error-callback': () => { emit('verified', ''); error.value = 'Reintentá la verificación de seguridad.'; } });
  } catch { error.value = 'No pudimos cargar la verificación de seguridad. Revisá la conexión y reintentá.'; }
}
onMounted(render); onBeforeUnmount(() => { disposed = true; if (widget !== undefined) window.turnstile?.remove(widget); });
defineExpose({ reset: render });
</script>
<template><div class="bot-check"><div ref="box"></div><p v-if="error" role="alert">{{ error }} <button type="button" @click="render">Reintentar verificación</button></p></div></template>
<style scoped>.bot-check{margin-top:20px;max-width:100%;overflow-x:auto}.bot-check p{font-size:13px}</style>
