<script setup>
import { computed, onMounted, ref } from 'vue';
import CatalogHeader from '../components/CatalogHeader.vue';
import { PLANS, TRIAL_MS, paidPlan } from '../services/billingPolicy';
import { PLAN_PRESENTATION } from '../data/planPresentation';
import { loadBillingAccess, startSubscription, refreshSubscription, cancelSubscription } from '../services/billing';
import { currency } from '../data/laborCatalog';

const access = ref(null), error = ref(''), loading = ref(true), busy = ref('');
const consent = ref({}), cancelConfirm = ref(false), notice = ref(''), uncertain = ref(false);
const now = ref(Date.now());
const subscription = computed(() => access.value?.subscription);
const paid = computed(() => !!paidPlan(subscription.value, now.value));
const cancelled = computed(() => subscription.value?.providerStatus === 'cancelled');
const pending = computed(() => subscription.value?.providerStatus === 'pending');
const canSubscribe = computed(() => !loading.value && !uncertain.value && access.value?.checkoutAvailable && !access.value.admin && !paid.value &&
  (!subscription.value?.manageable || cancelled.value || pending.value));
const statusTitle = computed(() => {
  if (access.value?.admin) return 'Acceso administrador';
  if (paid.value) return cancelled.value ? 'Plan activo · renovación cancelada' : `Plan ${subscription.value.planId === 'croquis' ? 'Full' : 'Básico'} activo`;
  if (pending.value) return 'Suscripción pendiente de pago';
  return access.value?.trialStartedAt != null && now.value < access.value.trialStartedAt + TRIAL_MS ? 'Tu prueba gratuita está activa' : 'Tu prueba gratuita terminó';
});
const date = value => new Date(value).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'long', year: 'numeric' });
async function load() {
  loading.value = true; error.value = '';
  try { access.value = await loadBillingAccess(); now.value = Date.now(); }
  catch { access.value = null; error.value = 'No pudimos consultar tu cuenta. Revisá tu conexión y volvé a intentar.'; }
  finally { loading.value = false; }
}
const pendingPlan = computed(() => subscription.value?.pendingPlanId ?? subscription.value?.planId ?? 'presupuestos');
const canChoose = planId => canSubscribe.value && (!pending.value || pendingPlan.value === planId);
function unavailableLabel(planId) {
  if (access.value?.admin) return 'Incluido en tu acceso';
  if (paid.value) return subscription.value.planId === planId ? 'Tu plan actual' : 'Cambiar al finalizar tu período';
  if (loading.value) return 'Consultando cuenta…';
  if (subscription.value?.manageable && !cancelled.value) return pending.value ? 'Cancelá la contratación pendiente para cambiar' : 'Suscripción registrada';
  return planId === 'croquis' ? 'Elegir Full' : 'Elegir Básico';
}
async function act(action, planId) {
  if (busy.value || loading.value) return;
  if (action === 'subscribe' && (!canChoose(planId) || !consent.value[planId])) return;
  if (action === 'cancel' && !cancelConfirm.value) return;
  busy.value = action; error.value = ''; notice.value = '';
  try {
    if (action === 'subscribe') window.location.assign(await startSubscription(planId));
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
        <div><p class="eyebrow">PLANES DE ELECTRICISTA XPRESS</p><h1>Tu forma de cotizar.<br><span>El plan que te acompaña.</span></h1>
          <p class="intro">Básico para presupuestar desde el catálogo. Full para sumar el croquis de obra nueva y preparar un borrador de mano de obra.</p></div>
        <div class="payment-note"><span aria-hidden="true">↗</span><div><strong>Mensualidad con Mercado Pago</strong><small>En pesos argentinos · Renovación mensual</small></div></div>
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
          <p v-else-if="access.trialStartedAt != null && now < access.trialStartedAt + TRIAL_MS">Disponible hasta el {{ date(access.trialStartedAt + TRIAL_MS) }}. Sin tarjeta ni cobro automático.</p><p v-else>Podés consultar tus proyectos y descargar sus PDF. Elegí un plan para guardar cambios.</p>
        </div>
        <RouterLink class="secondary-link" to="/proyectos">Ver mis proyectos →</RouterLink>
      </section>

      <section class="plans-grid" aria-label="Comparar planes">
        <article class="plan-card free-plan">
          <p class="plan-tag">PARA EMPEZAR</p><h2>Un mes gratis</h2><p class="plan-description">Conocé la herramienta con un trabajo real.</p>
          <p class="price">$0 <small>30 días · sin tarjeta</small></p>
          <ul><li>Hasta 10 proyectos durante los 30 días</li><li>Catálogo de mano de obra editable</li><li>Historial de versiones</li><li>PDF con tus datos profesionales</li><li>Croquis, circuitos y lista de materiales del Full</li></ul>
          <RouterLink class="plan-link" to="/proyectos">Ir a mis proyectos →</RouterLink>
          <small>Sin tarjeta. No se transforma en un plan pago.</small>
        </article>
        <article v-for="plan in PLANS" :key="plan.id" class="plan-card" :class="{ featured: plan.id === 'croquis' }">
          <p class="plan-tag">{{ PLAN_PRESENTATION[plan.id].tag }}</p><h2>{{ PLAN_PRESENTATION[plan.id].title }}</h2>
          <p class="plan-description">{{ PLAN_PRESENTATION[plan.id].description }}</p>
          <p class="price">{{ currency(plan.amount) }} <small>ARS / mes</small></p>
          <ul><li>Hasta 100 proyectos · 10 guardados diarios</li><li v-for="feature in PLAN_PRESENTATION[plan.id].features" :key="feature">{{ feature }}</li></ul>
          <template v-if="plan.available && canChoose(plan.id)">
            <label class="check-label"><input v-model="consent[plan.id]" type="checkbox" :disabled="!!busy" data-testid="renewal-consent"><span>Acepto {{ currency(plan.amount) }} ARS por mes, con renovación automática hasta cancelarla.</span></label>
            <button class="primary subscribe-button" :disabled="!!busy || !consent[plan.id]" @click="act('subscribe', plan.id)">{{ busy === 'subscribe' ? 'Abriendo Mercado Pago…' : pending ? 'Retomar en Mercado Pago' : plan.id === 'croquis' ? 'Elegir Full' : 'Elegir Presupuestos' }} <span aria-hidden="true">↗</span></button>
            <small>Completás el pago de forma segura en Mercado Pago.</small>
          </template>
          <template v-else>
            <button disabled class="subscribe-button">{{ unavailableLabel(plan.id) }}</button>
            <small>{{ !plan.available ? 'Ambientes, puntos eléctricos y presupuesto de mano de obra.' : paid ? 'Podés gestionar tu renovación más abajo.' : 'Sin cobros hasta que confirmes la contratación.' }}</small>
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

      <p class="catalog-notice">Para cambiar de plan, cancelá la renovación actual y elegí el nuevo al finalizar el período abonado. Conservás tus proyectos y sus PDF; el Básico conserva los croquis anteriores sin permitir editarlos.</p>
      <section class="plans-faq" aria-labelledby="plans-faq-title"><p class="eyebrow">ANTES DE ELEGIR</p><h2 id="plans-faq-title">Sin sorpresas.</h2>
        <details><summary>¿Cómo funciona la prueba gratuita?</summary><p>Tenés 30 días desde tu primer acceso verificado a Presupuestar o Planes. Podés crear hasta 10 proyectos durante la prueba y realizar hasta 10 guardados diarios, guardar versiones y descargar sus PDF. No requiere tarjeta ni se convierte en un cobro automático.</p></details>
        <details><summary>¿Cuándo empieza mi acceso pago?</summary><p>Cuando nuestro servidor confirma un pago aprobado. Si volvés de Mercado Pago y todavía está pendiente, podés actualizar el estado desde esta página.</p></details>
        <details><summary>¿Qué pasa cuando cancelo?</summary><p>Se detienen las próximas renovaciones. Conservás el período ya abonado. Tus proyectos guardados se pueden consultar y descargar; guardar cambios o crear otros requiere una suscripción activa. Una devolución puede retirar el acceso correspondiente al pago devuelto.</p></details>
        <details><summary>¿Qué incluye el Full con croquis?</summary><p>Suma ambientes, niveles y puntos eléctricos, medidor, tableros, jabalinas y recorridos medidos. Prepara un borrador de mano de obra que revisás antes de aplicar.</p></details><details><summary>¿Calcula materiales y secciones de cables?</summary><p>El croquis estima materiales, circuitos, secciones y caída de tensión a partir de los recorridos dibujados. El profesional debe revisar las hipótesis y validar la instalación.</p></details>
      </section>
      <footer class="plans-footer"><RouterLink to="/proyectos">← Volver a Mis proyectos</RouterLink><RouterLink to="/aviso-legal">Aviso legal</RouterLink><RouterLink to="/seguridad">Seguridad y confianza</RouterLink><RouterLink to="/gestiones#baja">Botón de baja</RouterLink><RouterLink to="/gestiones#arrepentimiento">Botón de arrepentimiento</RouterLink><RouterLink to="/condiciones">Condiciones</RouterLink><RouterLink to="/privacidad">Privacidad</RouterLink><a href="mailto:meq1985@hotmail.com">¿Necesitás ayuda? Contactanos</a></footer>
    </main>
  </div>
</template>
<style src="../assets/catalog.css"></style>
<style scoped src="../assets/subscription.css"></style>
