<script setup>
import { onMounted, ref } from 'vue';
import CatalogHeader from '../components/CatalogHeader.vue';
import { listProjects, listProjectVersions, loadProjectVersion } from '../services/projects';
import { requireUser } from '../firebase/session';
import { buildBudgetPdf } from '../services/budgetPdf';
import { currency } from '../data/laborCatalog';
const items = ref([]), loading = ref(false), busy = ref(false), error = ref('');
const cursor = ref(null), hasMore = ref(false), selected = ref(null), versions = ref([]);
const versionCursor = ref(null), moreVersions = ref(false), ownerUid = ref('');
const date = value => value?.toDate?.().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }) ?? 'Fecha pendiente';
async function more() {
  if (loading.value) return;
  loading.value = true; error.value = '';
  try {
    const user = await requireUser();
    if (ownerUid.value && user.uid !== ownerUid.value) throw new Error('La sesión cambió. Volvé a abrir Mis proyectos.');
    const page = await listProjects(cursor.value);
    ownerUid.value = user.uid; items.value.push(...page.items); cursor.value = page.cursor; hasMore.value = page.hasMore;
  } catch (cause) { error.value = 'No se pudieron cargar los proyectos: ' + cause.message; }
  finally { loading.value = false; }
}
async function showVersions(project, append = false) {
  if (busy.value) return;
  busy.value = true; error.value = '';
  if (!append) { selected.value = project; versions.value = []; versionCursor.value = null; moreVersions.value = false; }
  try {
    const user = await requireUser();
    if (user.uid !== ownerUid.value) throw new Error('La sesión cambió. Volvé a abrir Mis proyectos.');
    const page = await listProjectVersions(project.id, append ? versionCursor.value : null);
    versions.value.push(...page.items); versionCursor.value = page.cursor; moreVersions.value = page.hasMore;
  } catch (cause) { error.value = cause.message; }
  finally { busy.value = false; }
}
async function download(project, version = null) {
  if (busy.value) return;
  busy.value = true; error.value = '';
  try {
    const user = await requireUser();
    if (user.uid !== ownerUid.value) throw new Error('La sesión cambió. Volvé a abrir Mis proyectos.');
    const stored = version ?? await loadProjectVersion(project.id, project.revision);
    if (!stored.profile) throw new Error('Este proyecto no incluía datos profesionales. Abrí el proyecto, revisá tus datos y guardá una nueva versión para generar su PDF.');
    const document = await buildBudgetPdf(stored.budget, stored.profile);
    if ((await requireUser()).uid !== user.uid) throw new Error('La sesión cambió. Volvé a abrir Mis proyectos.');
    const filename = project.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
    document.save(`presupuesto-${filename}-v${stored.revision}.pdf`);
  } catch (cause) { error.value = cause.message; }
  finally { busy.value = false; }
}
onMounted(more);
</script>
<template>
  <div class="catalog-page">
    <CatalogHeader />
    <div class="catalog-main">
      <div class="project-heading"><div><p class="eyebrow">DISPONIBLES DONDE TRABAJES</p><h1>Mis proyectos</h1><p class="muted">Guardados en tu cuenta, con sus datos, precios y versiones.</p></div><RouterLink class="project-link" to="/dashboard">+ Crear proyecto</RouterLink></div>
      <p class="catalog-notice">Podés continuar desde otro dispositivo al ingresar con la misma cuenta. Cada guardado crea una versión; los cambios de precios no modifican las anteriores.</p>
      <p v-if="error" role="alert" class="catalog-notice error">{{ error }}</p>
      <p v-if="loading" role="status">Cargando proyectos de tu cuenta…</p>
      <section v-if="!loading && !error && !items.length" class="catalog-panel"><h2>Tu próximo proyecto empieza acá</h2><p>Creá un presupuesto y elegí «Guardar proyecto en mi cuenta» para retomarlo más adelante.</p><RouterLink to="/dashboard">Preparar mi primer proyecto →</RouterLink></section>
      <div class="project-grid">
        <article v-for="project in items" :key="project.id" class="catalog-panel project-card">
          <span class="project-version">VERSIÓN {{ project.revision }}</span><h2>{{ project.name }}</h2><p class="muted">{{ project.cliente }}<span v-if="project.tipoInmueble"> · {{ project.tipoInmueble }}</span></p>
          <small>Último guardado: {{ date(project.updatedAt) }}</small><p class="project-total">{{ currency(project.total) }}</p>
          <div class="catalog-actions"><RouterLink class="project-link" :to="'/proyectos/' + project.id + '/editar'">Abrir proyecto</RouterLink><button :disabled="busy" @click="download(project)" :aria-label="'Descargar PDF de ' + project.name">Descargar PDF</button><button :disabled="busy" @click="showVersions(project)" :aria-label="'Ver versiones de ' + project.name">Ver versiones</button></div>
        </article>
      </div>
      <button v-if="hasMore" :disabled="loading" @click="more">Cargar más proyectos</button><button v-if="error && !items.length" :disabled="loading" @click="more">Reintentar carga</button>
      <section v-if="selected" class="catalog-panel" aria-labelledby="versions-title"><h2 id="versions-title">Versiones de {{ selected.name }}</h2><p class="muted">Cada versión conserva el detalle y los datos profesionales de ese momento.</p><p v-if="busy" role="status">Procesando…</p>
        <div class="catalog-scroll"><table class="catalog-table"><thead><tr><th>Versión</th><th>Guardado</th><th>Cliente</th><th>Total mano de obra</th><th>PDF</th></tr></thead><tbody><tr v-for="version in versions" :key="version.revision"><td>{{ version.revision }}</td><td>{{ date(version.createdAt) }}</td><td>{{ version.budget.cliente }}</td><td class="money">{{ currency(version.budget.total) }}</td><td><button :disabled="busy" @click="download(selected, version)" :aria-label="'Descargar versión ' + version.revision">Descargar</button></td></tr></tbody></table></div>
        <div class="catalog-actions"><button v-if="moreVersions" :disabled="busy" @click="showVersions(selected, true)">Cargar versiones anteriores</button><button :disabled="busy" @click="selected = null">Cerrar versiones</button></div>
      </section>
    </div>
  </div>
</template>
<style src="../assets/catalog.css"></style>
<style scoped>
.project-heading{display:flex;justify-content:space-between;align-items:center;gap:24px}.eyebrow,.project-version{font-size:11px;letter-spacing:1.5px;color:#a8d4ff}.project-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));gap:20px;margin:24px 0}.project-card{margin:0;min-width:0;display:flex;flex-direction:column}.project-card h2{margin-top:18px;overflow-wrap:anywhere}.project-card .catalog-actions{margin-top:auto}.project-card p{overflow-wrap:anywhere}.project-link{display:inline-block;text-decoration:none;padding:10px 16px;border:1px solid #6eb9f4;border-radius:6px;background:#2475b9;color:#fff;white-space:nowrap}.project-total{font-size:25px;font-weight:700}.project-link:focus-visible{outline:3px solid #70bcff;outline-offset:3px}@media(max-width:650px){.project-heading{align-items:flex-start;flex-direction:column;gap:12px}}
</style>
