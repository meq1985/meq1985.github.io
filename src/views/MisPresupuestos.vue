<script setup>
import { onMounted, ref } from 'vue';
import CatalogHeader from '../components/CatalogHeader.vue';
import { requireUser } from '../firebase/session';
import { listBudgets, deleteBudget, downloadBudget } from '../services/localBudgets';
import { importLocalBudget } from '../services/projects';
import { currency } from '../data/laborCatalog';

const pdfList = ref([]);
const error = ref('');
const loading = ref(true);
const importing = ref(''), imported = ref({}), notice = ref('');
async function copyToAccount(pdf) {
  if (importing.value) return;
  importing.value = pdf.id; error.value = ''; notice.value = '';
  try {
    const id = await importLocalBudget(pdf);
    imported.value[pdf.id] = id;
    notice.value = 'Presupuesto copiado a tu cuenta. El archivo original sigue guardado en este navegador. Revisá los datos profesionales al abrir el proyecto.';
  } catch (cause) { error.value = 'No se pudo importar: ' + cause.message; }
  finally { importing.value = ''; }
}
const date = value => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Sin fecha' : parsed.toLocaleDateString('es-AR', { timeZone: 'UTC' });
};
async function load() {
  try {
    const user = await requireUser();
    pdfList.value = await listBudgets(user.uid);
  } catch (cause) { error.value = 'No se pudieron cargar los presupuestos: ' + cause.message; }
  finally { loading.value = false; }
}
async function remove(pdf) {
  if (!confirm('¿Eliminar este presupuesto de este navegador?')) return;
  try {
    const user = await requireUser();
    await deleteBudget(user.uid, pdf.id);
    pdfList.value = pdfList.value.filter(item => item.id !== pdf.id);
  } catch (cause) { error.value = 'No se pudo eliminar: ' + cause.message; }
}
async function download(pdf) {
  try {
    const user = await requireUser();
    if (pdf.owner !== user.uid) throw new Error('La cuenta no coincide.');
    downloadBudget(pdf);
  } catch (cause) { error.value = 'No se pudo descargar: ' + cause.message; }
}
onMounted(load);
</script>

<template>
  <div class="catalog-page history-page">
    <CatalogHeader />
    <div class="catalog-main">
      <div class="history-heading">
        <div><p class="eyebrow">TU TRABAJO, ORGANIZADO</p><h1>Presupuestos locales</h1><p class="muted">Tus archivos originales de este navegador. Podés copiarlos a tu cuenta para continuar como proyectos.</p></div>
        <RouterLink class="new-budget" to="/dashboard">+ Crear presupuesto</RouterLink>
      </div>
      <aside class="storage-note" aria-label="Almacenamiento de presupuestos"><span class="storage-icon" aria-hidden="true">↓</span><div><strong>Tu historial en este dispositivo</strong><p>Guardado en este navegador. Descargá una copia de tus PDF: borrar los datos del navegador puede eliminar este historial.</p><small>Los PDF antiguos de Firebase Storage no se migraron.</small></div></aside>
      <p v-if="notice" role="status" class="catalog-notice">{{ notice }}</p><p><RouterLink to="/proyectos">Ver Mis proyectos guardados en la cuenta →</RouterLink></p>
      <p v-if="error" role="alert" class="catalog-notice error">{{ error }}</p>
      <p v-if="loading" role="status" class="catalog-panel">Cargando tus presupuestos…</p>
      <section v-else-if="!pdfList.length && !error" class="catalog-panel empty-history" aria-labelledby="empty-title"><span class="empty-icon" aria-hidden="true">↗</span><h2 id="empty-title">Tu próximo trabajo empieza acá</h2><p class="muted">Todavía no guardaste presupuestos en este navegador. Creá uno para tener su detalle y PDF a mano.</p><RouterLink to="/dashboard">Preparar mi primer presupuesto →</RouterLink></section>
      <section v-else-if="pdfList.length" aria-labelledby="saved-title">
        <div class="saved-heading"><h2 id="saved-title">Presupuestos guardados</h2><span class="count">{{ pdfList.length }} {{ pdfList.length === 1 ? 'presupuesto' : 'presupuestos' }}</span></div>
        <div class="budget-grid">
          <article v-for="pdf in pdfList" :key="pdf.id" class="budget-card">
            <div class="card-top"><span class="pdf-badge">PDF</span><time :datetime="pdf.createdAt">{{ date(pdf.createdAt) }}</time></div>
            <p class="client-label">CLIENTE</p><h3>{{ pdf.cliente }}</h3>
            <div class="budget-amount"><span>Total presupuestado</span><strong>{{ currency(pdf.total) }}</strong></div>
            <div class="catalog-actions"><button v-if="!imported[pdf.id]" :disabled="Boolean(importing)" @click="copyToAccount(pdf)">{{ importing === pdf.id ? 'Copiando…' : 'Copiar a mi cuenta' }}</button><RouterLink v-else :to="'/proyectos/' + imported[pdf.id] + '/editar'">Abrir proyecto importado →</RouterLink></div><div class="card-actions"><button type="button" class="primary" :aria-label="'Descargar presupuesto de ' + pdf.cliente" @click="download(pdf)">Descargar PDF <span aria-hidden="true">↓</span></button><button type="button" class="delete-budget" :aria-label="'Eliminar presupuesto de ' + pdf.cliente" @click="remove(pdf)">Eliminar</button></div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
<style src="../assets/catalog.css"></style>
<style scoped>
.history-heading{display:flex;align-items:center;justify-content:space-between;gap:24px;margin:12px 0 28px}.eyebrow{font-size:11px;letter-spacing:1.8px;font-weight:700;color:#99cfff}.new-budget{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 20px;background:#2475b9;border:1px solid #6eb9f4;border-radius:7px;text-decoration:none;font-weight:700;white-space:nowrap;color:#edf2f8}.storage-note{display:flex;gap:18px;padding:22px 24px;border:1px solid #3f5870;background:#1b2a39;border-radius:12px;margin-bottom:34px}.storage-note p{color:#bfccda;margin:6px 0}.storage-note small{font-size:12px}.storage-icon{display:grid;place-items:center;flex-shrink:0;width:38px;height:38px;border:1px solid #6a8aa9;border-radius:9px;color:#a8d4ff;font-size:24px}.saved-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:18px}.saved-heading h2{margin:0}.count{font-size:13px;color:#bfccda}.budget-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr));gap:20px}.budget-card{min-width:0;padding:24px;background:#202833;border:1px solid #475366;border-radius:12px;display:flex;flex-direction:column}.card-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px}.pdf-badge{background:#263e55;border:1px solid #648aaf;border-radius:6px;padding:6px 9px;letter-spacing:1px;font-size:11px;font-weight:700;color:#b5dcff}.card-top time{font-size:13px;color:#bfccda}.history-page .client-label{font-size:10px;letter-spacing:1.5px;color:#bfccda;margin:0 0 6px}.history-page .budget-card h3{font-size:20px;margin:0 0 24px;overflow-wrap:anywhere}.budget-amount{margin-top:auto;border-top:1px solid #475366;padding:18px 0;display:flex;flex-direction:column;gap:6px}.budget-amount span{font-size:13px;color:#bfccda}.budget-amount strong{font-size:27px;overflow-wrap:anywhere}.card-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.card-actions .primary{flex:1;display:flex;justify-content:space-between;gap:20px}.card-actions .delete-budget{color:#ffc1c1;background:transparent;border-color:#8e6569}.empty-history{text-align:center;padding:48px 24px}.empty-history p{max-width:480px;margin:0 auto 22px}.empty-icon{display:grid;place-items:center;margin:0 auto 20px;width:52px;height:52px;border:1px solid #648aaf;border-radius:12px;color:#a8d4ff;font-size:28px}.history-page a:focus-visible{outline:3px solid #70bcff;outline-offset:4px}@media(max-width:650px){.history-heading{align-items:flex-start;flex-direction:column;gap:14px}.new-budget{width:100%}.storage-note{padding:18px;gap:12px}.saved-heading{align-items:flex-start;flex-direction:column;gap:6px}.budget-card{padding:20px}}
</style>
