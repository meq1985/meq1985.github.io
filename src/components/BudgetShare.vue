<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { whatsappLink, emailLink } from '../services/budgetSharing';
const props = defineProps({ payload: { type: Object, required: true }, authorize: { type: Function, required: true } });
const emit = defineEmits(['close']);
const dialog = ref(null), message = ref(props.payload.message), phone = ref(''), email = ref(''), error = ref(''), notice = ref(''), busy = ref(false);
const downloadUrl = URL.createObjectURL(props.payload.file);
onMounted(() => dialog.value.showModal());
onBeforeUnmount(() => URL.revokeObjectURL(downloadUrl));
const supportsFiles = computed(() => { try { return typeof navigator.share === 'function' && navigator.canShare?.({files:[props.payload.file]}) === true; } catch { return false; } });
const whatsapp = computed(() => { try { return whatsappLink(phone.value, message.value); } catch { return null; } });
const mailto = computed(() => { try { return emailLink(email.value, props.payload.title, message.value); } catch { return null; } });
function guard(event) {
  try { props.authorize(); error.value = ''; return true; }
  catch (cause) { event?.preventDefault(); error.value = cause.message; return false; }
}
async function shareFile() {
  if (busy.value || !guard()) return;
  busy.value = true; notice.value = '';
  try {
    // The prepared File allows a direct user gesture, without awaiting PDF generation first.
    await navigator.share({ files: [props.payload.file], title: props.payload.title, text: message.value });
    notice.value = 'Confirmá el envío en la aplicación elegida. La página no puede comprobar su entrega.';
  } catch (cause) {
    if (cause.name === 'AbortError') notice.value = 'Compartir cancelado. Podés volver a intentarlo.';
    else error.value = 'No se pudo abrir el panel para compartir. Descargá el PDF y adjuntalo desde WhatsApp o tu correo.';
  } finally { busy.value = false; }
}
async function copyMessage() {
  if (!guard()) return;
  try { await navigator.clipboard.writeText(message.value); notice.value = 'Mensaje copiado. Podés pegarlo en WhatsApp o en tu correo.'; }
  catch { error.value = 'No pudimos copiar el mensaje. Seleccioná su texto para copiarlo manualmente.'; }
}
</script>
<template>
  <dialog ref="dialog" class="budget-share" aria-labelledby="share-title" @cancel.prevent="emit('close')">
    <div class="share-heading"><div><h2 id="share-title">Compartir presupuesto</h2><p>{{ payload.filename }}</p></div><button type="button" @click="emit('close')" aria-label="Cerrar opciones para compartir">Cerrar</button></div>
    <p v-if="error" role="alert" class="catalog-notice error">{{ error }}</p><p v-if="notice" role="status" class="catalog-notice">{{ notice }}</p>
    <label>Mensaje para el cliente<textarea v-model="message" maxlength="2000" rows="6" /></label>
    <div class="catalog-actions">
      <button v-if="supportsFiles" class="primary" :disabled="busy" @click="shareFile">Compartir PDF con otra aplicación</button>
      <a :href="downloadUrl" :download="payload.filename" class="share-download" @click="guard($event)">Descargar PDF para adjuntar</a>
      <button type="button" @click="copyMessage">Copiar mensaje</button>
    </div>
    <p class="share-hint">{{ supportsFiles ? 'Elegí WhatsApp o correo en el panel del dispositivo, si están disponibles.' : 'Este navegador no permite compartir el archivo directamente con otras aplicaciones.' }}</p>
    <details :open="!supportsFiles"><summary>Preparar un mensaje de WhatsApp o correo</summary>
      <p>Estos enlaces abren un mensaje, sin adjuntar el archivo. Descargá el PDF y adjuntalo antes de enviarlo.</p>
      <div class="share-destinations">
        <div><label>Teléfono de WhatsApp (opcional)<input v-model="phone" type="tel" maxlength="30" placeholder="Código de país y número" /></label><small>Si lo dejás vacío, elegís el contacto en WhatsApp.</small>
          <a v-if="whatsapp" :href="whatsapp" target="_blank" rel="noopener noreferrer" @click="guard($event)">Abrir WhatsApp con el mensaje ↗</a><p v-else role="status">Revisá el número y su código de país.</p></div>
        <div><label>Correo del destinatario (opcional)<input v-model="email" type="email" maxlength="254" placeholder="cliente@ejemplo.com" /></label><small>Si lo dejás vacío, lo completás en tu aplicación de correo.</small>
          <a v-if="mailto" :href="mailto" @click="guard($event)">Abrir correo con el mensaje ↗</a><p v-else role="status">Revisá la dirección de correo.</p></div>
      </div>
    </details>
    <small>El archivo se prepara en tu dispositivo. No se crea un enlace público ni se registra el presupuesto como enviado.</small>
  </dialog>
</template>
<style scoped>
.budget-share{background:#192634;color:#edf2f8;border:1px solid #6b829a;border-radius:16px;padding:26px;width:min(760px,calc(100vw - 32px));max-height:88vh;overflow:auto;box-sizing:border-box}.budget-share::backdrop{background:#07101bd9}.share-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}.share-heading h2{margin:0 0 6px}.share-heading p{font-size:12px;color:#bccbda;overflow-wrap:anywhere}.budget-share label{display:flex;flex-direction:column;gap:8px}.budget-share textarea{resize:vertical}.share-download{padding:10px 16px;border:1px solid #7c90a6;border-radius:6px}.share-hint,.budget-share details p{font-size:13px;color:#bfccda}.budget-share details{margin:20px 0}.share-destinations{display:grid;grid-template-columns:1fr 1fr;gap:20px}.share-destinations a{display:inline-block;margin-top:14px}.share-destinations small{display:block;margin-top:6px}.budget-share small{font-size:12px;color:#bfccda}.budget-share a:focus-visible{outline:3px solid #70bcff;outline-offset:4px}@media(max-width:600px){.share-destinations{grid-template-columns:1fr}.budget-share{padding:18px}.catalog-actions{align-items:stretch;flex-direction:column}}
</style>
