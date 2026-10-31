<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import PromotionSettings from '../components/PromotionSettings.vue';
import CatalogHeader from '../components/CatalogHeader.vue';
import { PostStore } from '../stores/dbUsers';
import { CATALOG_NOTES, CATALOG_GROUPS, currency } from '../data/laborCatalog';
import { adjustPrices, strictPrices } from '../services/catalogPrices';
import { loadCatalog, loadSuggestedCatalog, saveCatalogPrices } from '../services/catalogPersistence';

const profileStore = PostStore();
const profileFields = [ ['nombre', 'Nombre'], ['apellido', 'Apellido'], ['cuit', 'CUIT'], ['empresa', 'Empresa'], ['matricula', 'Matrícula'], ['telefono', 'Teléfono'], ['direccion', 'Dirección'] ];
const profile = ref(Object.fromEntries(profileFields.map(([key]) => [key, ''])));
const entries = ref([]), draft = ref({}), baseline = ref({});
const ready = ref(false);
const loading = ref(true), busy = ref(false), message = ref(''), error = ref('');
const search = ref(''), category = ref(''), scope = ref(''), direction = ref('increase'), percentage = ref(20);
const preview = ref(null);
const groups = computed(() => [...CATALOG_GROUPS, ...(entries.value.some(item => item.category === 'anteriores') ? [{ id: 'anteriores', label: 'Mis ítems anteriores' }] : [])]);
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const visibleGroups = computed(() => groups.value.map(group => ({ ...group, items: entries.value.filter(item =>
  item.category === group.id && (!category.value || item.category === category.value) &&
  normalize(item.description + ' ' + item.unit).includes(normalize(search.value))) })).filter(group => group.items.length));
const changes = computed(() => Object.fromEntries(Object.entries(draft.value).filter(([id, value]) => value !== baseline.value[id])));
const dirty = computed(() => Object.keys(changes.value).length > 0);
const previewRows = computed(() => preview.value ? entries.value.filter(item => Object.hasOwn(preview.value.prices, item.id)) : []);
watch([scope, direction, percentage, draft], () => { preview.value = null; }, { deep: true });

async function reload() {
  entries.value = await loadCatalog();
  baseline.value = Object.fromEntries(entries.value.map(item => [item.id, item.price]));
  draft.value = { ...baseline.value };
  preview.value = null;
}
async function perform(action, success) {
  if (busy.value) return;
  busy.value = true; error.value = ''; message.value = '';
  try { await action(); message.value = success; }
  catch (cause) { error.value = cause.message; }
  finally { busy.value = false; }
}
function saveProfile() {
  return perform(() => profileStore.updateItem(...profileFields.map(([key]) => profile.value[key])), 'Tus datos fueron guardados.');
}
function saveManual() {
  const pending = { ...changes.value };
  return perform(async () => {
    await saveCatalogPrices(strictPrices(pending), baseline.value);
    await reload();
  }, 'Precios guardados. Ya están disponibles para presupuestar.');
}
function reviewAdjustment() {
  error.value = ''; message.value = '';
  try {
    if (dirty.value) throw new Error('Guardá o descartá primero los cambios individuales.');
    const selected = Object.fromEntries(entries.value.filter(item => !scope.value || item.category === scope.value).map(item => [item.id, baseline.value[item.id]]));
    if (!Object.keys(selected).length) throw new Error('No hay precios en esa categoría.');
    preview.value = { prices: adjustPrices(selected, percentage.value, direction.value),
      title: `${direction.value === 'increase' ? 'Aumentar' : 'Disminuir'} ${percentage.value} %`, type: 'percentage' };
  } catch (cause) { error.value = cause.message; }
}
function reviewDefaults() {
  if (dirty.value) { error.value = 'Guardá o descartá primero los cambios individuales.'; return; }
  return perform(async () => {
    preview.value = null;
    const suggested = await loadSuggestedCatalog();
    preview.value = { prices: suggested.prices, suggested,
      title: `Precios sugeridos · ${suggested.label}`, type: 'defaults' };
  }, 'Revisá los importes antes de cargarlos en tu cuenta.');
}
function applyPreview() {
  const reviewed = preview.value;
  if (!reviewed) return;
  return perform(async () => {
    if (reviewed.suggested) await saveCatalogPrices(reviewed.prices, baseline.value, reviewed.suggested);
    else await saveCatalogPrices(reviewed.prices, baseline.value);
    await reload();
  }, 'Actualización guardada en tu cuenta. Los presupuestos anteriores conservan sus valores.');
}
onMounted(async () => {
  try {
    await Promise.all([profileStore.obtenerDato(), reload()]);
    profile.value = Object.fromEntries(profileFields.map(([key]) => [key, profileStore[key + '1'] ?? '']));
    ready.value = true;
  } catch (cause) { error.value = 'No se pudo cargar la configuración: ' + cause.message; }
  finally { loading.value = false; }
});
</script>

<template>
  <div class="catalog-page">
    <CatalogHeader />
    <div class="catalog-main">
      <h1>Configuración</h1>
      <p class="muted">Tus datos y precios de mano de obra.</p>
      <p v-if="loading" role="status">Cargando configuración…</p>
      <p v-if="message" class="catalog-notice" role="status">{{ message }}</p>
      <p v-if="error" class="catalog-notice error" role="alert">{{ error }}</p>
      <section class="catalog-panel">
        <h2>Mis datos</h2>
        <form @submit.prevent="saveProfile">
          <fieldset :disabled="!ready || loading || busy">
            <div class="catalog-fields">
              <label v-for="[key, label] in profileFields" :key="key">{{ label }}{{ key === 'empresa' ? ' (opcional)' : '' }}
                <input v-model="profile[key]" type="text" :required="key !== 'empresa'" maxlength="160" :name="key" />
              </label>
            </div>
            <button class="primary" type="submit">Guardar mis datos</button>
          </fieldset>
        </form>
      </section>
      <section class="catalog-panel">
        <h2>Mis precios</h2>

        <p>Consultá los precios sugeridos actualizados y elegí si querés cargarlos en tu cuenta. Primero podrás comparar los valores; tus precios solo cambian cuando confirmás.</p>
        <details><summary>Alcance y notas de la tabla</summary><ul><li v-for="note in CATALOG_NOTES" :key="note">{{ note }}</li></ul></details>
        <fieldset :disabled="!ready || loading || busy || !entries.length">
          <div class="catalog-panel">
            <h3>Ajustar precios por porcentaje</h3>
            <p>Se calcula sobre tus precios guardados actuales, con redondeo a dos decimales. Primero revisá el resultado y luego aplicalo.</p>
            <div class="catalog-fields">
              <label>Aplicar a<select v-model="scope"><option value="">Todos mis precios</option><option v-for="group in groups" :key="group.id" :value="group.id">{{ group.label }}</option></select></label>
              <label>Operación<select v-model="direction"><option value="increase">Aumentar</option><option value="decrease">Disminuir</option></select></label>
              <label>Porcentaje (%)<input v-model="percentage" type="number" min="0.01" step="0.01" :max="direction === 'decrease' ? 100 : undefined" /></label>
            </div>
            <div class="catalog-actions">
              <button @click="reviewAdjustment" :disabled="dirty">Revisar ajuste</button>
              <button @click="reviewDefaults" :disabled="dirty">Consultar precios sugeridos actualizados</button>
            </div>
            <p v-if="dirty" class="muted">Hay cambios individuales sin guardar. Guardalos o descartalos para ajustar por porcentaje.</p>
            <div v-if="preview" class="catalog-preview">
              <h3>{{ preview.title }}</h3>
              <p>{{ previewRows.length }} precios. {{ preview.type === 'defaults' ? 'Reemplaza los precios del catálogo de tu cuenta por los sugeridos; conserva tus ítems anteriores y los presupuestos guardados.' : 'No modifica presupuestos ya guardados.' }}</p>
              <details><summary>Ver todos los importes antes de guardar</summary>
                <div class="catalog-scroll"><table class="catalog-table"><thead><tr><th>Ítem</th><th>Actual</th><th>Nuevo</th></tr></thead><tbody>
                  <tr v-for="item in previewRows" :key="item.id"><td>{{ item.description }} / {{ item.unit }}</td><td class="money">{{ currency(baseline[item.id]) }}</td><td class="money">{{ currency(preview.prices[item.id]) }}</td></tr>
                </tbody></table></div>
              </details>
              <div class="catalog-actions"><button class="primary" @click="applyPreview">Aplicar y guardar {{ previewRows.length }} precios</button><button @click="preview = null">Cancelar</button></div>
            </div>
          </div>
          <PromotionSettings />
          <div class="catalog-fields">
            <label>Buscar ítem<input v-model="search" type="search" placeholder="Ej.: toma doble, bandeja, medidor…" /></label>
            <label>Categoría<select v-model="category"><option value="">Todas las categorías</option><option v-for="group in groups" :key="group.id" :value="group.id">{{ group.label }}</option></select></label>
          </div>
          <form @submit.prevent="saveManual">
            <section v-for="group in visibleGroups" :key="group.id">
              <h3>{{ group.label }}</h3>
              <p v-if="group.id === 'anteriores'" class="muted">Importes conservados con su descripción original. Revisá la unidad antes de usarlos; no se reemplazaron por equivalencias supuestas.</p>
              <div class="catalog-scroll"><table class="catalog-table"><thead><tr><th>Trabajo</th><th class="unit">Unidad</th><th class="money">Tu precio (AR$)</th></tr></thead><tbody>
                <tr v-for="item in group.items" :key="item.id"><td><label :for="'price-' + item.id">{{ item.description }}</label><small v-if="item.note">Nota de la tabla: {{ item.note }}</small></td><td>{{ item.unit }}</td><td><input :id="'price-' + item.id" v-model.number="draft[item.id]" type="number" min="0" step="0.01" required :aria-label="item.description + ' / ' + item.unit" /></td></tr>
              </tbody></table></div>
            </section>
            <p v-if="!visibleGroups.length">No hay ítems que coincidan con la búsqueda.</p>
            <div class="catalog-actions"><button class="primary" type="submit" :disabled="!dirty">Guardar cambios individuales</button><button type="button" :disabled="!dirty" @click="draft = { ...baseline }">Descartar cambios</button><span>{{ Object.keys(changes).length }} precios modificados</span></div>
          </form>
        </fieldset>
        <p v-if="busy" role="status">Procesando…</p>
      </section>
    </div>
  </div>
</template>
<style src="../assets/catalog.css"></style>
