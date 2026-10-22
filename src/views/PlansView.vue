<script setup>
import { computed, onMounted, ref } from 'vue';
import CatalogHeader from '../components/CatalogHeader.vue';
import { PLANS } from '../services/billingPolicy';
import { loadBillingAccess, startSubscription, refreshSubscription, cancelSubscription } from '../services/billing';
import { currency } from '../data/laborCatalog';

const access = ref(null), error = ref(''), loading = ref(true), busy = ref('');
const consent = ref(false), cancelConfirm = ref(false), notice = ref(''), uncertain = ref(false);
const now = ref(Date.now());
const subscription = computed(() => access.value?.subscription);
const paid = computed(() => subscription.value?.planId === 'presupuestos' && subscription.value.status === 'active' && subscription.value.paidThrough > now.value);
const cancelled = computed(() => subscription.value?.providerStatus === 'cancelled');
const pending = computed(() => subscription.value?.providerStatus === 'pending');
const canSubscribe = computed(() => !loading.value && !uncertain.value && access.value?.checkoutAvailable && !access.value.admin && !paid.value &&
  (!subscription.value?.manageable || cancelled.value || pending.value));
const statusTitle = computed(() => {
  if (access.value?.admin) return 'Acceso administrador';
  if (paid.value) return cancelled.value ? 'Plan activo · renovación cancelada' : 'Plan Presupuestos activo';
  if (pending.value) return 'Suscripción pendiente de pago';
  if (!access.value?.enabled) return 'Los planes están en preparación';
  return access.value?.freeProjectId ? 'Tu proyecto gratuito está disponible' : 'Empezá con un proyecto gratuito';
});
const date = value => new Date(value).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'long', year: 'numeric' });
async function load() {
  loading.value = true; error.value = '';
  try { access.value = await loadBillingAccess(); now.value = Date.now(); }
  catch { access.value = null; error.value = 'No pudimos consultar tu cuenta. Revisá tu conexión y volvé a intentar.'; }
  finally { loading.value = false; }
}
async function act(action) {
  if (busy.value || loading.value) return;
  if (action === 'subscribe' && (!canSubscribe.value || !consent.value)) return;
  if (action === 'cancel' && !cancelConfirm.value) return;
  busy.value = action; error.value = ''; notice.value = '';
  try {
    if (action === 'subscribe') window.location.assign(await startSubscription());
    else {
      await (action === 'cancel' ? cancelSubscription() : refreshSubscription());
      access.value = await loadBillingAccess(); now.value = Date.now(); uncertain.value = false;
      notice.value = action === 'cancel' ? 'Renovación cancelada. Conservás el período que ya pagaste.' : paid.value ? 'Pago confirmado. Tu plan está activo.' : 'Estado actualizado. Si acabás de pagar, la confirmación puede demorar unos minutos.';
      cancelConfirm.value = false;
    }
  } catch {
    if (action === 'subscribe') uncertain.value = true;
    error.value = 'No pudimos completar la operación. Actualizá el estado antes de volver a contratar. Si el problema continúa, contactanos.';
  } finally { busy.value = ''; }
}
onMounted(async () => {
  await load();
  // A return URL is only a reason to query our server, never proof of payment.
  if (access.value && !access.value.admin && new URLSearchParams(window.location.search).has('preapproval_id')) await act('refresh');
});
</script>

<template>
  <div class="catalog-page subscription-page">
    <CatalogHeader />
    <main class="catalog-main">
      <header class="plans-heading">
        <div><p class="eyebrow">PLANES DE ELECTRICISTA XPRESS</p><h1>Más proyectos.<br><span>El mismo orden.</span></h1>
          <p class="intro">Probá con un proyecto completo. Cuando necesites trabajar en más, elegí el plan que acompañe tu negocio.</p></div>
        <div class="payment-note"><span aria-hidden="true">↗</span><div><strong>Pagás en Mercado Pago</strong><small>En pesos argentinos · Renovación mensual</small></div></div>
      </header>

      <p v-if="loading" class="account-banner" role="status">Consultando tu cuenta…</p>
      <div v-if="error" class="catalog-notice error" role="alert">{{ error }}
        <button v-if="!access" :disabled="loading" @click="load">Reintentar consulta</button>
        <button v-else :disabled="!!busy" @click="act('refresh')">Actualizar estado del pago</button>
      </div>
      <p v-if="notice" class="catalog-notice" role="status">{{ notice }}</p>

      <section v-if="access" class="account-banner" aria-labelledby="account-title">
        <div><p class="eyebrow">TU CUENTA</p><h2 id="account-title">{{ statusTitle }}</h2>
          <p v-if="access.admin">Acceso completo, sin mensualidad ni límite de proyectos.</p>
          <p v-else-if="paid">Tu acceso está disponible hasta el {{ date(subscription.paidThrough) }}.</p>
          <p v-else-if="!access.enabled">Tu acceso actual continúa disponible. La contratación todavía no está habilitada.</p>
          <p v-else>Un proyecto sin tarjeta ni vencimiento. Seguirá disponible aunque no contrates un plan.</p>
        </div>
        <RouterLink class="secondary-link" :to="access.freeProjectId ? '/proyectos/' + access.freeProjectId + '/editar' : '/proyectos'">{{ access.freeProjectId ? 'Abrir mi proyecto gratuito' : 'Ver mis proyectos' }} →</RouterLink>
      </section>

      <section class="plans-grid" aria-label="Comparar planes">
        <article class="plan-card free-plan">
          <p class="plan-tag">PARA EMPEZAR</p><h2>Tu primer proyecto</h2><p class="plan-description">Conocé la herramienta con un trabajo real.</p>
          <p class="price">$0 <small>sin vencimiento</small></p>
          <ul><li>Un proyecto guardado en tu cuenta</li><li>Catálogo de mano de obra editable</li><li>Historial de versiones</li><li>PDF con tus datos profesionales</li></ul>
          <RouterLink class="plan-link" to="/proyectos">{{ access?.freeProjectId ? 'Ver mi proyecto' : 'Ir a mis proyectos' }} →</RouterLink>
          <small>Sin tarjeta. No se transforma en un plan pago.</small>
        </article>
        <article v-for="plan in PLANS" :key="plan.id" class="plan-card" :class="{ featured: plan.available, upcoming: !plan.available }">
          <p class="plan-tag">{{ plan.available ? 'PARA TU TRABAJO DIARIO' : 'PRÓXIMAMENTE' }}</p><h2>{{ plan.name }}</h2>
          <p class="plan-description">{{ plan.available ? 'Todos tus trabajos, organizados en un solo lugar.' : 'Del plano a los números, en menos pasos.' }}</p>
          <p class="price">{{ currency(plan.amount) }} <small>ARS / mes</small></p>
          <ul><li>Más de un proyecto en tu cuenta</li><li>Precios personalizados y ajustes porcentuales</li><li>Versiones y PDF profesional</li><li v-if="!plan.available">Croquis para calcular presupuestos y materiales</li><li v-else>Acceso desde distintos dispositivos</li></ul>
          <template v-if="plan.available && canSubscribe">
            <label class="check-label"><input v-model="consent" type="checkbox" :disabled="!!busy" data-testid="renewal-consent"><span>Acepto $12.000 ARS por mes, con renovación automática hasta cancelarla.</span></label>
            <button class="primary subscribe-button" :disabled="!!busy || !consent" @click="act('subscribe')">{{ busy === 'subscribe' ? 'Abriendo Mercado Pago…' : pending ? 'Retomar en Mercado Pago' : 'Elegir Presupuestos' }} <span aria-hidden="true">↗</span></button>
            <small>Completás el pago de forma segura en Mercado Pago.</small>
          </template>
          <template v-else>
            <button disabled class="subscribe-button">{{ !plan.available ? 'Croquis próximamente' : access?.admin ? 'Incluido en tu acceso' : paid ? 'Tu plan actual' : loading ? 'Consultando cuenta…' : subscription?.manageable && !cancelled ? 'Suscripción registrada' : 'Contratación en preparación' }}</button>
            <small>{{ !plan.available ? 'Precio previsto. Todavía no se puede contratar.' : paid ? 'Podés gestionar tu renovación más abajo.' : 'Sin cobros hasta que confirmes la contratación.' }}</small>
          </template>
        </article>
      </section>

      <section v-if="subscription?.manageable && !access?.admin" class="management" aria-labelledby="manage-title">
        <div><p class="eyebrow">SIEMPRE BAJO TU CONTROL</p><h2 id="manage-title">Gestioná tu suscripción</h2>
          <p>Renovación: <strong>{{ cancelled ? 'cancelada' : subscription.providerStatus === 'authorized' ? 'automática mensual' : 'pendiente de confirmación' }}</strong>.</p>
          <p v-if="paid">Conservás tu acceso hasta el {{ date(subscription.paidThrough) }}.</p>
          <button :disabled="!!busy" @click="act('refresh')">{{ busy === 'refresh' ? 'Consultando…' : 'Actualizar estado del pago' }}</button>
        </div>
        <div v-if="!cancelled" class="cancel-section"><h3>¿Querés detener la renovación?</h3><p>Podés cancelar los próximos cobros y conservar el período abonado.</p>
          <label class="check-label"><input v-model="cancelConfirm" type="checkbox" :disabled="!!busy" data-testid="cancel-consent"><span>Quiero cancelar las próximas renovaciones.</span></label>
          <button :disabled="!!busy || !cancelConfirm" @click="act('cancel')">{{ busy === 'cancel' ? 'Cancelando…' : 'Cancelar renovación' }}</button>
        </div>
      </section>

      <section class="plans-faq" aria-labelledby="plans-faq-title"><p class="eyebrow">ANTES DE ELEGIR</p><h2 id="plans-faq-title">Sin sorpresas.</h2>
        <details><summary>¿Cómo funciona el proyecto gratuito?</summary><p>Tenés un proyecto sin vencimiento. Podés editarlo, guardar versiones y descargar su PDF. Para trabajar en otros proyectos, necesitás el plan Presupuestos.</p></details>
        <details><summary>¿Cuándo empieza mi acceso pago?</summary><p>Cuando nuestro servidor confirma un pago aprobado. Si volvés de Mercado Pago y todavía está pendiente, podés actualizar el estado desde esta página.</p></details>
        <details><summary>¿Qué pasa cuando cancelo?</summary><p>Se detienen las próximas renovaciones. Conservás el período ya abonado y tu proyecto gratuito continúa disponible. Una devolución puede retirar el acceso correspondiente al pago devuelto.</p></details>
        <details><summary>¿Ya puedo contratar el plan con croquis?</summary><p>Todavía no. Estará disponible cuando terminemos la herramienta de dibujo y el cálculo a partir del croquis.</p></details>
      </section>
      <footer class="plans-footer"><RouterLink to="/proyectos">← Volver a Mis proyectos</RouterLink><a href="mailto:emanuelquiroga.bgh@gmail.com">¿Necesitás ayuda? Contactanos</a></footer>
    </main>
  </div>
</template>
<style src="../assets/catalog.css"></style>
<style scoped src="../assets/subscription.css"></style>
