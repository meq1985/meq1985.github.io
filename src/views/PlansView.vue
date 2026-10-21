<script setup>
import { onMounted, ref } from 'vue';
import CatalogHeader from '../components/CatalogHeader.vue';
import { PLANS } from '../services/billingPolicy';
import { loadBillingAccess, startSubscription, refreshSubscription, cancelSubscription } from '../services/billing';
import { currency } from '../data/laborCatalog';
const access = ref(null), error = ref(''), loading = ref(true);
const busy = ref(false), consent = ref(false), cancelConfirm = ref(false), notice = ref('');
async function act(action) {
  if (busy.value) return;
  busy.value = true; error.value = ''; notice.value = '';
  try {
    if (action === 'subscribe') {
      if (!consent.value) throw new Error('Confirmá la mensualidad para continuar.');
      window.location.assign(await startSubscription());
    } else {
      if (action === 'cancel' && !cancelConfirm.value) throw new Error('Confirmá que querés detener la renovación.');
      await (action === 'cancel' ? cancelSubscription() : refreshSubscription());
      access.value = await loadBillingAccess();
      notice.value = action === 'cancel' ? 'Renovación cancelada. Conservás el período que ya pagaste.' : 'Estado consultado. Si el pago sigue pendiente, volvé a consultar en unos minutos.';
      cancelConfirm.value = false;
    }
  } catch { error.value = 'No se pudo completar la operación. Consultá el estado antes de volver a contratar; si persiste, contactá al administrador.'; }
  finally { busy.value = false; }
}
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
    <p v-if="notice" class="catalog-notice" role="status">{{ notice }}</p>
    <template v-if="access">
      <p v-if="access.admin" class="catalog-notice" role="status">Cuenta administradora: acceso completo sin suscripción ni límite de proyectos.</p>
      <p v-else-if="!access.enabled" class="catalog-notice">Estamos preparando los planes. Tu acceso actual continúa disponible y no se realizarán cobros.</p>
      <p v-else-if="access.subscription?.status === 'active' && access.subscription.paidThrough > Date.now()" class="catalog-notice">Tu suscripción está vigente.</p>
      <p v-else class="catalog-notice">{{ access.freeProjectId ? 'Ya tenés asignado tu proyecto gratuito.' : 'Tu primer proyecto es gratuito.' }} El proyecto gratuito sigue disponible aunque no te suscribas.</p>
      <RouterLink v-if="access.freeProjectId" :to="'/proyectos/' + access.freeProjectId + '/editar'">Abrir mi proyecto gratuito →</RouterLink>
      <section v-if="access.subscription?.manageable" class="catalog-panel" aria-label="Gestionar suscripción">
        <p>Renovación: {{ access.subscription.providerStatus === 'cancelled' ? 'cancelada' : 'consultá el estado en Mercado Pago' }}.</p>
        <p v-if="access.subscription.paidThrough > Date.now()">Acceso pago hasta {{ new Date(access.subscription.paidThrough).toLocaleDateString('es-AR') }}.</p>
        <button :disabled="busy" @click="act('refresh')">Actualizar estado del pago</button>
        <template v-if="access.subscription.providerStatus !== 'cancelled'">
          <label><input v-model="cancelConfirm" type="checkbox" :disabled="busy"> Quiero detener las próximas renovaciones. Conservaré el período pagado.</label>
          <button :disabled="busy || !cancelConfirm" @click="act('cancel')">Cancelar renovación</button>
        </template>
      </section>
    </template>
    <div class="plans-grid">
      <article v-for="plan in PLANS" :key="plan.id" class="catalog-panel">
        <p class="eyebrow">{{ plan.available ? 'PRESUPUESTOS' : 'PRÓXIMAMENTE' }}</p><h2>{{ plan.name }}</h2>
        <p class="price">{{ currency(plan.amount) }} <small>ARS / mes</small></p>
        <p>Catálogo editable, proyectos guardados en tu cuenta, historial de versiones y PDF profesional.</p>
        <p v-if="plan.id === 'croquis'">También presupuestos y materiales a partir de un croquis. Se podrá contratar cuando esta función esté disponible.</p>
        <p v-else>Para trabajar en más de un proyecto.</p>
        <template v-if="plan.available && access?.checkoutAvailable && !access.admin && (!access.subscription?.manageable || ['cancelled', 'pending'].includes(access.subscription.providerStatus))">
          <label><input v-model="consent" type="checkbox" :disabled="busy"> Acepto una suscripción de $12.000 ARS por mes, con renovación automática hasta cancelarla. El pago se completa en Mercado Pago.</label>
          <button :disabled="busy || !consent" @click="act('subscribe')">{{ busy ? 'Procesando…' : 'Continuar a Mercado Pago' }}</button>
        </template>
        <button v-else disabled>{{ plan.available ? (access?.subscription?.manageable ? 'Suscripción registrada' : 'Contratación en preparación') : 'Croquis próximamente' }}</button>
      </article>
    </div>
    <p class="muted">La prueba no se convierte automáticamente en un plan pago. No hay modalidad por créditos. La suscripción contratada se renueva mensualmente hasta cancelarla. Volver desde Mercado Pago no confirma un pago: usá «Actualizar estado del pago» para verificarlo.</p>
    <RouterLink to="/proyectos">Volver a Mis proyectos →</RouterLink>
  </main></div>
</template>
<style src="../assets/catalog.css"></style>
<style scoped>
.plans-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.eyebrow{font-size:11px;letter-spacing:1.5px;color:#a8d4ff}.price{font-size:30px;font-weight:700}.price small{font-size:14px;font-weight:400}@media(max-width:700px){.plans-grid{grid-template-columns:1fr;gap:0}}
</style>
