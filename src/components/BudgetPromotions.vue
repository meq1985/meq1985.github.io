<script setup>
import { computed } from 'vue';
import { currency } from '../data/laborCatalog';
import { defaultPromotionSettings, paymentSummary } from '../services/promotions';
const props = defineProps({ modelValue: Object, defaults: { type: Object, default: defaultPromotionSettings }, total: Number });
const emit = defineEmits(['update:modelValue']);
// Saved projects retain their quoted percentages; toggling on uses the current preset.
const discountPercent = computed(() => props.modelValue.discountPercent || props.defaults.discountPercent);
const plans = computed(() => props.defaults.installments.map(preset => ({ ...preset,
  ...(props.modelValue.installments.find(p => p.count === preset.count) ?? {}) })));
const preview = computed(() => { try { return paymentSummary(props.total, { discountPercent: discountPercent.value, installments: plans.value }); } catch { return null; } });
const selected = count => props.modelValue.installments.some(p => p.count === count);
function discount(enabled) { emit('update:modelValue', { ...props.modelValue, discountPercent: enabled ? props.defaults.discountPercent : 0 }); }
function toggle(plan, enabled) {
  emit('update:modelValue', { ...props.modelValue, installments: enabled
    ? [...props.modelValue.installments, { ...plan }] : props.modelValue.installments.filter(p => p.count !== plan.count) });
}
</script>
<template>
  <section class="budget-promotions" aria-labelledby="payment-title">
    <div class="promotion-heading"><div><h3 id="payment-title">Promociones</h3><p>Marcá las opciones que querés ofrecer en este presupuesto.</p></div><RouterLink to="/config">Configurar promociones →</RouterLink></div>
    <div class="promotion-grid">
      <label class="payment-card" :class="{ selected: modelValue.discountPercent > 0, unavailable: !discountPercent }">
        <span class="option-heading"><input type="checkbox" :checked="modelValue.discountPercent > 0" :disabled="!discountPercent" @change="discount($event.target.checked)" aria-label="Aplicar descuento al contado" /><span>Contado</span></span>
        <span class="promotion-condition">{{ discountPercent ? discountPercent + ' % de descuento' : 'Sin descuento configurado' }}</span>
        <template v-if="preview && discountPercent"><strong class="promotion-total">{{ currency(preview.cashTotal) }}</strong><small>Total al contado</small></template>
        <small v-else>Definí el descuento en Configuración.</small>
      </label>
      <label v-for="preset in defaults.installments" :key="preset.count" class="payment-card" :class="{ selected: selected(preset.count) }">
        <span class="option-heading"><input type="checkbox" :checked="selected(preset.count)" @change="toggle(preset, $event.target.checked)" :aria-label="'Incluir ' + preset.count + ' cuotas'" /><span>{{ preset.count }} cuotas</span></span>
        <template v-for="plan in preview?.plans.filter(p => p.count === preset.count)" :key="plan.count">
          <span class="promotion-condition">{{ plan.surchargePercent ? plan.surchargePercent + ' % de recargo' : 'Sin recargo' }}</span>
          <strong class="promotion-total">{{ currency(plan.total) }}</strong>
          <small v-if="plan.installment === plan.lastInstallment">{{ plan.count }} de {{ currency(plan.installment) }}</small>
          <small v-else>{{ plan.count - 1 }} de {{ currency(plan.installment) }}<br />Última de {{ currency(plan.lastInstallment) }}</small>
        </template>
      </label>
    </div>
    <p v-if="!preview" role="alert">Revisá las promociones configuradas antes de guardar o descargar.</p>
    <p class="promotion-note">Descuento solo para contado. Las cuotas se calculan sobre el total original.</p>
  </section>
</template>
<style scoped>
.budget-promotions{margin:24px 0;padding:22px;border:1px solid #3c526b;border-radius:12px;background:#192430}
.promotion-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:18px}
.budget-promotions .promotion-heading h3{margin:0 0 5px;font-size:18px}.budget-promotions .promotion-heading p{margin:0;color:#bfccda;font-size:14px}
.promotion-heading a{font-size:13px;text-underline-offset:4px;padding-top:3px}
.promotion-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.budget-promotions .payment-card{display:flex;flex-direction:column;align-items:stretch;gap:8px;min-width:0;padding:16px;border:1px solid #45566b;border-radius:9px;background:#141e29;cursor:pointer;font-weight:400;transition:border-color .15s,background .15s}
.payment-card:hover{border-color:#81bce9}.budget-promotions .payment-card.selected{border-color:#8bcaff;background:#203a50;box-shadow:inset 0 0 0 1px #8bcaff}
.payment-card:focus-within{outline:2px solid #ffda84;outline-offset:3px}.payment-card.unavailable{opacity:.65;cursor:default}
.option-heading{display:flex;align-items:center;gap:10px;font-weight:700;font-size:16px}
.budget-promotions .payment-card input[type=checkbox]{width:18px;height:18px;min-height:18px;min-width:18px;flex:0 0 18px;padding:0;margin:0;accent-color:#8bcaff;cursor:inherit}
.promotion-condition{font-size:13px;color:#bcd1e4}.promotion-total{display:block;margin-top:4px;font-size:19px;line-height:1.3;color:#edf4fc;overflow-wrap:anywhere}
.payment-card small{font-size:12px;line-height:1.5;font-weight:400;color:#bfccda}.budget-promotions .promotion-note{margin:14px 0 0;font-size:12px;color:#bfccda}
@media(max-width:1050px){.promotion-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.budget-promotions{padding:16px}.promotion-grid{grid-template-columns:1fr}.payment-card{padding:14px}}
</style>
