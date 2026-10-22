<script setup>
import { nextTick, ref, watch } from 'vue';
import { CATALOG_NOTES } from '../data/laborCatalog';
const props = defineProps({ ready: Boolean });
const dialog = ref(null), topic = ref('inicio'), detail = ref('');
const preferenceKey = 'electricistaxpress:presupuestar-ayuda:v1';
let returnFocus = null, checked = false;
async function show(value = 'inicio', content = '') {
  topic.value = value; detail.value = content; returnFocus = document.activeElement; await nextTick();
  if (!dialog.value) return;
  if (!dialog.value.open) {
    if (typeof dialog.value.showModal === 'function') dialog.value.showModal();
    else dialog.value.setAttribute('open', '');
  }
  dialog.value.querySelector('button')?.focus();
}
function close() {
  if (typeof dialog.value.close === 'function') dialog.value.close(); else dialog.value.removeAttribute('open');
  try { localStorage.setItem(preferenceKey, 'seen'); } catch { /* Help still works if preferences cannot be stored. */ }
  if (returnFocus?.isConnected) returnFocus.focus();
}
watch(() => props.ready, ready => {
  if (!ready || checked) return; checked = true;
  try { if (localStorage.getItem(preferenceKey) === 'seen') return; } catch { /* First-use help remains available. */ }
  show();
}, { immediate: true });
defineExpose({ show });
</script>
<template>
  <dialog ref="dialog" class="budget-help" aria-labelledby="budget-help-title" aria-modal="true" @cancel.prevent="close">
    <div class="help-heading"><h2 id="budget-help-title">Ayuda para presupuestar</h2><button type="button" aria-label="Cerrar ayuda" @click="close">Cerrar</button></div>
    <nav aria-label="Temas de ayuda"><button v-for="(label, key) in { inicio: 'Primeros pasos', ambientes: 'Ambientes', equipos: 'Tableros y PAT', recorridos: 'Recorridos', presupuesto: 'Presupuesto' }" :key="key" type="button" :aria-pressed="topic === key" @click="topic = key">{{ label }}</button></nav>
    <section v-if="topic === 'inicio'"><h3>Tu proyecto, en cuatro pasos</h3><ol><li>Completá nombre, cliente y tipo de inmueble.</li><li>Para obra nueva, dibujá ambientes y puntos eléctricos. Podés sumar tableros y recorridos.</li><li>Revisá el borrador del croquis o agregá trabajos individualmente junto al detalle.</li><li>Revisá el total y guardá el proyecto en tu cuenta. Desde el detalle podés descargar el PDF.</li></ol><p>Podés volver a esta ventana con los botones «Ayuda». Se abre automáticamente la primera vez en este navegador.</p></section>
    <section v-else-if="topic === 'ambientes'"><h3>Medidas y puntos</h3><p>Definí ambientes rectangulares y niveles. Las medidas y posiciones están en metros; cada cuadrado de la grilla mide 1 × 1 m. Podés borrar un valor y escribir otro; si salís del campo vacío se recupera el último valor válido.</p><p>Elegí luminaria, toma o llave y tocá dentro del ambiente, o usá «Agregar al centro». Deshacer y rehacer recuperan cambios del dibujo. La superficie suma los ambientes; corregí las superposiciones antes de presupuestar.</p><p>El croquis se guarda junto al presupuesto y sus versiones. El dibujo todavía no se incluye en el PDF.</p></section>
    <section v-else-if="topic === 'equipos'"><h3>Tableros, medidor y puesta a tierra</h3><p>Ubicalos dentro o fuera de los ambientes. TP es el principal del pilar; TG, el general de la vivienda; TS, un seccional adicional. Para TG y TS elegí el trabajo según la cantidad de polos del catálogo.</p><p>Cada elemento elige su trabajo del catálogo. Si dibujás equipos, se usan esos elementos en lugar de las selecciones manuales anteriores. Cada paquete que incluye PAT cubre una jabalina; se cotizan las restantes. Un medidor con TP ya incluye el principal.</p><p>Quitar un elemento también quita sus recorridos. Podés recuperarlos con Deshacer.</p></section>
    <section v-else-if="topic === 'recorridos'"><h3>Del pilar al tablero general</h3><p>Elegí origen y destino del mismo nivel. El trazado inicial es recto: agregá quiebres tocando el plano para seguir el recorrido real. La longitud suma los segmentos dibujados y los metros verticales que ingreses aparte.</p><p>Elegí un trabajo por metro, por tramo de 5 m, o «Solo medir». Los tramos se redondean al tramo completo superior. La medición no calcula número de conductores ni sección del cable.</p></section>
    <section v-else-if="topic === 'trabajo'"><h3>Nota del trabajo seleccionado</h3><p>{{ detail }}</p></section>
    <section v-else><h3>Cantidades, precios y guardado</h3><p>El borrador de obra nueva cuenta una boca por luminaria o toma, con las llaves incluidas. El proyecto eléctrico se cotiza por superficie con mínimo de 30 m², sin sumar otro plano o lista de materiales.</p><p>Las alturas generales se indican desde el piso terminado, en metros. Los controles avanzan de 0,1 m; por ahora las alturas se conservan como datos y no calculan materiales.</p><p>Las cantidades por m² y metro avanzan de 0,1; bocas, unidades, tableros y tramos avanzan de 1. Revisá los trabajos del catálogo o agregá ítems propios junto al detalle.</p><p>Aplicar el borrador reemplaza el detalle y requiere confirmar si ya hay trabajos. Si cambiás el dibujo, revisá y aplicá nuevamente: el detalle no se recalcula solo. Después podés editarlo y guardar.</p><p>Cada versión conserva precios y datos profesionales. Los cambios del perfil no modifican versiones anteriores.</p><ul><li v-for="note in CATALOG_NOTES" :key="note">{{ note }}</li></ul></section>
  </dialog>
</template>
<style scoped>
.budget-help{color:#edf2f8;background:#202833;border:1px solid #7c90a6;border-radius:14px;width:min(760px,calc(100% - 32px));max-height:85dvh;padding:24px;overflow:auto;font:16px/1.5 Arial,sans-serif}.budget-help::backdrop{background:#070e18c9}.help-heading{display:flex;justify-content:space-between;gap:16px;align-items:center}.help-heading h2{margin:0;font-size:24px}.budget-help button{background:#25384d;color:#edf2f8;border:1px solid #8499b1;border-radius:6px;padding:9px 12px;font:inherit;cursor:pointer}.budget-help button:focus-visible{outline:3px solid #70bcff;outline-offset:2px}.budget-help nav{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}.budget-help button[aria-pressed=true]{background:#2475b9}.budget-help h3{font-size:19px}.budget-help p,.budget-help li{margin:12px 0}.budget-help ol,.budget-help ul{padding-left:24px}@media(max-width:650px){.budget-help{padding:18px}.help-heading h2{font-size:20px}}
</style>
