<script setup>
import { computed, inject, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { routerKey, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { loadBillingAccess } from '../services/billing';
import { projectAccess } from '../services/billingPolicy';
import { newProjectId, loadProject, saveProject } from '../services/projects';
import { projectProfile } from '../services/projectValidation';
import CatalogHeader from '../components/CatalogHeader.vue';
import SketchEditor from '../components/SketchEditor.vue';
import { PostStore } from '../stores/dbUsers';
import { requireUser, assertCurrentUser } from '../firebase/session';
import { validateBudget } from '../services/budgetValidation';
import { buildBudgetPdf } from '../services/budgetPdf';
import { loadCatalog } from '../services/catalogPersistence';
import { CATALOG_NOTES, CATALOG_GROUPS, currency } from '../data/laborCatalog';

const props = defineProps({ projectId: String });
const router = inject(routerKey, null);
const profileStore = PostStore();
const name = ref(''), revision = ref(0), cloudId = ref(props.projectId || newProjectId()), selectedProfile = ref(null);
const access = ref(null), subscriptionBlocked = ref(false);
const ready = ref(false), cloudSaved = ref(false), ownerUid = ref(''), pendingSave = ref(null);
const savedForm = ref(null), savedBudget = ref(null), requiresProfileReview = ref(false);
const sketch = ref(null);
const formSignature = computed(() => JSON.stringify([name.value, cliente.value, tipoInmueble.value, tabla.value, selectedProfile.value, sketch.value]));
const dirty = computed(() => savedForm.value !== null && formSignature.value !== savedForm.value);

if (router) {
  const leave = () => !dirty.value || window.confirm('Hay cambios sin guardar. ¿Salir del proyecto?');
  onBeforeRouteLeave(leave);
  onBeforeRouteUpdate((to, from) => to.params.projectId === from.params.projectId || leave());
}
const warnBeforeClose = event => { if (dirty.value) { event.preventDefault(); event.returnValue = ''; } };
onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeClose));
const tipoInmueble = ref('');
const propertyTypes = ['Vivienda unifamiliar', 'Departamento', 'Local', 'Depósito', 'Oficina', 'Edificio', 'Taller', 'Galpón'];
const cliente = ref(''), tabla = ref([]), entries = ref([]), search = ref(''), selected = ref('');
const loading = ref(true), saving = ref(false), error = ref(''), message = ref('');
watch(formSignature, () => { if (pendingSave.value && pendingSave.value.signature !== formSignature.value) pendingSave.value = null; });
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const groups = computed(() => [...CATALOG_GROUPS, { id: 'anteriores', label: 'Mis ítems anteriores' }].map(group => ({ ...group,
  items: entries.value.filter(item => item.category === group.id && normalize(item.description + ' ' + item.unit).includes(normalize(search.value))) })).filter(group => group.items.length));
const selectedItem = computed(() => entries.value.find(item => item.id === selected.value));
const subtotal = row => { const value = Math.round(Number(row.cantidad) * Number(row.precioUnitario) * 100) / 100; return Number.isFinite(value) ? value : 0; };
const total = computed(() => Math.round(tabla.value.reduce((sum, row) => sum + subtotal(row), 0) * 100) / 100);
let counter = 0;
function addItem() {
  const item = selectedItem.value;
  if (!item) return;
  tabla.value.push({ key: ++counter, codigo: item.code, descripcion: item.description, unidad: item.unit,
    cantidad: ['proyecto_m2', 'plano_m2'].includes(item.id) ? 30 : 1, precioUnitario: item.price });
}
function addCustom() { tabla.value.push({ key: ++counter, codigo: `P-${counter}`, descripcion: '', unidad: 'ud.', cantidad: 1, precioUnitario: 0 }); }
async function outputBudget() {
  if (saving.value) return;
  saving.value = true; error.value = ''; message.value = '';
  try {
    const user = await requireUser();
    if (user.uid !== ownerUid.value) throw new Error('La sesión cambió. Recargá el proyecto.');
    if (requiresProfileReview.value) throw new Error('Revisá los datos profesionales y guardá una nueva versión en tu cuenta antes de generar el PDF.');
    const currentAccess = await loadBillingAccess();
    if (!projectAccess(currentAccess, cloudId.value)) { subscriptionBlocked.value = true; throw new Error('Para trabajar en otro proyecto necesitás una suscripción.'); }
    if (currentAccess.enabled && (dirty.value || !cloudSaved.value)) {
      saving.value = false;
      const saved = await saveToAccount();
      saving.value = true;
      if (!saved) return;
    }
    const budget = !dirty.value && savedBudget.value ? savedBudget.value : { ...validateBudget(cliente.value, tabla.value, tipoInmueble.value), createdAt: new Date().toISOString() };
    const snapshot = { ...validateBudget(budget.cliente, budget.items, budget.tipoInmueble), createdAt: budget.createdAt };
    const document = await buildBudgetPdf(snapshot, selectedProfile.value ?? projectProfile(profileStore, user.email));
    assertCurrentUser(user);
    document.save('presupuesto.pdf'); message.value = 'PDF descargado.';
  } catch (cause) { error.value = cause.message; }
  finally { saving.value = false; }
}
async function saveToAccount() {
  if (saving.value || !ready.value) return;
  saving.value = true; error.value = ''; message.value = '';
  try {
    const user = await requireUser();
    if (user.uid !== ownerUid.value) throw new Error('La sesión cambió. Recargá el proyecto.');
    if (!pendingSave.value) pendingSave.value = {
      signature: formSignature.value,
      input: { id: cloudId.value, expectedRevision: revision.value, name: name.value || cliente.value,
        budget: { ...validateBudget(cliente.value, tabla.value, tipoInmueble.value), createdAt: new Date().toISOString() },
        profile: selectedProfile.value ?? projectProfile(profileStore, user.email), sketch: sketch.value },
    };
    const result = await saveProject(pendingSave.value.input);
    revision.value = result.revision; cloudSaved.value = true; requiresProfileReview.value = false; savedBudget.value = pendingSave.value.input.budget;
    savedForm.value = formSignature.value; pendingSave.value = null;
    message.value = `Proyecto guardado en tu cuenta. Versión ${result.revision}. Podés retomarlo desde Mis proyectos.`;
    subscriptionBlocked.value = false;
    return true;
  } catch (cause) { error.value = cause.message; subscriptionBlocked.value = cause.code === 'billing/subscription-required'; return false; }
  finally { saving.value = false; }
}
async function useCurrentProfile() {
  try {
  const user = await requireUser();
  if (user.uid !== ownerUid.value) { error.value = 'La sesión cambió. Recargá el proyecto.'; return; }
  await profileStore.obtenerDato();
  if ((await requireUser()).uid !== user.uid) throw new Error('La sesión cambió. Recargá el proyecto.');
  selectedProfile.value = projectProfile(profileStore, user.email);
  } catch (cause) { error.value = cause.message; }
}
let loadSequence = 0;
async function initialize() {
  const sequence = ++loadSequence;
  loading.value = true; ready.value = false; error.value = ''; message.value = ''; pendingSave.value = null;
  try {
    const [user, , catalog, project, billing] = await Promise.all([requireUser(), profileStore.obtenerDato(), loadCatalog(), props.projectId ? loadProject(props.projectId) : null, loadBillingAccess()]);
    if (sequence !== loadSequence) return;
    access.value = billing; subscriptionBlocked.value = !projectAccess(billing, props.projectId);
    entries.value = catalog; ownerUid.value = user.uid;
    cloudId.value = props.projectId || newProjectId(); revision.value = project?.revision ?? 0;
    name.value = project?.name ?? ''; cliente.value = project?.version.budget.cliente ?? '';
    tipoInmueble.value = project?.version.budget.tipoInmueble ?? '';
    sketch.value = project?.version.sketch ?? null;
    tabla.value = (project?.version.budget.items ?? []).map(item => ({ ...item, key: ++counter, unidad: item.unidad ?? 'ud.' }));
    selectedProfile.value = project?.version.profile ?? projectProfile(profileStore, user.email);
    requiresProfileReview.value = Boolean(project && !project.version.profile);
    cloudSaved.value = Boolean(project); savedBudget.value = project?.version.budget ?? null;
    if (project && !project.version.profile) message.value = 'Este proyecto no incluye una copia de tus datos profesionales. Se usarán los datos actuales: revisalos y guardá una nueva versión antes de compartir el PDF.';
    savedForm.value = formSignature.value; ready.value = true;
  } catch (cause) { if (sequence === loadSequence) error.value = 'No se pudo cargar el proyecto: ' + cause.message; }
  finally { if (sequence === loadSequence) loading.value = false; }
}
onMounted(() => { window.addEventListener('beforeunload', warnBeforeClose); initialize(); });
watch(() => props.projectId, initialize);
</script>
<template>
  <div class="catalog-page">
    <CatalogHeader />
    <div class="catalog-main">
      <h1>{{ revision ? 'Editar proyecto' : 'Nuevo proyecto' }}</h1><p v-if="revision" class="muted">Versión guardada: {{ revision }}. Guardar cambios crea una nueva versión.</p>
      <p v-if="access?.admin" class="catalog-notice">Cuenta administradora: acceso completo sin suscripción.</p>
      <p v-else-if="access?.enabled" class="catalog-notice">Tu cuenta incluye un proyecto gratuito, sin vencimiento. <RouterLink to="/planes">Ver planes</RouterLink></p>
      <p v-if="subscriptionBlocked" class="catalog-notice" role="status">Para trabajar en otro proyecto necesitás una suscripción. <RouterLink to="/planes">Ver suscripción →</RouterLink><span v-if="access?.freeProjectId"> · <RouterLink :to="'/proyectos/' + access.freeProjectId + '/editar'">Abrir mi proyecto gratuito</RouterLink></span></p>
      <p v-if="error" class="catalog-notice error" role="alert">{{ error }}</p>
      <p v-if="message" class="catalog-notice" role="status">{{ message }}</p>
      <fieldset :disabled="subscriptionBlocked || loading || saving || !ready">
      <section class="catalog-panel">
        <div class="catalog-fields">
          <label for="project-name">Nombre del proyecto (opcional)<input id="project-name" v-model="name" maxlength="120" placeholder="Ej.: Reforma de cocina" /></label><label for="budget-client">Cliente<input id="budget-client" v-model="cliente" maxlength="120" placeholder="Nombre del cliente" /></label>
          <label for="budget-property-type">Tipo de inmueble (opcional)<input id="budget-property-type" v-model="tipoInmueble" list="property-types" maxlength="80" placeholder="Elegí una opción o escribí otra" /><datalist id="property-types"><option v-for="type in propertyTypes" :key="type" :value="type" /></datalist></label>
        </div>
        <p v-if="loading" role="status">Cargando tus precios…</p>
        <fieldset :disabled="subscriptionBlocked || loading || saving">
          <h2 style="margin-top: 24px">Agregar trabajos</h2>
          <div class="catalog-fields">
            <label>Buscar ítem<input v-model="search" type="search" placeholder="Ej.: boca, tablero, bandeja…" /></label>
            <label>Seleccionar ítem<select v-model="selected"><option disabled value="">Elegí un trabajo</option><optgroup v-for="group in groups" :key="group.id" :label="group.label"><option v-for="item in group.items" :key="item.id" :value="item.id">{{ item.description }} / {{ item.unit }} — {{ currency(item.price) }}</option></optgroup></select></label>
          </div>
          <p v-if="selectedItem?.note" class="catalog-notice">Nota de la tabla: {{ selectedItem.note }}</p>
          <div class="catalog-actions"><button class="primary" :disabled="!selectedItem" @click="addItem">Agregar ítem</button><button @click="addCustom">Agregar ítem personalizado</button></div>
        </fieldset>
        <details style="margin-top: 20px"><summary>Alcance, mínimos y adicionales</summary><ul><li v-for="note in CATALOG_NOTES" :key="note">{{ note }}</li></ul></details>
      </section>
      <SketchEditor :key="cloudId" v-model="sketch" :disabled="subscriptionBlocked || loading || saving || !ready" />
      <section class="catalog-panel">
        <h2>Detalle del presupuesto</h2><p class="muted">Los datos del profesional se guardan con cada versión. Las versiones anteriores conservan sus datos y precios.</p><details><summary>Ver datos profesionales que figurarán en el PDF</summary><p>{{ selectedProfile?.nombre1 }} {{ selectedProfile?.apellido1 }}<br v-if="selectedProfile?.empresa1" /><span v-if="selectedProfile?.empresa1">{{ selectedProfile.empresa1 }}</span><br />CUIT: {{ selectedProfile?.cuit1 }} · Matrícula: {{ selectedProfile?.matricula1 }}<br />Teléfono: {{ selectedProfile?.telefono1 }} · Correo: {{ selectedProfile?.correo }}</p></details><button type="button" @click="useCurrentProfile">Usar mis datos profesionales actuales</button>
        <p v-if="!tabla.length" class="muted">Agregá trabajos del catálogo o creá un ítem personalizado.</p>
        <div v-else class="catalog-scroll"><table class="catalog-table catalog-budget"><thead><tr><th>Trabajo</th><th class="unit">Unidad</th><th class="quantity">Cantidad</th><th class="money">Precio unitario (AR$)</th><th class="money">Subtotal</th><th></th></tr></thead><tbody>
          <tr v-for="(row, index) in tabla" :key="row.key">
            <td><textarea v-model="row.descripcion" :aria-label="'Descripción del ítem ' + (index + 1)" /><small>{{ row.codigo }}</small></td>
            <td><input v-model="row.unidad" :aria-label="'Unidad del ítem ' + (index + 1)" maxlength="30" /></td>
            <td><input v-model.number="row.cantidad" type="number" min="0.01" step="0.01" :aria-label="'Cantidad del ítem ' + (index + 1)" /></td>
            <td><input v-model.number="row.precioUnitario" type="number" min="0" step="0.01" :aria-label="'Precio del ítem ' + (index + 1)" /></td>
            <td>{{ currency(subtotal(row)) }}</td><td><button @click="tabla.splice(index, 1)" :aria-label="'Eliminar ítem ' + (index + 1)">Quitar</button></td>
          </tr>
        </tbody></table></div>
        <div class="catalog-total">Total: {{ currency(total) }}</div>
        <div class="catalog-actions"><button class="primary" :disabled="saving || loading || !tabla.length" @click="saveToAccount">Guardar proyecto en mi cuenta</button><button :disabled="saving || loading || !tabla.length" @click="outputBudget()">Descargar PDF</button></div>
        <p class="muted">Guardar en mi cuenta conserva el proyecto y sus versiones para acceder desde otros dispositivos.</p>
      </section>
      </fieldset>
      <p v-if="dirty" role="status">Tenés cambios sin guardar en tu cuenta.</p>
      <p v-if="cloudSaved"><RouterLink :to="'/proyectos/' + cloudId + '/editar'">Abrir este proyecto guardado</RouterLink> · <RouterLink to="/proyectos">Ver Mis proyectos</RouterLink></p>
    </div>
  </div>
</template>
<style src="../assets/catalog.css"></style>
