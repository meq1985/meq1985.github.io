<script setup>
import { computed, onMounted, ref } from 'vue';
import CatalogHeader from '../components/CatalogHeader.vue';
import { PostStore } from '../stores/dbUsers';
import { requireUser } from '../firebase/session';
import { validateBudget } from '../services/budgetValidation';
import { saveBudget } from '../services/localBudgets';
import { buildBudgetPdf } from '../services/budgetPdf';
import { loadCatalog } from '../services/catalogPersistence';
import { CATALOG_SOURCE, CATALOG_NOTES, CATALOG_GROUPS, currency } from '../data/laborCatalog';

const profileStore = PostStore();
const tipoInmueble = ref('');
const propertyTypes = ['Vivienda unifamiliar', 'Departamento', 'Local', 'Depósito', 'Oficina', 'Edificio', 'Taller', 'Galpón'];
const cliente = ref(''), tabla = ref([]), entries = ref([]), search = ref(''), selected = ref('');
const loading = ref(true), saving = ref(false), error = ref(''), message = ref('');
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
async function outputBudget(save) {
  if (saving.value) return;
  saving.value = true; error.value = ''; message.value = '';
  try {
    const user = await requireUser();
    const budget = { ...validateBudget(cliente.value, tabla.value, tipoInmueble.value), createdAt: new Date().toISOString() };
    const document = await buildBudgetPdf(budget, { ...profileStore, correo: user.email });
    if (save) {
      await saveBudget(user.uid, budget, document.output('blob'));
      message.value = 'Presupuesto guardado en este navegador. Descargá una copia para conservarlo.';
    } else { document.save('presupuesto.pdf'); message.value = 'PDF descargado.'; }
  } catch (cause) { error.value = cause.message; }
  finally { saving.value = false; }
}
onMounted(async () => {
  try { const [, catalog] = await Promise.all([profileStore.obtenerDato(), loadCatalog()]); entries.value = catalog; }
  catch (cause) { error.value = 'No se pudo cargar la configuración: ' + cause.message; }
  finally { loading.value = false; }
});
</script>
<template>
  <div class="catalog-page">
    <CatalogHeader />
    <div class="catalog-main">
      <h1>Nuevo presupuesto</h1>
      <p class="muted">{{ CATALOG_SOURCE }}. Se usan los precios guardados en tu cuenta.</p>
      <p v-if="error" class="catalog-notice error" role="alert">{{ error }}</p>
      <p v-if="message" class="catalog-notice" role="status">{{ message }}</p>
      <section class="catalog-panel">
        <div class="catalog-fields">
          <label for="budget-client">Cliente<input id="budget-client" v-model="cliente" maxlength="120" placeholder="Nombre del cliente" /></label>
          <label for="budget-property-type">Tipo de inmueble (opcional)<input id="budget-property-type" v-model="tipoInmueble" list="property-types" maxlength="80" placeholder="Elegí una opción o escribí otra" /><datalist id="property-types"><option v-for="type in propertyTypes" :key="type" :value="type" /></datalist></label>
        </div>
        <p v-if="loading" role="status">Cargando tus precios…</p>
        <fieldset :disabled="loading || saving">
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
      <section class="catalog-panel">
        <h2>Detalle del presupuesto</h2>
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
        <div class="catalog-actions"><button class="primary" :disabled="saving || loading || !tabla.length" @click="outputBudget(true)">Guardar presupuesto</button><button :disabled="saving || loading || !tabla.length" @click="outputBudget(false)">Descargar PDF</button></div>
        <p class="muted">Los presupuestos se guardan en este navegador. Los cambios futuros de precios no modifican este detalle.</p>
      </section>
    </div>
  </div>
</template>
<style src="../assets/catalog.css"></style>
