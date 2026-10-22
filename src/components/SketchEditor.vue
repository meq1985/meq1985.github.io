<script setup>
import { computed, ref, watch, useId } from 'vue';
import { emptySketch, validateSketch, sketchSummary, overlapsRoom, POINT_TYPES, SKETCH_LIMITS } from '../services/sketch';
const props = defineProps({ modelValue: { type: Object, default: null }, disabled: Boolean });
const emit = defineEmits(['update:modelValue']);
const sketch = computed(() => props.modelValue ?? emptySketch());
const levelId = ref(sketch.value.levels[0].id), roomId = ref(sketch.value.rooms.find(room => room.levelId === levelId.value)?.id ?? ''), tool = ref('select'), error = ref('');
const undo = ref([]), redo = ref([]);
const gridId = useId();
const rooms = computed(() => sketch.value.rooms.filter(room => room.levelId === levelId.value));
const room = computed(() => rooms.value.find(item => item.id === roomId.value));
const summary = computed(() => sketchSummary(sketch.value));
const width = computed(() => Math.max(12, ...rooms.value.map(item => item.x + item.width + 1)));
const depth = computed(() => Math.max(9, ...rooms.value.map(item => item.y + item.depth + 1)));
const overlap = computed(() => rooms.value.some(a => rooms.value.some(b => overlapsRoom(a, b))));
const clone = value => JSON.parse(JSON.stringify(value));
const freshId = () => crypto.randomUUID();
watch(() => props.modelValue, () => {
  if (!sketch.value.levels.some(level => level.id === levelId.value)) levelId.value = sketch.value.levels[0].id;
  if (!room.value) roomId.value = rooms.value[0]?.id ?? '';
});
function change(edit) {
  if (props.disabled) return;
  try {
    const next = clone(sketch.value); edit(next);
    const valid = validateSketch(next);
    if (JSON.stringify(valid) === JSON.stringify(sketch.value)) { error.value = ''; return true; }
    undo.value.push(clone(props.modelValue)); undo.value = undo.value.slice(-40); redo.value = [];
    emit('update:modelValue', valid); error.value = ''; return true;
  } catch (cause) { error.value = cause.message; return false; }
}
function history(from, to) {
  if (props.disabled || !from.length) return;
  to.push(clone(props.modelValue)); emit('update:modelValue', from.pop()); error.value = '';
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
function editRoom(key, event) {
  const value = event.target.value;
  const accepted = change(next => { next.rooms.find(item => item.id === roomId.value)[key] = key === 'name' ? value : value.trim() === '' ? NaN : Number(value); });
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
  change(next => { next.rooms = next.rooms.filter(item => item.levelId !== levelId.value); next.levels = next.levels.filter(item => item.id !== levelId.value); });
}
</script>
<template>
  <section class="catalog-panel sketch-editor" aria-labelledby="sketch-title">
    <div class="sketch-heading"><div><p class="sketch-eyebrow">CROQUIS · VERSIÓN INICIAL</p><h2 id="sketch-title">Dibujá tu proyecto</h2></div><div class="sketch-history"><button type="button" :disabled="disabled || !undo.length" @click="history(undo, redo)">Deshacer</button><button type="button" :disabled="disabled || !redo.length" @click="history(redo, undo)">Rehacer</button></div></div>
    <p class="muted">Definí ambientes rectangulares y sus medidas en metros. Elegí un símbolo y tocá dentro del ambiente para colocarlo.</p>
    <p v-if="error" role="alert" class="catalog-notice error">{{ error }}</p>
    <fieldset :disabled="disabled">
      <div class="sketch-layout">
        <div class="sketch-controls">
          <label>Nivel<select v-model="levelId" @change="roomId = rooms[0]?.id ?? ''"><option v-for="level in sketch.levels" :key="level.id" :value="level.id">{{ level.name }}</option></select></label>
          <label>Nombre del nivel<input :value="sketch.levels.find(level => level.id === levelId)?.name" maxlength="60" @input="editLevel" @blur="$event.target.value = sketch.levels.find(level => level.id === levelId).name" /></label>
          <div class="catalog-actions"><button type="button" :disabled="sketch.levels.length >= SKETCH_LIMITS.levels" @click="addLevel">+ Nivel</button><button type="button" :disabled="sketch.levels.length === 1" @click="removeLevel">Quitar nivel</button></div>
          <h3>Ambientes</h3>
          <div class="sketch-room-list"><button v-for="item in rooms" :key="item.id" type="button" :aria-pressed="roomId === item.id" @click="roomId = item.id">{{ item.name }} <small>{{ item.width * item.depth }} m²</small></button></div>
          <button type="button" :disabled="sketch.rooms.length >= SKETCH_LIMITS.rooms" @click="addRoom">+ Ambiente</button>
          <template v-if="room">
            <label>Nombre del ambiente<input :value="room.name" maxlength="60" @input="editRoom('name', $event)" @blur="$event.target.value = room.name" /></label>
            <div class="sketch-measures"><label v-for="field in [['width','Ancho (m)',1,50],['depth','Largo (m)',1,50],['x','Posición X (m)',0,100],['y','Posición Y (m)',0,100]]" :key="field[0]">{{ field[1] }}<input :value="room[field[0]]" type="number" :min="field[2]" :max="field[3]" step="0.1" @input="editRoom(field[0], $event)" @blur="$event.target.value = room[field[0]]" /></label></div>
            <button type="button" @click="removeRoom">Quitar ambiente</button>
          </template>
        </div>
        <div class="sketch-workspace">
          <div class="sketch-tools" role="group" aria-label="Herramientas del croquis"><button type="button" :aria-pressed="tool === 'select'" @click="tool = 'select'">Seleccionar</button><button v-for="(label, type) in POINT_TYPES" :key="type" type="button" :aria-pressed="tool === type" @click="tool = type">{{ label }}</button></div>
          <p class="muted sketch-instruction" role="status">{{ tool === 'select' ? 'Seleccioná un ambiente para editar sus medidas.' : `Herramienta: ${POINT_TYPES[tool]}. Tocá el plano o usá «Agregar al centro».` }}</p>
          <svg class="sketch-canvas" :viewBox="`0 0 ${width * 30} ${depth * 30}`" :style="{ aspectRatio: `${width} / ${depth}` }" role="img" aria-label="Plano del nivel seleccionado. Editá también desde los controles de ambientes.">
            <defs><pattern :id="gridId" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="#294158" stroke-width="0.6" /></pattern></defs>
            <rect width="100%" height="100%" :fill="`url(#${gridId})`" />
            <g v-for="item in rooms" :key="item.id" class="sketch-room" :class="{ selected: item.id === roomId }" @click="place($event, item)">
              <rect :x="item.x * 30" :y="item.y * 30" :width="item.width * 30" :height="item.depth * 30" fill="#1a3044" stroke-width="2" />
              <text :x="item.x * 30 + 7" :y="item.y * 30 + 16" fill="#dcecff" font-size="11">{{ item.name }}</text>
              <text :x="item.x * 30 + 7" :y="item.y * 30 + 30" fill="#a9bfd3" font-size="9">{{ item.width }} × {{ item.depth }} m</text>
              <g v-for="point in item.points" :key="point.id" :transform="`translate(${(item.x + point.x * item.width) * 30}, ${(item.y + point.y * item.depth) * 30})`" class="sketch-symbol"><title>{{ POINT_TYPES[point.type] }} · {{ item.name }}</title><circle r="7" fill="#101e2c" stroke="#f8ce76" stroke-width="1.5" /><path v-if="point.type === 'luminaria'" d="M-4-4 4 4 M-4 4 4-4" stroke="#f8ce76" /><path v-else-if="point.type === 'toma'" d="M-2-3 V3 M2-3 V3" stroke="#f8ce76" /><path v-else d="M-3 3 3-3" stroke="#f8ce76" /></g>
            </g>
          </svg>
          <p v-if="!rooms.length" class="catalog-notice">Agregá el primer ambiente de este nivel para empezar.</p>
          <p v-if="overlap" class="catalog-notice">Hay ambientes superpuestos en este nivel. Revisá sus posiciones; la superficie suma cada ambiente.</p>
          <p class="muted">Cuadrícula: 1 × 1 m. Símbolos: ⊗ luminaria · doble línea toma · diagonal llave.</p>
          <div v-if="room" class="catalog-actions"><button type="button" :disabled="tool === 'select'" @click="addPoint()">Agregar al centro de {{ room.name }}</button></div>
          <div v-if="room?.points.length" class="sketch-point-list"><h3>Puntos de {{ room.name }}</h3><ul><li v-for="(point, index) in room.points" :key="point.id">{{ POINT_TYPES[point.type] }} {{ index + 1 }}<button type="button" :aria-label="`Quitar ${POINT_TYPES[point.type]} ${index + 1}`" @click="change(next => { const target = next.rooms.find(item => item.id === room.id); target.points = target.points.filter(item => item.id !== point.id); })">Quitar</button></li></ul></div>
        </div>
      </div>
    </fieldset>
    <dl class="sketch-summary"><div><dt>Superficie total</dt><dd>{{ summary.area }} m²</dd></div><div v-for="(label, type) in POINT_TYPES" :key="type"><dt>{{ label }}s</dt><dd>{{ summary[type] }}</dd></div></dl>
    <p class="muted">El croquis se guarda al pulsar «Guardar proyecto en mi cuenta», junto con el cliente y al menos un trabajo. Esta versión permite organizar puntos; todavía no calcula costos ni materiales y no se incluye en el PDF del presupuesto.</p>
  </section>
</template>
<style scoped>
.sketch-heading,.sketch-history,.sketch-tools{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.sketch-heading{justify-content:space-between}.sketch-eyebrow{color:#a8d4ff;font-size:11px;letter-spacing:2px}.sketch-layout{display:grid;grid-template-columns:250px minmax(0,1fr);gap:24px}.sketch-controls{display:flex;flex-direction:column;gap:14px}.sketch-controls .catalog-actions{margin:0}.sketch-controls h3{margin:8px 0 0}.sketch-measures{display:grid;grid-template-columns:1fr 1fr;gap:12px}.sketch-room-list{display:flex;flex-direction:column;gap:8px}.sketch-room-list button{text-align:left;overflow-wrap:anywhere}.sketch-room-list small{display:block}.sketch-editor button[aria-pressed=true]{border-color:#8ccaff;background:#294e70}.sketch-workspace{min-width:0}.sketch-canvas{display:block;width:100%;height:auto;background:#101e2c;border:1px solid #6487a8;border-radius:8px;touch-action:manipulation}.sketch-room{cursor:crosshair;stroke:#6684a1}.sketch-room.selected{stroke:#91ccff}.sketch-room text,.sketch-symbol{pointer-events:none;stroke:none}.sketch-symbol path{stroke-width:1.5}.sketch-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:24px 0}.sketch-summary>div{border:1px solid #475366;border-radius:8px;padding:12px}.sketch-summary dt{font-size:13px;color:#bfccda}.sketch-summary dd{margin:6px 0 0;font-size:22px;font-weight:700}.sketch-point-list ul{padding:0;list-style:none;max-height:240px;overflow:auto}.sketch-point-list li{display:flex;justify-content:space-between;align-items:center;padding:6px 0;gap:12px}.sketch-instruction{min-height:48px}@media(max-width:800px){.sketch-layout{grid-template-columns:1fr}.sketch-summary{grid-template-columns:1fr 1fr}.sketch-tools button{flex:1;padding:10px}.sketch-controls{max-width:100%}}
</style>
