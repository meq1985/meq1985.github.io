<script setup>
import { computed, ref, watch } from 'vue';
import NumberField from './NumberField.vue';
import SinglePhaseCheck from './SinglePhaseCheck.vue';
import { emptyMaterialNetwork, materialAnchors, materialRouteLength, materialsFromSketch, materialsCsv, WIRE_ROLES } from '../services/materialNetwork';
const props = defineProps({ sketch: Object, levelId: String, disabled: Boolean, selectedRouteId: String, view: String });
const emit = defineEmits(['edit', 'select', 'trace', 'close']);
const network = computed(() => props.sketch.materials ?? emptyMaterialNetwork());
const anchors = computed(() => materialAnchors(props.sketch).filter(a => a.levelId === props.levelId));
const circuitId = ref('');
const route = computed(() => network.value.routes.find(r => r.id === props.selectedRouteId && anchors.value.some(a => a.id === r.fromId)));
const result = computed(() => materialsFromSketch(props.sketch));
const role = ref('phase'), section = ref(null), count = ref(1);
const extraText = ref(''), extraQuantity = ref(1), extraUnit = ref('ud.');
const error = ref('');

watch(() => network.value.circuits, () => { if (!network.value.circuits.some(c => c.id === circuitId.value)) circuitId.value = ''; });
const id = () => crypto.randomUUID();
function edit(action) {
  if (props.disabled) return;
  emit('edit', sketch => { sketch.schema = 2; sketch.materials ??= emptyMaterialNetwork(); action(sketch.materials, sketch); });
}
function addCircuit() { edit(n => n.circuits.push({ id: id(), name: `Circuito ${n.circuits.length + 1}`, type: 'IUG' })); }
function importFeeders() {
  edit((n, sketch) => { for (const f of sketch.feeders ?? []) {
    if (n.routes.some(r => [r.fromId, r.toId].sort().join(':') === [f.fromId, f.toId].sort().join(':'))) continue;
    n.routes.push({ id: id(), fromId: f.fromId, toId: f.toId, feederId: f.id, bends: [], verticalMeters: 0, conduit: '', assignments: [] });
  } });
}
function wire() {
  if (!circuitId.value || !Number.isFinite(section.value) || section.value <= 0) { error.value = 'Elegí circuito y sección del conductor.'; return; }
  const routeId = route.value?.id; if (!routeId) return;
  edit(n => {
    const r = n.routes.find(r => r.id === routeId); let a = r.assignments.find(a => a.circuitId === circuitId.value);
    if (!a) { a = { circuitId: circuitId.value, wires: [] }; r.assignments.push(a); }
    const existing = a.wires.find(w => w.role === role.value);
    if (existing) Object.assign(existing, { count: count.value, section: section.value });
    else a.wires.push({ role: role.value, count: count.value, section: section.value });
  }); error.value = '';
}
function exportCsv() {
  if (props.disabled) return;
  const url = URL.createObjectURL(new Blob([materialsCsv(result.value)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'materiales-croquis-parcial.csv';
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const name = key => materialAnchors(props.sketch).find(a => a.id === key)?.name ?? '';
const circuitName = key => network.value.circuits.find(c => c.id === key)?.name ?? '';
</script>
<template>
  <section v-if="view && (view !== 'route' || route)" class="material-controls" aria-label="Propiedades de materiales"><div class="material-heading"><h3>{{ view === 'route' ? 'Conexión seleccionada' : view === 'list' ? 'Lista de materiales' : 'Opciones de materiales' }}</h3><button type="button" @click="emit('close')">Cerrar panel</button></div>
    <p v-if="error" class="catalog-notice error" role="alert">{{ error }}</p>
    <fieldset :disabled="disabled"><details v-if="view !== 'list'"><summary>Circuitos y cajas de paso</summary>
      <div class="catalog-actions"><button type="button" :disabled="network.circuits.length >= 50" @click="addCircuit">Agregar circuito</button><button type="button" :disabled="network.junctions.length >= 50" @click="edit(n => n.junctions.push({ id: id(), name: 'Caja de paso', levelId, x: 1, y: 1 }))">Agregar caja de paso</button></div>
      <div v-for="c in network.circuits" :key="c.id" class="material-row"><label>Nombre del circuito<input :value="c.name" maxlength="60" @change="edit(n => n.circuits.find(x => x.id === c.id).name = $event.target.value)" /></label><label>Uso<select :value="c.type" @change="edit(n => n.circuits.find(x => x.id === c.id).type = $event.target.value)"><option v-for="type in ['IUG','TUG','TUE','otro']" :key="type">{{ type }}</option></select></label><button type="button" @click="edit(n => { n.circuits = n.circuits.filter(x => x.id !== c.id); for (const r of n.routes) r.assignments = r.assignments.filter(a => a.circuitId !== c.id); })">Quitar circuito y sus conductores</button></div>
      <div v-for="j in network.junctions.filter(j => j.levelId === levelId)" :key="j.id" class="material-row"><label>Nombre de caja<input :value="j.name" maxlength="60" @change="edit(n => n.junctions.find(x => x.id === j.id).name = $event.target.value)" /></label><label v-for="axis in ['x','y']" :key="axis">{{ `Caja ${axis.toUpperCase()} (m)` }}<NumberField :model-value="j[axis]" :min="0" :max="200" :step="0.1" @update:model-value="v => edit(n => n.junctions.find(x => x.id === j.id)[axis] = v)" /></label><button type="button" @click="edit(n => { n.junctions = n.junctions.filter(x => x.id !== j.id); n.routes = n.routes.filter(r => r.fromId !== j.id && r.toId !== j.id); })">Quitar caja y recorridos</button></div>
    </details>
      <div v-if="view === 'route' && route" class="selected-material-route"><p>{{ name(route.fromId) }} → {{ name(route.toId) }} · {{ materialRouteLength(sketch, route).toFixed(2) }} m</p><p v-if="route.kind === 'control'">Llave vinculada a luminaria. Definí los conductores para incluirlos en la lista.</p><div class="catalog-fields"><label>Canalización: tipo y diámetro<input :value="route.conduit" maxlength="120" placeholder="Elegí la especificación del material" @change="edit(n => n.routes.find(r => r.id === route.id).conduit = $event.target.value)" /></label><label v-if="!route.feederId">Metros verticales del tramo<NumberField :model-value="route.verticalMeters" :min="0" :max="200" :step="0.1" @update:model-value="v => edit(n => n.routes.find(r => r.id === route.id).verticalMeters = v)" /></label></div>
      <p v-if="route.feederId">La geometría y los metros verticales siguen el recorrido TP → TG original.</p>
      <div class="catalog-actions"><template v-if="!route.feederId"><button type="button" @click="emit('trace', route.id)">Dibujar quiebres de materiales</button><button type="button" :disabled="!route.bends.length" @click="edit(n => n.routes.find(r => r.id === route.id).bends.pop())">Quitar último quiebre de materiales</button></template><button type="button" @click="edit(n => n.routes = n.routes.filter(r => r.id !== route.id))">Quitar tramo de materiales</button></div>
      <details><summary>Conductores de esta conexión</summary><p>Ingresá conductores individuales y secciones elegidas por vos. No se agregan automáticamente neutros, PE ni retornos.</p>
      <div class="catalog-fields"><label>Circuito del conductor<select v-model="circuitId"><option value="">Elegir circuito</option><option v-for="c in network.circuits" :key="c.id" :value="c.id">{{ c.name }}</option></select></label><label>Función<select v-model="role"><option v-for="(label, key) in WIRE_ROLES" :key="key" :value="key">{{ label }}</option></select></label><label>Sección elegida (mm²)<NumberField v-model="section" nullable :min="0.1" :max="240" :step="0.1" /></label><label>Cantidad de conductores<NumberField v-model="count" :min="1" :max="20" :step="1" integer /></label></div>
      <button type="button" @click="wire">Agregar o actualizar conductor del tramo</button>
      <ul><li v-for="a in route.assignments" :key="a.circuitId"><strong>{{ circuitName(a.circuitId) }}</strong><span v-for="w in a.wires" :key="w.role"> · {{ w.count }} {{ WIRE_ROLES[w.role] }} de {{ w.section }} mm² <button type="button" :aria-label="`Quitar ${WIRE_ROLES[w.role]} de ${circuitName(a.circuitId)}`" @click="edit(n => { const r = n.routes.find(r => r.id === route.id); r.assignments.find(x => x.circuitId === a.circuitId).wires = a.wires.filter(x => x.role !== w.role); r.assignments = r.assignments.filter(x => x.wires.length); })">Quitar</button></span></li></ul>
      </details></div>
    <details v-if="view === 'settings'"><summary>Materiales adicionales y reserva</summary><div class="catalog-fields"><label>Material adicional<input v-model="extraText" maxlength="120" /></label><label>Unidad<select v-model="extraUnit"><option>ud.</option><option>m</option></select></label><label>Cantidad adicional<NumberField v-model="extraQuantity" :min="extraUnit === 'ud.' ? 1 : 0.1" :max="100000" :integer="extraUnit === 'ud.'" :step="extraUnit === 'ud.' ? 1 : 0.1" /></label><label>Reserva solo para materiales medidos (%)<NumberField :model-value="network.reservePercent" :min="0" :max="50" :step="1" @update:model-value="v => edit(n => n.reservePercent = v)" /></label></div><button type="button" :disabled="!extraText.trim() || network.extras.length >= 100" @click="edit(n => n.extras.push({ id: id(), description: extraText, unit: extraUnit, quantity: extraQuantity }))">Agregar material adicional</button><ul><li v-for="e in network.extras" :key="e.id">{{ e.description }} · {{ e.quantity }} {{ e.unit }} <button type="button" @click="edit(n => n.extras = n.extras.filter(x => x.id !== e.id))">Quitar adicional</button></li></ul></details>
    <div v-if="view === 'list'"><p>Lista parcial para revisar</p><ul><li v-for="warning in result.warnings" :key="warning">{{ warning }}</li></ul><div class="catalog-scroll"><table class="catalog-table"><thead><tr><th>Material</th><th>Unidad</th><th>Calculado</th><th>Con reserva</th><th>Referencias</th></tr></thead><tbody><tr v-for="(r, i) in result.rows" :key="i"><td>{{ r.description }}</td><td>{{ r.unit }}</td><td>{{ r.quantity }}</td><td>{{ r.purchaseQuantity }}</td><td>{{ r.sources.length }} origen(es)</td></tr></tbody></table></div><button type="button" :disabled="!result.rows.length" @click="exportCsv">Descargar lista parcial CSV</button></div>
    <template v-if="view === 'settings'"><button type="button" :disabled="!sketch.feeders?.length" @click="importFeeders">Incorporar recorridos TP → TG</button><SinglePhaseCheck :disabled="disabled" /></template>
    </fieldset>
  </section>
</template>
<style scoped>.material-controls{border:1px solid #475366;border-radius:12px;margin:16px 0;padding:16px;background:#142638}.material-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}.material-heading h3{margin:0}.material-controls summary{font-weight:700;cursor:pointer;padding:14px 0}.material-controls details{border-bottom:1px solid #475366;padding-bottom:12px}.material-row{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin:16px 0}.material-row label{flex:1;min-width:130px}.route-list{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.route-list button{max-width:100%;overflow-wrap:anywhere}.selected-material-route{border:1px solid #647789;border-radius:8px;padding:16px}.material-controls .catalog-fields{grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))}.material-controls td{overflow-wrap:anywhere}</style>
