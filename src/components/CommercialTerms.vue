<script setup>
import { computed, ref } from 'vue';
import NumberField from './NumberField.vue';
import { newCommercialTerms, advanceSummary, validityEnd, displayDate } from '../services/commercialTerms';
import { currency } from '../data/laborCatalog';
const props = defineProps({ modelValue: { type: Object, default: null }, projectId: String, total: Number, paymentOptions: Object, issuedAt: String });
const emit = defineEmits(['update:modelValue']);
const draft = ref(null);
function enable(event) {
  if (!event.target.checked) draft.value = { ...props.modelValue };
  emit('update:modelValue', event.target.checked ? draft.value ?? newCommercialTerms(props.projectId, props.issuedAt || new Date()) : null);
}
const edit = (key, value) => emit('update:modelValue', { ...props.modelValue, [key]: value });
const preview = computed(() => { try { return props.modelValue ? advanceSummary(props.total, props.paymentOptions, props.modelValue) : null; } catch { return null; } });
const expires = computed(() => { try { const end = props.modelValue && validityEnd(props.modelValue); return end ? displayDate(end) : null; } catch { return null; } });
</script>
<template>
  <section class="commercial-terms" aria-labelledby="commercial-title">
    <div class="commercial-heading"><div><h3 id="commercial-title">Datos y condiciones del presupuesto</h3><p>Se guardan con esta versión y se incluyen en el PDF.</p></div>
      <label class="commercial-toggle"><input type="checkbox" :checked="!!modelValue" aria-label="Incluir condiciones comerciales" @change="enable" /> Incluir en el documento</label></div>
    <template v-if="modelValue">
      <div class="commercial-grid">
        <label>Referencia del presupuesto<input :value="modelValue.reference" maxlength="40" @input="edit('reference', $event.target.value)" /></label>
        <label>Fecha de emisión<input type="date" :value="modelValue.issuedOn" @input="edit('issuedOn', $event.target.value)" /></label>
        <label>Vigencia (días)<NumberField :model-value="modelValue.validityDays" :min="0" :max="365" :step="1" integer @update:model-value="edit('validityDays', $event)" /><small>{{ expires ? 'Válido hasta el ' + expires : '0 días: sin vencimiento indicado.' }}</small></label>
      </div>
      <label>Dirección de la obra (opcional)<input :value="modelValue.workAddress" maxlength="200" placeholder="Calle, localidad o referencia de la obra" @input="edit('workAddress', $event.target.value)" /></label>
      <details><summary>Alcance, exclusiones y condiciones</summary>
        <div class="commercial-grid two-columns">
          <label>Alcance del trabajo<textarea :value="modelValue.scope" maxlength="800" rows="3" placeholder="Qué comprende el trabajo cotizado" @input="edit('scope', $event.target.value)" /></label>
          <label>Exclusiones<textarea :value="modelValue.exclusions" maxlength="800" rows="3" placeholder="Trabajos o suministros que no están incluidos" @input="edit('exclusions', $event.target.value)" /></label>
          <label>Plazo estimado de ejecución<input :value="modelValue.executionPeriod" maxlength="120" placeholder="Ej.: 5 días de trabajo desde la fecha acordada" @input="edit('executionPeriod', $event.target.value)" /></label>
          <label>Condiciones de pago<textarea :value="modelValue.paymentTerms" maxlength="400" rows="3" placeholder="Ej.: saldo contra finalización, por transferencia" @input="edit('paymentTerms', $event.target.value)" /></label>
        </div>
      </details>
      <div class="commercial-advance"><label>Anticipo al contado (%)<NumberField :model-value="modelValue.advancePercent" :min="0" :max="100" :step="1" @update:model-value="edit('advancePercent', $event)" /><small>0 %: no solicitar anticipo.</small></label>
        <div v-if="preview && modelValue.advancePercent > 0" class="advance-summary" aria-live="polite"><span>Contado con descuento: <strong>{{ currency(preview.cashTotal) }}</strong></span><span>Anticipo a abonar: <strong>{{ currency(preview.advance) }}</strong></span><span>Saldo restante: <strong>{{ currency(preview.balance) }}</strong></span></div>
      </div>
      <small>El anticipo se calcula sobre el importe al contado, después del descuento. Las cuotas son alternativas independientes; no se les descuenta este anticipo.</small>
    </template>
  </section>
</template>
<style scoped>
.commercial-terms{border:1px solid #475b72;border-radius:12px;padding:20px;margin-top:24px;background:#172331}.commercial-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.commercial-heading h3{margin:0}.commercial-heading p{font-size:13px;color:#bfccda;margin:5px 0 14px}.commercial-toggle{flex-direction:row;align-items:center;font-size:14px;gap:8px;cursor:pointer}.commercial-toggle input{width:18px;height:18px;accent-color:#2475b9}.commercial-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:14px 0}.two-columns{grid-template-columns:repeat(2,minmax(0,1fr))}.commercial-terms>label{margin:16px 0}.commercial-terms details{margin-top:18px}.commercial-terms textarea{resize:vertical}.commercial-terms small{font-size:12px;font-weight:400}.commercial-advance{display:grid;grid-template-columns:minmax(160px,220px) 1fr;gap:20px;align-items:center;margin:20px 0 12px}.advance-summary{display:flex;flex-wrap:wrap;gap:10px 24px}.advance-summary span{display:flex;flex-direction:column;font-size:13px;color:#bfccda}.advance-summary strong{color:#eef5ff;font-size:18px}@media(max-width:650px){.commercial-grid,.two-columns,.commercial-advance{grid-template-columns:1fr}.commercial-terms{padding:16px}}
</style>
