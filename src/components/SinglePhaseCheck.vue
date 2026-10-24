<script setup>
import { ref, computed } from 'vue';
import NumberField from './NumberField.vue';
import { singlePhaseCheck } from '../services/singlePhaseCheck';
const values = ref({ apparentVA: null, voltage: 220, meters: null, resistance: null, powerFactor: 1, limitPercent: 2,
  ignoreReactance: false, reactance: null, breakerA: null, correctedAmpacityA: null, breakingKA: null, prospectiveKA: null });
const props = defineProps({ disabled: Boolean });
const fields = { apparentVA: 'Demanda aparente (VA)', voltage: 'Tensión (V)', meters: 'Longitud de ida del tramo (m)',
  resistance: 'Resistencia del conductor (Ω/km)', powerFactor: 'Factor de potencia', limitPercent: 'Límite elegido (%)', reactance: 'Reactancia (Ω/km)',
  breakerA: 'Protección seleccionada (A)', correctedAmpacityA: 'Corriente admisible corregida (A)', breakingKA: 'Poder de corte seleccionado (kA)', prospectiveKA: 'Cortocircuito previsto (kA)' };
const result = computed(() => { try { return { data: singlePhaseCheck(values.value) }; } catch (cause) { return { error: cause.message }; } });
const format = value => value.toLocaleString('es-AR', { maximumFractionDigits: 4 });
function example() {
  if (props.disabled) return;
  values.value = { apparentVA: 440, voltage: 220, meters: 24, resistance: 7.98, powerFactor: 0.95, limitPercent: 2,
    ignoreReactance: true, reactance: null, breakerA: 10, correctedAmpacityA: 21, breakingKA: 3, prospectiveKA: null };
}
</script>
<template>
  <details class="phase-check"><summary>Comprobar un tramo monofásico</summary><fieldset :disabled="disabled">
    <p>Comprobación parcial de un tramo, con datos ingresados por vos. No selecciona la sección ni la protección y no verifica la instalación completa.</p>
    <button type="button" @click="example">Cargar caso de 11 bocas</button>
    <p class="muted">El caso usa 440 VA, 24 m de ida y los valores aportados para un cable de 2,5 mm²; no son valores generales para cualquier circuito.</p>
    <div class="catalog-fields"><label v-for="(label, key) in fields" :key="key">{{ label }}<NumberField v-model="values[key]" nullable :min="key === 'powerFactor' ? 0 : ['meters', 'resistance', 'reactance', 'apparentVA'].includes(key) ? 0 : 0.001" :max="key === 'powerFactor' ? 1 : 10000000" :step="key === 'powerFactor' ? 0.01 : 0.1" :disabled="key === 'reactance' && values.ignoreReactance" /></label></div>
    <label class="phase-option"><input v-model="values.ignoreReactance" type="checkbox" />Omitir reactancia expresamente para esta comprobación</label>
    <p v-if="result.error" role="status">{{ result.error }}</p>
    <div v-else class="catalog-notice" aria-live="polite"><p>Corriente: {{ format(result.data.current) }} A · Caída: {{ format(result.data.drop) }} V · {{ format(result.data.percent) }} %</p>
      <p>{{ result.data.withinLimit ? 'Dentro' : 'Fuera' }} del límite elegido para este tramo.</p>
      <p>Relación IB ≤ In ≤ Iz: {{ result.data.overloadCheck === null ? 'faltan datos' : result.data.overloadCheck ? 'cumple con los valores ingresados' : 'no cumple' }}.</p>
      <p>Poder de corte frente al cortocircuito previsto: {{ result.data.breakingCheck === null ? 'pendiente: falta la corriente prevista o el poder de corte' : result.data.breakingCheck ? 'cumple con los valores ingresados' : 'no cumple' }}.</p>
      <p>Faltan las demás verificaciones de protección y la caída acumulada desde el origen. Este resultado no aprueba una selección técnica.</p>
    </div>
  </fieldset></details>
</template>
<style scoped>.phase-check{border-top:1px solid #475366;padding-top:16px;margin-top:20px}.phase-check summary{cursor:pointer;font-weight:700;padding:10px 0}.phase-check .catalog-fields{grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}.phase-option{display:flex;gap:10px;align-items:center}.phase-option input{width:20px;height:20px}</style>
