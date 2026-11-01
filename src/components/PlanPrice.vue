<script setup>
import { currency } from '../data/laborCatalog';
defineProps({ plan: { type: Object, required: true } });
</script>
<template>
  <p class="plan-price">
    <s v-if="plan.previousAmount > plan.amount" class="previous-price"><span class="price-label">Precio anterior: </span>{{ currency(plan.previousAmount) }}</s>
    <span class="current-price"><span class="price-label">Precio mensual: </span>{{ currency(plan.amount) }}</span>
    <small>ARS / mes</small>
  </p>
</template>
<style scoped>
.plan-price .previous-price{display:block;font-size:16px;font-weight:400;letter-spacing:0;color:#b6c5d6;line-height:1.3;margin-bottom:5px;text-decoration-thickness:2px}.current-price{display:block}.plan-price small{display:block;font-size:13px;font-weight:400;letter-spacing:0;margin-top:8px}.price-label{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
</style>
