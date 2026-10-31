<script setup>
import { PLAN_COMPARISON } from '../data/planPresentation';
</script>
<template>
  <div class="plan-comparison">
    <table>
      <caption>Compará las herramientas de cada plan</caption>
      <thead><tr><th scope="col">Herramientas</th><th scope="col">Básico</th><th scope="col">Full</th></tr></thead>
      <tbody><tr v-for="row in PLAN_COMPARISON" :key="row.label"><th scope="row">{{ row.label }}</th><td><span :aria-label="row.basic ? 'Incluido' : 'No incluido'">{{ row.basic ? 'Sí' : '—' }}</span></td><td class="full-included">Sí</td></tr></tbody>
    </table>
    <p>Los 30 días de prueba incluyen las herramientas de Full y hasta 10 proyectos. Los planes pagos permiten hasta 100 proyectos. Límite de 10 guardados diarios por cuenta.</p>
    <p>Los cálculos y materiales son propuestas para revisar: el profesional valida las hipótesis y la instalación.</p>
  </div>
</template>
<style scoped>
.plan-comparison{margin-top:28px;border:1px solid #354b63;border-radius:14px;padding:24px;background:#162331;color:#e4edf8}.plan-comparison table{width:100%;border-collapse:collapse;table-layout:fixed}.plan-comparison caption{text-align:left;font-size:20px;font-weight:700;margin-bottom:18px}.plan-comparison th,.plan-comparison td{padding:12px 10px;border-bottom:1px solid #354b63;overflow-wrap:anywhere}.plan-comparison th:first-child{width:62%;text-align:left}.plan-comparison thead th{font-size:14px;color:#a8d4ff}.plan-comparison tbody th{font-size:14px;font-weight:400}.plan-comparison td{text-align:center}.plan-comparison .full-included{color:#9fd1ff;background:#203c54;font-weight:700}.plan-comparison p{font-size:12px;line-height:1.65;color:#b8c8da;margin:16px 0 0}@media(max-width:650px){.plan-comparison{padding:16px}.plan-comparison th,.plan-comparison td{padding:10px 5px}.plan-comparison th:first-child{width:58%}.plan-comparison tbody th{font-size:13px}}
</style>
