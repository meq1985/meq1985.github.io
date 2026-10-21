<script setup>
import { onMounted, ref } from 'vue';
import CatalogHeader from '../components/CatalogHeader.vue';
import { PLANS } from '../services/billingPolicy';
import { loadBillingAccess } from '../services/billing';
import { currency } from '../data/laborCatalog';
const access = ref(null), error = ref(''), loading = ref(true);
async function load() {
  loading.value = true; error.value = '';
  try { access.value = await loadBillingAccess(); }
  catch (cause) { error.value = 'No se pudo consultar el acceso de tu cuenta: ' + cause.message; }
  finally { loading.value = false; }
}
onMounted(load);
</script>
<template>
  <div class="catalog-page"><CatalogHeader /><main class="catalog-main">
    <p class="eyebrow">ELEGÍ CÓMO TRABAJAR</p><h1>Planes y suscripción</h1>
    <p>Un proyecto gratuito, sin tarjeta y sin vencimiento. Podés editarlo, guardar versiones y descargar su PDF. Para trabajar en más proyectos, necesitás una suscripción.</p>
    <p v-if="loading" role="status">Consultando tu cuenta…</p>
    <p v-if="error" class="catalog-notice error" role="alert">{{ error }} <button @click="load">Reintentar</button></p>
    <template v-if="access">
      <p v-if="access.admin" class="catalog-notice" role="status">Cuenta administradora: acceso completo sin suscripción ni límite de proyectos.</p>
      <p v-else-if="!access.enabled" class="catalog-notice">Estamos preparando los planes. Tu acceso actual continúa disponible y no se realizarán cobros.</p>
      <p v-else-if="access.subscription?.status === 'active' && access.subscription.paidThrough > Date.now()" class="catalog-notice">Tu suscripción está vigente.</p>
      <p v-else class="catalog-notice">{{ access.freeProjectId ? 'Ya tenés asignado tu proyecto gratuito.' : 'Tu primer proyecto es gratuito.' }} El proyecto gratuito sigue disponible aunque no te suscribas.</p>
      <RouterLink v-if="access.freeProjectId" :to="'/proyectos/' + access.freeProjectId + '/editar'">Abrir mi proyecto gratuito →</RouterLink>
    </template>
    <div class="plans-grid">
      <article v-for="plan in PLANS" :key="plan.id" class="catalog-panel">
        <p class="eyebrow">{{ plan.available ? 'PRESUPUESTOS' : 'PRÓXIMAMENTE' }}</p><h2>{{ plan.name }}</h2>
        <p class="price">{{ currency(plan.amount) }} <small>ARS / mes</small></p>
        <p>Catálogo editable, proyectos guardados en tu cuenta, historial de versiones y PDF profesional.</p>
        <p v-if="plan.id === 'croquis'">También presupuestos y materiales a partir de un croquis. Se podrá contratar cuando esta función esté disponible.</p>
        <p v-else>Para trabajar en más de un proyecto.</p>
        <button disabled>{{ plan.available ? 'Contratación en preparación' : 'Croquis próximamente' }}</button>
      </article>
    </div>
    <p class="muted">La prueba no se convierte automáticamente en un plan pago. No hay modalidad por créditos. La contratación mensual con Mercado Pago se habilitará después de completar sus pruebas.</p>
    <RouterLink to="/proyectos">Volver a Mis proyectos →</RouterLink>
  </main></div>
</template>
<style src="../assets/catalog.css"></style>
<style scoped>
.plans-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.eyebrow{font-size:11px;letter-spacing:1.5px;color:#a8d4ff}.price{font-size:30px;font-weight:700}.price small{font-size:14px;font-weight:400}@media(max-width:700px){.plans-grid{grid-template-columns:1fr;gap:0}}
</style>
