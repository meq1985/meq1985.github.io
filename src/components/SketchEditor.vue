<script setup>
import { computed, ref, watch, useId, inject } from 'vue';
import { emptySketch, validateSketch, encodeSketch, sketchSummary, overlapsRoom, POINT_TYPES, SKETCH_LIMITS } from '../services/sketch';
import { EQUIPMENT_TYPES, feederPoints, feederLength } from '../services/sketchInfrastructure';
import NumberField from './NumberField.vue';
import MaterialControls from './MaterialControls.vue';
import { emptyMaterialNetwork, materialAnchors, materialRoutePoints, materialRouteLength, pruneMaterialNetwork } from '../services/materialNetwork';
import { calculatedRouteLength } from '../services/automaticDesign';
import { emptyQuoteSettings, sketchHeights } from '../services/sketchQuoteSettings';
const showHelp = inject('budgetHelp', () => {});
const props = defineProps({ modelValue: { type: Object, default: null }, disabled: Boolean, entries: { type: Array, default: () => [] } });
const emit = defineEmits(['update:modelValue']);
const sketch = computed(() => props.modelValue ?? emptySketch());
const heights = computed(() => sketchHeights(sketch.value));
function editHeight(key, value) {
  change(next => { next.quote = { ...emptyQuoteSettings(), ...next.quote, heights: { ...heights.value, [key]: value } }; }, false);
}
const levelId = ref(sketch.value.levels[0].id), roomId = ref(sketch.value.rooms.find(room => room.levelId === levelId.value)?.id ?? ''), tool = ref('select'), error = ref('');
const undo = ref([]), redo = ref([]);
const gridId = useId();
const canvas = ref(null);
const equipmentId = ref(''), routeId = ref(''), infraTool = ref(''), materialRouteId = ref('');
const connectionMode = ref(''), connectionStart = ref(''), draftBends = ref([]), materialView = ref('');
const startAnchor = computed(() => materialAnchors(sketch.value).find(a => a.id === connectionStart.value));
const draftPoints = computed(() => startAnchor.value ? [startAnchor.value, ...draftBends.value].map(p => `${p.x * 30},${p.y * 30}`).join(' ') : '');
function cancelConnection() { connectionMode.value = ''; connectionStart.value = ''; draftBends.value = []; }
function beginConnection(mode) { if (props.disabled) return; cancelConnection(); connectionMode.value = mode; tool.value = 'select'; infraTool.value = ''; materialView.value = ''; }
function selectAnchor(id) {
  if (props.disabled) return;
  if (!connectionMode.value) { equipmentId.value = id; if (sketch.value.equipment?.some(e => e.id === id)) materialView.value = 'list'; return; }
  if (!connectionStart.value) { connectionStart.value = id; return; }
  if (connectionStart.value === id) return;
  const anchors = materialAnchors(sketch.value), from = anchors.find(a => a.id === connectionStart.value), to = anchors.find(a => a.id === id);
  if (!from || !to || from.levelId !== to.levelId) return;
  const existing = sketch.value.materials?.routes.find(r => [r.fromId, r.toId].includes(from.id) && [r.fromId, r.toId].includes(to.id));
  const newId = existing?.id ?? freshId();
  if (existing || change(next => {
    next.schema = 2; next.materials ??= emptyMaterialNetwork();
    const principal = [from, to].find(a => ['principal', 'medidor_tp'].includes(a.type)), general = [from, to].find(a => a.type === 'general');
    let feederId = null, bends = clone(draftBends.value), fromId = from.id, toId = to.id;
    if (principal && general) {
      next.feeders ??= [];
      let feeder = next.feeders.find(f => f.fromId === principal.id && f.toId === general.id);
      if (!feeder) { feeder = { id: freshId(), fromId: principal.id, toId: general.id, bends: from.id === principal.id ? bends : bends.slice().reverse(), verticalMeters: 0, itemId: '' }; next.feeders.push(feeder); }
      feederId = feeder.id; fromId = feeder.fromId; toId = feeder.toId; bends = [];
    }
    next.materials.routes.push({ id: newId, fromId, toId, kind: [from.type, to.type].includes('llave') && [from.type, to.type].includes('luminaria') ? 'control' : 'physical', feederId, bends, verticalMeters: 0, conduit: '', assignments: [] });
  })) { cancelConnection(); materialRouteId.value = newId; materialView.value = 'route'; }
}
function selectMaterialRoute(id) { if (props.disabled) return; cancelConnection(); materialRouteId.value = id; materialView.value = 'route'; }
const materialRoutes = computed(() => (sketch.value.materials?.routes ?? []).filter(r => materialAnchors(sketch.value).some(a => a.id === r.fromId && a.levelId === levelId.value)));
const junctions = computed(() => (sketch.value.materials?.junctions ?? []).filter(j => j.levelId === levelId.value));
watch(levelId, () => { cancelConnection(); materialView.value = ''; materialRouteId.value = ''; if (infraTool.value === 'material-route') infraTool.value = ''; });
watch(() => props.disabled, disabled => { if (disabled) cancelConnection(); });
const equipment = computed(() => (sketch.value.equipment ?? []).filter(e => e.levelId === levelId.value));
const feeders = computed(() => (sketch.value.feeders ?? []).filter(f => equipment.value.some(e => e.id === f.fromId)));
const extents = computed(() => [...equipment.value, ...feeders.value.flatMap(f => f.bends), ...junctions.value, ...materialRoutes.value.flatMap(r => r.bends)]);
const rooms = computed(() => sketch.value.rooms.filter(room => room.levelId === levelId.value));
const room = computed(() => rooms.value.find(item => item.id === roomId.value));
const summary = computed(() => sketchSummary(sketch.value));
const width = computed(() => Math.max(12, ...rooms.value.map(item => item.x + item.width + 1), ...extents.value.map(e => e.x + 2)));
const depth = computed(() => Math.max(9, ...rooms.value.map(item => item.y + item.depth + 1), ...extents.value.map(e => e.y + 2)));
const overlap = computed(() => rooms.value.some(a => rooms.value.some(b => overlapsRoom(a, b))));
const clone = value => JSON.parse(JSON.stringify(value));
const freshId = () => crypto.randomUUID();
watch(() => props.modelValue, () => {
  if (!sketch.value.levels.some(level => level.id === levelId.value)) levelId.value = sketch.value.levels[0].id;
  if (!room.value) roomId.value = rooms.value[0]?.id ?? '';
  if (!equipment.value.some(e => e.id === equipmentId.value)) equipmentId.value = '';
  if (connectionStart.value && !startAnchor.value) cancelConnection();
  if (!materialRoutes.value.some(r => r.id === materialRouteId.value)) { materialRouteId.value = ''; if (infraTool.value === 'material-route') infraTool.value = ''; }
  if (!feeders.value.some(f => f.id === routeId.value)) { routeId.value = ''; if (infraTool.value === 'route') infraTool.value = ''; }
});
function change(edit, recordHistory = true) {
  if (props.disabled) return;
  try {
    const next = clone(sketch.value); edit(next); pruneMaterialNetwork(next);
    const valid = validateSketch(next);
    encodeSketch(valid);
    if (JSON.stringify(valid) === JSON.stringify(sketch.value)) { error.value = ''; return true; }
    if (recordHistory) { undo.value.push(clone(props.modelValue)); undo.value = undo.value.slice(-40); redo.value = []; }
    emit('update:modelValue', valid); error.value = ''; return true;
  } catch (cause) { error.value = cause.message; return false; }
}
function history(from, to) {
  if (props.disabled || !from.length) return;
  to.push(clone(props.modelValue));
  const quote = props.modelValue?.quote;
  const restored = from.pop() ?? (quote ? emptySketch() : null);
  // Geometry history must not undo heights or pricing choices edited in the next section.
  if (restored) { delete restored.quote; if (quote) restored.quote = clone(quote); }
  emit('update:modelValue', restored); error.value = '';
}
function addLevel() {
  const id = freshId();
  if (change(next => next.levels.push({ id, name: `Nivel ${next.levels.length}` }))) { levelId.value = id; roomId.value = ''; }
}
function addRoom() {
  const id = freshId();
  if (change(next => next.rooms.push({ id, levelId: levelId.value, name: `Ambiente ${next.rooms.length + 1}`,
    x: rooms.value.reduce((max, item) => Math.max(max, item.x + item.width), 0), y: 0, width: 4, depth: 3, points: [] }))) roomId.value = id;
}
function editRoom(key, value) {
  const accepted = change(next => { next.rooms.find(item => item.id === roomId.value)[key] = value; });
  if (!accepted) error.value = 'Revisá el valor ingresado. Se conserva el último valor válido.';
}
function editLevel(event) {
  if (!change(next => { next.levels.find(level => level.id === levelId.value).name = event.target.value; })) error.value = 'Ingresá un nombre para el nivel. Se conserva el último nombre válido.';
}
function addPoint(x = 0.5, y = 0.5, target = room.value) {
  if (!target || tool.value === 'select') return;
  change(next => next.rooms.find(item => item.id === target.id).points.push({ id: freshId(), type: tool.value, x, y }));
}
function place(event, target) {
  if (props.disabled) return;
  if (connectionMode.value) { placeInfrastructure(event); return; }
  if (infraTool.value) { placeInfrastructure(event); return; }
  roomId.value = target.id;
  if (tool.value === 'select') return;
  const bounds = event.currentTarget.ownerSVGElement.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const x = (event.clientX - bounds.left) / bounds.width * width.value;
  const y = (event.clientY - bounds.top) / bounds.height * depth.value;
  addPoint(Math.max(0, Math.min(1, (x - target.x) / target.width)), Math.max(0, Math.min(1, (y - target.y) / target.depth)), target);
}
function removeRoom() { change(next => { next.rooms = next.rooms.filter(item => item.id !== roomId.value); }); }
function removeLevel() {
  change(next => {
    next.rooms = next.rooms.filter(item => item.levelId !== levelId.value); next.levels = next.levels.filter(item => item.id !== levelId.value);
    if (next.equipment) { next.equipment = next.equipment.filter(e => e.levelId !== levelId.value); next.feeders = next.feeders.filter(f => next.equipment.some(e => e.id === f.fromId) && next.equipment.some(e => e.id === f.toId)); }
  });
}
function addInfrastructure(type, x, y) {
  const id = freshId();
  if (change(next => { next.equipment ??= []; next.feeders ??= []; next.equipment.push({ id, type, levelId: levelId.value, name: EQUIPMENT_TYPES[type], x, y, itemId: '' }); })) equipmentId.value = id;
  infraTool.value = '';
}
function placeInfrastructure(event) {
  if (props.disabled || (!infraTool.value && !connectionMode.value)) return;
  const svg = event.currentTarget.ownerSVGElement ?? event.currentTarget, bounds = svg.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const x = Math.round((event.clientX - bounds.left) / bounds.width * width.value * 10) / 10;
  const y = Math.round((event.clientY - bounds.top) / bounds.height * depth.value * 10) / 10;
  if (connectionMode.value) { if (connectionMode.value === 'trace' && startAnchor.value) draftBends.value.push({ x, y }); return; }
  if (infraTool.value === 'material-junction') { change(next => { next.schema = 2; next.materials ??= emptyMaterialNetwork(); next.materials.junctions.push({ id: freshId(), name: 'Caja de paso', levelId: levelId.value, x, y }); }); infraTool.value = ''; }
  else if (infraTool.value === 'material-route') change(next => {
    const route = next.materials.routes.find(r => r.id === materialRouteId.value);
    if (route.feederId) next.feeders.find(f => f.id === route.feederId).bends.push({ x, y }); else route.bends.push({ x, y });
  });
  else if (infraTool.value === 'route') change(next => next.feeders.find(f => f.id === routeId.value).bends.push({ x, y }));
  else addInfrastructure(infraTool.value, x, y);
}
const equipmentCode = type => ({ medidor_tp: 'M+TP', principal: 'TP', general: 'TG', seccional: 'TS', jabalina: 'PAT' })[type];
function beginInfrastructureTool(type) {
  if (props.disabled) return;
  cancelConnection();
  infraTool.value = type; canvas.value?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
}
</script>
<template>
  <section class="catalog-panel sketch-editor" aria-labelledby="sketch-title">
    <div class="sketch-heading"><div><p class="sketch-eyebrow">CROQUIS · VERSIÓN INICIAL</p><h2 id="sketch-title">Dibujá tu proyecto</h2></div><div class="sketch-history"><button type="button" @click="showHelp('ambientes')">Ayuda del croquis</button><button type="button" :disabled="disabled || !undo.length" @click="history(undo, redo)">Deshacer</button><button type="button" :disabled="disabled || !redo.length" @click="history(redo, undo)">Rehacer</button></div></div>

    <p v-if="error" role="alert" class="catalog-notice error">{{ error }}</p>
    <fieldset :disabled="disabled">
      <div class="sketch-layout">
        <div class="sketch-controls">
          <label>Nivel<select v-model="levelId" @change="roomId = rooms[0]?.id ?? ''"><option v-for="level in sketch.levels" :key="level.id" :value="level.id">{{ level.name }}</option></select></label>
          <label>Nombre del nivel<input :value="sketch.levels.find(level => level.id === levelId)?.name" maxlength="60" @input="editLevel" @blur="$event.target.value = sketch.levels.find(level => level.id === levelId).name" /></label>
          <div class="catalog-actions"><button type="button" :disabled="sketch.levels.length >= SKETCH_LIMITS.levels" @click="addLevel">+ Nivel</button><button type="button" :disabled="sketch.levels.length === 1" @click="removeLevel">Quitar nivel</button></div>
          <div class="sketch-heights"><h3>Alturas generales</h3><label v-for="(label,key) in { toma: 'Altura de tomacorrientes (m)', llave: 'Altura de llaves (m)', techo: 'Altura de techo (m)' }" :key="key">{{ label }}<NumberField :model-value="heights[key]" :min="0.1" :max="20" :step="0.1" @update:model-value="value => editHeight(key,value)" /></label></div>
          <h3>Ambientes</h3>
          <div class="sketch-room-list"><button v-for="item in rooms" :key="item.id" type="button" :aria-pressed="roomId === item.id" @click="roomId = item.id">{{ item.name }} <small>{{ Math.round(item.width * item.depth * 100) / 100 }} m²</small></button></div>
          <button type="button" :disabled="sketch.rooms.length >= SKETCH_LIMITS.rooms" @click="addRoom">+ Ambiente</button>
          <template v-if="room">
            <label>Nombre del ambiente<input :value="room.name" maxlength="60" @input="editRoom('name', $event.target.value)" @blur="$event.target.value = room.name" /></label>
            <div class="sketch-measures"><label v-for="field in [['width','Ancho (m)',1,50],['depth','Largo (m)',1,50],['x','Posición X (m)',0,100],['y','Posición Y (m)',0,100]]" :key="field[0]">{{ field[1] }}<NumberField :model-value="room[field[0]]" :min="field[2]" :max="field[3]" :step="0.1" @update:model-value="value => editRoom(field[0], value)" /></label></div>
            <button type="button" @click="removeRoom">Quitar ambiente</button>
          </template>
        </div>
        <div class="sketch-workspace">
          <div class="sketch-tools" role="group" aria-label="Herramientas del croquis"><button type="button" :aria-pressed="tool === 'select'" @click="tool = 'select'; infraTool = ''; cancelConnection()">Seleccionar</button><button v-for="(label, type) in POINT_TYPES" :key="type" type="button" :aria-pressed="tool === type" @click="tool = type; infraTool = ''; cancelConnection()">{{ label }}</button><button type="button" :aria-pressed="connectionMode === 'direct'" @click="beginConnection('direct')">Conectar</button><button type="button" :aria-pressed="connectionMode === 'trace'" @click="beginConnection('trace')">Trazar conexión</button><button type="button" @click="beginInfrastructureTool('material-junction')">Caja de paso</button><button type="button" @click="beginInfrastructureTool('general')">Tablero</button><button type="button" @click="beginInfrastructureTool('medidor_tp')">Medidor + TP</button><button type="button" @click="beginInfrastructureTool('jabalina')">Jabalina</button><button type="button" @click="materialView = materialView === 'list' ? '' : 'list'">Ver materiales</button><button type="button" @click="materialView = materialView === 'settings' ? '' : 'settings'">Calcular instalación</button></div>
          <p v-if="connectionMode" role="status" class="catalog-notice">{{ !connectionStart ? 'Tocá el elemento de origen.' : connectionMode === 'trace' ? 'Marcá los quiebres en el plano y tocá el elemento de destino.' : 'Tocá el elemento de destino.' }} <button type="button" @click="cancelConnection">Cancelar conexión</button></p>
          <p v-else-if="infraTool" class="catalog-notice" role="status">{{ ['route', 'material-route'].includes(infraTool) ? 'Tocá el plano para agregar quiebres al recorrido seleccionado.' : `Tocá el plano para ubicar: ${(infraTool === 'material-junction' ? 'Caja de paso' : EQUIPMENT_TYPES[infraTool])}.` }} <button type="button" @click="infraTool = ''">Terminar ubicación</button></p>
          <p v-else-if="tool !== 'select'" class="muted" role="status">{{ POINT_TYPES[tool] }}: tocá un ambiente.</p>
          <svg ref="canvas" class="sketch-canvas" :viewBox="`0 0 ${width * 30} ${depth * 30}`" :style="{ aspectRatio: `${width} / ${depth}` }" role="img" aria-label="Plano del nivel seleccionado. Editá también desde los controles de ambientes." @click="placeInfrastructure" @keydown.esc="cancelConnection" tabindex="0">
            <defs><pattern :id="gridId" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="#294158" stroke-width="0.6" /></pattern></defs>
            <rect width="100%" height="100%" :fill="`url(#${gridId})`" />
            <g v-for="item in rooms" :key="item.id" class="sketch-room" :class="{ selected: item.id === roomId }" @click.stop="place($event, item)">
              <rect :x="item.x * 30" :y="item.y * 30" :width="item.width * 30" :height="item.depth * 30" fill="#1a3044" stroke-width="2" />
              <text :x="item.x * 30 + 7" :y="item.y * 30 + 16" fill="#dcecff" font-size="11">{{ item.name }}</text>
              <text :x="item.x * 30 + 7" :y="item.y * 30 + 30" fill="#a9bfd3" font-size="9">{{ item.width }} × {{ item.depth }} m</text>
              <g v-for="point in item.points" :key="point.id" :transform="`translate(${(item.x + point.x * item.width) * 30}, ${(item.y + point.y * item.depth) * 30})`" class="sketch-symbol" ><circle r="14" fill="transparent" /><title>{{ POINT_TYPES[point.type] }} · {{ item.name }}</title><circle r="7" fill="#101e2c" stroke="#f8ce76" stroke-width="1.5" /><path v-if="point.type === 'luminaria'" d="M-4-4 4 4 M-4 4 4-4" stroke="#f8ce76" /><path v-else-if="point.type === 'toma'" d="M-2-3 V3 M2-3 V3" stroke="#f8ce76" /><path v-else d="M-3 3 3-3" stroke="#f8ce76" /></g>
            </g>
            <g class="material-route-lines"><g v-for="r in materialRoutes" :key="r.id" :data-material-route="r.id" role="button" tabindex="0" :aria-label="`Seleccionar conexión ${r.id}`" @click.stop="selectMaterialRoute(r.id)" @keydown.enter.stop.prevent="selectMaterialRoute(r.id)" @keydown.space.stop.prevent="selectMaterialRoute(r.id)"><polyline :points="materialRoutePoints(sketch, r).map(p => `${p.x * 30},${p.y * 30}`).join(' ')" fill="none" stroke="transparent" stroke-width="14" /><polyline :points="materialRoutePoints(sketch, r).map(p => `${p.x * 30},${p.y * 30}`).join(' ')" fill="none" :stroke="r.id === materialRouteId ? '#ffda8a' : '#cbacff'" stroke-width="2.5" /><text :x="materialRoutePoints(sketch, r)[0].x * 30 + 10" :y="materialRoutePoints(sketch, r)[0].y * 30 - 14" fill="#cbacff" font-size="9">{{ (sketch.materials?.calculation ? calculatedRouteLength(sketch, r)?.toFixed(2) ?? '?' : materialRouteLength(sketch, r).toFixed(2)) }} m</text></g><g v-for="j in junctions" :key="j.id" ><circle :cx="j.x * 30" :cy="j.y * 30" r="14" fill="transparent" /><rect :x="j.x * 30 - 5" :y="j.y * 30 - 5" width="10" height="10" fill="#cbacff" /><title>{{ j.name }}</title></g></g>
            <polyline v-if="draftPoints" :points="draftPoints" fill="none" stroke="#ffda8a" stroke-width="3" stroke-dasharray="4 3" pointer-events="none" /><circle v-if="startAnchor" :cx="startAnchor.x * 30" :cy="startAnchor.y * 30" r="11" fill="none" stroke="#ffda8a" pointer-events="none" />
            <g class="sketch-feeders"><g v-for="f in feeders" :key="f.id"><polyline :points="feederPoints(sketch, f).map(p => `${p.x * 30},${p.y * 30}`).join(' ')" fill="none" :stroke="f.id === routeId ? '#ffda8a' : '#76dbb5'" stroke-width="2" stroke-dasharray="5 3" /><text :x="feederPoints(sketch, f)[0].x * 30 + 14" :y="feederPoints(sketch, f)[0].y * 30 + 25" fill="#76dbb5" font-size="10">{{ feederLength(sketch, f) }} m</text></g></g>
            <g v-for="e in equipment" :key="e.id" class="sketch-equipment" :transform="`translate(${e.x * 30},${e.y * 30})`" ><title>{{ e.name }}</title><rect x="-13" y="-9" width="26" height="18" rx="3" fill="#142c40" :stroke="e.id === equipmentId ? '#fff' : '#79c9ff'" stroke-width="1.5"/><text text-anchor="middle" y="3" font-size="8" fill="#fff">{{ equipmentCode(e.type) }}</text></g>
            <g v-for="a in materialAnchors(sketch).filter(a => a.levelId === levelId)" :key="`hit-${a.id}`" class="anchor-hit" role="button" tabindex="0" :aria-label="a.name" :data-anchor="a.id" :aria-pressed="connectionStart === a.id" @click.stop="selectAnchor(a.id)" @keydown.enter.stop.prevent="selectAnchor(a.id)" @keydown.space.stop.prevent="selectAnchor(a.id)"><circle :cx="a.x * 30" :cy="a.y * 30" r="13" fill="transparent" /></g>
          </svg>
      <MaterialControls :entries="entries" :view="materialView" :sketch="sketch" :level-id="levelId" :disabled="disabled" :selected-route-id="materialRouteId" @close="materialView = ''" @edit="change" @select="materialRouteId = $event; infraTool = ''" @trace="materialRouteId = $event; beginInfrastructureTool('material-route')" />
          <p v-if="!rooms.length" class="catalog-notice">Agregá un ambiente.</p>
          <p v-if="overlap" class="catalog-notice">Hay ambientes superpuestos en este nivel. Revisá sus posiciones; la superficie suma cada ambiente.</p>
          <small>Cuadrícula: 1 × 1 m</small>
          <div v-if="room && tool !== 'select'" class="catalog-actions"><button type="button" @click="addPoint()">Agregar al centro de {{ room.name }}</button></div>
          <div v-if="room?.points.length" class="sketch-point-list"><h3>Puntos de {{ room.name }}</h3><ul><li v-for="(point, index) in room.points" :key="point.id">{{ POINT_TYPES[point.type] }} {{ index + 1 }}<button type="button" :aria-label="`Quitar ${POINT_TYPES[point.type]} ${index + 1}`" @click="change(next => { const target = next.rooms.find(item => item.id === room.id); target.points = target.points.filter(item => item.id !== point.id); })">Quitar</button></li></ul></div>
        </div>
      </div>


    </fieldset>
    <dl class="sketch-summary"><div><dt>Superficie total</dt><dd>{{ summary.area }} m²</dd></div><div v-for="(label, type) in POINT_TYPES" :key="type"><dt>{{ label }}s</dt><dd>{{ summary[type] }}</dd></div></dl>
  </section>
</template>
<style scoped>
.sketch-heading,.sketch-history,.sketch-tools{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.sketch-heading{justify-content:space-between}.sketch-eyebrow{color:#a8d4ff;font-size:11px;letter-spacing:2px}.sketch-layout{display:grid;grid-template-columns:250px minmax(0,1fr);gap:24px}.sketch-controls{display:flex;flex-direction:column;gap:14px}.sketch-controls .catalog-actions{margin:0}.sketch-controls h3{margin:8px 0 0}.sketch-heights{display:grid;gap:12px;padding:12px;border:1px solid #475366;border-radius:8px}.sketch-heights h3{margin:0}.sketch-measures{display:grid;grid-template-columns:1fr 1fr;gap:12px}.sketch-room-list{display:flex;flex-direction:column;gap:8px}.sketch-room-list button{text-align:left;overflow-wrap:anywhere}.sketch-room-list small{display:block}.sketch-editor button[aria-pressed=true]{border-color:#8ccaff;background:#294e70}.sketch-workspace{min-width:0}.sketch-canvas{overflow:visible;display:block;width:100%;height:auto;background:#101e2c;border:1px solid #6487a8;border-radius:8px;touch-action:manipulation}.sketch-room{cursor:crosshair;stroke:#6684a1}.sketch-room.selected{stroke:#91ccff}.sketch-equipment{cursor:pointer}.sketch-equipment text,.sketch-feeders,.material-route-lines text{pointer-events:none}.sketch-room text{pointer-events:none;stroke:none}.anchor-hit{cursor:pointer}.anchor-hit:focus circle{stroke:#fff;stroke-width:2}.sketch-symbol,.material-route-lines g{pointer-events:all;cursor:pointer}.sketch-symbol:focus circle,.sketch-equipment:focus rect{stroke:#fff;stroke-width:3}.sketch-symbol path{stroke-width:1.5}.sketch-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:24px 0}.sketch-summary>div{border:1px solid #475366;border-radius:8px;padding:12px}.sketch-summary dt{font-size:13px;color:#bfccda}.sketch-summary dd{margin:6px 0 0;font-size:22px;font-weight:700}.sketch-point-list ul{padding:0;list-style:none;max-height:240px;overflow:auto}.sketch-point-list li{display:flex;justify-content:space-between;align-items:center;padding:6px 0;gap:12px}.sketch-instruction{min-height:48px}@media(max-width:800px){.sketch-layout{grid-template-columns:1fr}.sketch-summary{grid-template-columns:1fr 1fr}.sketch-tools button{flex:1;padding:10px}.sketch-controls{max-width:100%}}
</style>
