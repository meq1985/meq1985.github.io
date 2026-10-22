<script setup>
import { computed, ref, watch } from 'vue';
import { emptySketch, encodeSketch } from '../services/sketch';
import { BOARD_IDS, SERVICE_IDS, PAT_IDS, emptyQuoteSettings, validateQuoteSettings, includesPat } from '../services/sketchQuoteSettings';
import { quoteFromSketch } from '../services/sketchQuote';
import { currency } from '../data/laborCatalog';
const props = defineProps({ modelValue: { type: Object, default: null }, entries: { type: Array, required: true }, existingCount: { type: Number, default: 0 }, disabled: Boolean });
const emit = defineEmits(['update:modelValue', 'apply']);
const settings = computed(() => props.modelValue?.quote ?? emptyQuoteSettings());
const error = ref(''), preview = ref(null), replacementApproved = ref(false), applied = ref(false);
const previewSignature = ref('');
const signature = computed(() => JSON.stringify([props.modelValue, props.entries]));
watch(signature, () => { preview.value = null; replacementApproved.value = false; applied.value = false; });
watch(() => props.existingCount, () => { replacementApproved.value = false; });
const options = ids => props.entries.filter(entry => ids.includes(entry.id));
function update(edit) {
  if (props.disabled) return;
  try {
    const quote = JSON.parse(JSON.stringify(settings.value)); edit(quote);
    const valid = validateQuoteSettings(quote);
    const next = { ...(props.modelValue ?? emptySketch()), quote: valid }; encodeSketch(next);
    emit('update:modelValue', next); error.value = '';
  } catch (cause) { error.value = cause.message; }
}
function setHeight(key, event) {
  update(s => { s.heights[key] = event.target.value.trim() ? Number(event.target.value) : null; });
}
function review() {
  if (props.disabled) return;
  try { preview.value = quoteFromSketch(props.modelValue ?? emptySketch(), props.entries); previewSignature.value = signature.value; error.value = ''; replacementApproved.value = false; applied.value = false; }
  catch (cause) { preview.value = null; error.value = cause.message; }
}
function apply() {
  if (props.disabled || !preview.value || applied.value || (props.existingCount && !replacementApproved.value)) return;
  // Calculate again from current data; a stale preview cannot overwrite the detail.
  try {
    if (previewSignature.value !== signature.value) throw Error('El croquis o los precios cambiaron. Revisá nuevamente el borrador.');
    const result = quoteFromSketch(props.modelValue ?? emptySketch(), props.entries); emit('apply', result.rows); applied.value = true;
  }
  catch (cause) { preview.value = null; error.value = cause.message; }
}
</script>
<template>
  <section class="catalog-panel sketch-quote" aria-labelledby="sketch-quote-title">
    <p class="quote-eyebrow">OBRA NUEVA</p><h2 id="sketch-quote-title">Del croquis al presupuesto</h2>
    <p>Una boca completa por luminaria o toma. Las llaves de encendido quedan incluidas en la iluminación. El precio se toma de tu cuenta.</p>
    <p v-if="error" class="catalog-notice error" role="alert">{{ error }}</p>
    <fieldset :disabled="disabled">
      <h3>Alturas generales</h3><p class="muted">Metros desde el piso terminado. Podés dejarlas pendientes; se conservan como datos de la obra y todavía no calculan recorridos ni materiales.</p>
      <div class="catalog-fields"><label v-for="(label, key) in { toma: 'Altura de tomacorrientes (m)', llave: 'Altura de llaves (m)', techo: 'Altura de techo (m)' }" :key="key">{{ label }}<input :value="settings.heights[key] ?? ''" type="number" min="0.01" max="20" step="0.01" placeholder="Sin definir" @input="setHeight(key, $event)" @blur="$event.target.value = settings.heights[key] ?? ''" /></label></div>
      <h3>Trabajos a incluir</h3>
      <p class="muted">Proyecto eléctrico: superficie del croquis con un mínimo de 30 m², usando «Proyecto eléctrico por m²». No se suma otro cargo por plano ni por lista de materiales.</p>
      <label class="quote-check"><input type="checkbox" :checked="settings.includeProject" @change="update(s => { s.includeProject = $event.target.checked; })" />Incluir proyecto eléctrico por m²</label>
      <div class="catalog-fields quote-selectors">
        <label v-if="!modelValue?.equipment?.length">Tablero principal (pilar) o tablero general<select :value="settings.board" @change="update(s => { s.board = $event.target.value; })"><option value="">Sin tablero</option><option v-for="item in options(BOARD_IDS)" :key="item.id" :value="item.id">{{ item.description }} — {{ currency(item.price) }}</option></select></label>
        <label v-if="!modelValue?.equipment?.length">Tablero seccional adicional<select :value="settings.secondaryBoard" @change="update(s => { s.secondaryBoard = $event.target.value; })"><option value="">Sin tablero adicional</option><option v-for="item in options(BOARD_IDS.filter(id => id.startsWith('seccional')))" :key="item.id" :value="item.id">{{ item.description }} — {{ currency(item.price) }}</option></select></label>
        <label v-if="!modelValue?.equipment?.length">Acometida<select :value="settings.service" @change="update(s => { s.service = $event.target.value; })"><option value="">Sin acometida</option><option v-for="item in options(SERVICE_IDS)" :key="item.id" :value="item.id">{{ item.description }} — {{ currency(item.price) }}</option></select></label>
        <label v-if="!modelValue?.equipment?.length">Puesta a tierra (PAT) separada<select :value="settings.pat" @change="update(s => { s.pat = $event.target.value; })"><option value="">Sin PAT separada</option><option v-for="item in options(PAT_IDS)" :key="item.id" :value="item.id">{{ item.description }} — {{ currency(item.price) }}</option></select></label>
        <label>Bocas adicionales por extensión<input :value="settings.extraBocas" type="number" min="0" max="300" step="1" @input="update(s => { s.extraBocas = $event.target.value.trim() ? Number($event.target.value) : NaN; })" @blur="$event.target.value = settings.extraBocas" /></label>
      </div>
      <p v-if="!modelValue?.equipment?.length && includesPat(settings)" class="catalog-notice">El tablero o la acometida seleccionados ya incluyen PAT. La PAT separada se descontará del borrador para evitar cobrarla dos veces.</p>
      <p v-if="modelValue?.equipment?.length" class="catalog-notice">Se cotizan los tableros, el medidor y las jabalinas ubicados en el croquis, con los trabajos que elegiste para cada uno. Las selecciones manuales anteriores no se suman.</p>
      <p class="muted">Los componentes adicionales de tablero o acometida se pueden agregar después en el detalle del presupuesto.</p>
      <p class="muted">La boca completa incluye canalización, amurado, cableado y conexión, hasta 5 m entre cajas. Revisá extensiones y agregá las bocas adicionales que correspondan. La colocación de artefactos se cotiza aparte. Las alturas no agregan cargos automáticamente.</p>
      <button type="button" :disabled="disabled" @click="review">Revisar presupuesto del croquis</button>
      <section v-if="preview" class="catalog-preview" aria-labelledby="quote-review-title">
        <h3 id="quote-review-title">Revisá los trabajos antes de aplicarlos</h3><p>{{ preview.bocas }} {{ preview.bocas === 1 ? 'boca' : 'bocas' }} · {{ preview.summary.area }} m² dibujados<span v-if="settings.includeProject"> · {{ preview.area }} m² a cotizar por proyecto</span></p>
        <p v-for="warning in preview.warnings" :key="warning" class="catalog-notice">{{ warning }}</p><p v-for="route in preview.measurements" :key="route.id" class="muted">Recorrido principal → general: {{ route.meters }} m</p>
        <div class="catalog-scroll"><table class="catalog-table"><thead><tr><th>Trabajo</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody><tr v-for="(row, i) in preview.rows" :key="i"><td>{{ row.descripcion }}</td><td>{{ row.cantidad }} {{ row.unidad }}</td><td>{{ currency(row.precioUnitario) }}</td><td>{{ currency(Math.round(row.cantidad * row.precioUnitario * 100) / 100) }}</td></tr></tbody></table></div>
        <p class="catalog-total">Total mano de obra: {{ currency(preview.total) }}</p>
        <label v-if="existingCount" class="quote-check"><input v-model="replacementApproved" type="checkbox" />Reemplazar los {{ existingCount }} trabajos actuales por este borrador. Se quitarán también los trabajos agregados manualmente.</label>
        <button type="button" class="primary" :disabled="disabled || applied || Boolean(existingCount && !replacementApproved)" @click="apply">{{ applied ? 'Borrador aplicado' : existingCount ? 'Reemplazar detalle con este borrador' : 'Usar este borrador en el presupuesto' }}</button>
        <p class="muted">Después podés editar cantidades y precios o agregar trabajos en el detalle. Si cambiás el croquis o estas opciones, volvé a revisar y aplicar: el detalle no se recalcula solo. Aplicar el borrador no guarda el proyecto; usá «Guardar proyecto en mi cuenta».</p>
      </section>
    </fieldset>
  </section>
</template>
<style scoped>
.quote-eyebrow{color:#a8d4ff;font-size:11px;letter-spacing:2px}.quote-selectors{margin-top:20px;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))}.sketch-quote .quote-check{flex-direction:row;align-items:flex-start;gap:12px;margin:16px 0;font-weight:400}.sketch-quote .quote-check input{width:20px;height:20px;flex:0 0 20px;margin-top:2px}.catalog-preview h3{margin-top:0}.catalog-preview>button{margin-top:16px}
</style>
