<script setup>
import { onMounted, ref } from 'vue';
import NumberField from './NumberField.vue';
import { defaultPromotionSettings } from '../services/promotions';
import { loadPromotionSettings, savePromotionSettings } from '../services/promotionPersistence';
const draft = ref(defaultPromotionSettings()), baseline = ref(null), busy = ref(false), error = ref(''), notice = ref('');
async function load() { error.value = ''; busy.value = true; try { const value = await loadPromotionSettings(); baseline.value = value; draft.value = structuredClone(value); } catch (e) { error.value = e.message; } finally { busy.value = false; } }
async function save() { if (busy.value || !baseline.value) return; busy.value = true; error.value = ''; notice.value = ''; try { const value = await savePromotionSettings(draft.value, baseline.value); baseline.value = value; draft.value = structuredClone(value); notice.value = 'Promociones guardadas. Podés elegirlas en cada presupuesto; los anteriores conservan sus opciones.'; } catch (e) { error.value = e.message; } finally { busy.value = false; } }
onMounted(load);
</script>
<template><section class="catalog-panel" aria-labelledby="promotions-title"><h3 id="promotions-title">Promociones y formas de pago</h3><p>Configurá tus opciones y elegí cuáles mostrar en cada presupuesto. El descuento es solo para contado; las cuotas se calculan sobre el total original con el recargo indicado.</p><p v-if="error" role="alert">{{ error }} <button type="button" @click="load">Recargar promociones</button></p><p v-if="notice" role="status">{{ notice }}</p><fieldset :disabled="busy || !baseline"><div class="catalog-fields"><label>Descuento al contado (%)<NumberField v-model="draft.discountPercent" :min="0" :max="100" :step="0.1" aria-label="Descuento al contado configurado" /></label><label v-for="plan in draft.installments" :key="plan.count">Recargo {{ plan.count }} cuotas (%)<NumberField v-model="plan.surchargePercent" :min="0" :max="1000" :step="0.1" :aria-label="'Recargo configurado ' + plan.count + ' cuotas'" /></label></div><button type="button" class="primary" @click="save">Guardar promociones</button></fieldset></section></template>
