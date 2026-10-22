<script setup>
import { computed, ref, inject } from 'vue';
import { EQUIPMENT_TYPES, EQUIPMENT_ITEMS, FEEDER_ITEMS, feederLength } from '../services/sketchInfrastructure';
import NumberField from './NumberField.vue';
const showHelp = inject('budgetHelp', () => {});
import { currency } from '../data/laborCatalog';
const props = defineProps({ sketch: Object, levelId: String, selectedId: String, routeId: String, entries: { type: Array, default: () => [] } });
const emit = defineEmits(['edit', 'select', 'selectRoute', 'place', 'add', 'trace']);
const type = ref('medidor_tp'), source = ref(''), target = ref('');
const equipment = computed(() => (props.sketch.equipment ?? []).filter(e => e.levelId === props.levelId));
const selected = computed(() => equipment.value.find(e => e.id === props.selectedId));
const routes = computed(() => (props.sketch.feeders ?? []).filter(f => equipment.value.some(e => e.id === f.fromId)));
const route = computed(() => routes.value.find(f => f.id === props.routeId));
function edit(key, event) {
  const value = event.target.value;
  emit('edit', next => { next.equipment.find(e => e.id === props.selectedId)[key] = ['x', 'y'].includes(key) ? value.trim() ? Number(value) : NaN : value; });
}
function remove() {
  emit('edit', next => { next.equipment = next.equipment.filter(e => e.id !== props.selectedId); next.feeders = (next.feeders ?? []).filter(f => f.fromId !== props.selectedId && f.toId !== props.selectedId); });
}
function addRoute() {
  const id = crypto.randomUUID();
  emit('edit', next => { next.feeders ??= []; next.feeders.push({ id, fromId: source.value, toId: target.value, bends: [], verticalMeters: 0, itemId: '' }); }); emit('selectRoute', id);
}
const options = ids => props.entries.filter(e => ids.includes(e.id));
const name = id => equipment.value.find(e => e.id === id)?.name ?? '';
</script>
<template>
  <div class="infrastructure-controls">
<section class="infrastructure-panel"><div class="infra-heading"><h3>Tableros, medidor y puesta a tierra</h3><button type="button" @click="showHelp('equipos')">Ayuda de tableros</button></div>
    <div class="catalog-fields"><label>Elemento a dibujar<select v-model="type"><option v-for="(label, key) in EQUIPMENT_TYPES" :key="key" :value="key">{{ label }}</option></select></label></div>
    <div class="catalog-actions"><button type="button" :disabled="(sketch.equipment?.length ?? 0) >= 50" @click="emit('place', type)">Ubicar en el plano</button><button type="button" :disabled="(sketch.equipment?.length ?? 0) >= 50" @click="emit('add', type)">Agregar al centro del plano</button></div>
    <div class="equipment-list"><button v-for="e in equipment" :key="e.id" type="button" :aria-pressed="e.id === selectedId" @click="emit('select', e.id)">{{ e.name }}</button></div>
    <div v-if="selected" class="catalog-fields">
      <label>Nombre del elemento<input :value="selected.name" maxlength="60" @input="edit('name', $event)" @blur="$event.target.value = selected.name" /></label>
      <label v-for="axis in ['x','y']" :key="axis">{{ 'Elemento: posición ' + axis.toUpperCase() + ' (m)' }}<NumberField :model-value="selected[axis]" :min="0" :max="200" :step="0.1" @update:model-value="value => emit('edit', next => { next.equipment.find(e => e.id === selectedId)[axis] = value; })" /></label>
      <label>Trabajo del catálogo para este elemento<select :value="selected.itemId" @change="edit('itemId', $event)"><option value="">Elegir trabajo para cotizar</option><option v-for="item in options(EQUIPMENT_ITEMS[selected.type])" :key="item.id" :value="item.id">{{ item.description }} — {{ currency(item.price) }}</option></select></label>
    </div>
    <button v-if="selected" type="button" @click="remove">Quitar elemento y sus recorridos</button>
</section><section class="infrastructure-panel"><div class="infra-heading"><h3>Recorrido del pilar al tablero general</h3><button type="button" @click="showHelp('recorridos')">Ayuda de recorridos</button></div>
    <div class="catalog-fields"><label>Origen del recorrido<select v-model="source"><option value="">Elegir principal o medidor + TP</option><option v-for="e in equipment.filter(e => ['medidor_tp','principal'].includes(e.type))" :key="e.id" :value="e.id">{{ e.name }}</option></select></label><label>Destino del recorrido<select v-model="target"><option value="">Elegir tablero general</option><option v-for="e in equipment.filter(e => e.type === 'general')" :key="e.id" :value="e.id">{{ e.name }}</option></select></label></div>
    <button type="button" :disabled="!equipment.some(e => e.id === source) || !equipment.some(e => e.id === target) || (sketch.feeders?.length ?? 0) >= 50" @click="addRoute">Crear recorrido</button>
    <div class="equipment-list"><button v-for="f in routes" :key="f.id" type="button" :aria-pressed="f.id === routeId" @click="emit('selectRoute', f.id)">{{ name(f.fromId) }} → {{ name(f.toId) }} · {{ feederLength(sketch, f) }} m</button></div>
    <template v-if="route">
      <div class="catalog-fields"><label>Metros verticales adicionales<NumberField :model-value="route.verticalMeters" :min="0" :max="200" :step="0.1" @update:model-value="value => emit('edit', next => { next.feeders.find(f => f.id === route.id).verticalMeters = value; })" /></label><label>Trabajo para el recorrido<select :value="route.itemId" @change="emit('edit', next => { next.feeders.find(f => f.id === route.id).itemId = $event.target.value; })"><option value="">Elegir cómo cotizar</option><option value="measure-only">Solo medir, no cotizar este recorrido</option><option v-for="item in options(FEEDER_ITEMS)" :key="item.id" :value="item.id">{{ item.description }} — {{ currency(item.price) }}</option></select></label></div>
      <p><strong>Longitud del recorrido: {{ feederLength(sketch, route) }} m</strong></p>
      <div class="catalog-actions"><button type="button" :disabled="route.bends.length >= 50" @click="emit('trace')">Agregar quiebres tocando el plano</button><button type="button" :disabled="!route.bends.length" @click="emit('edit', next => { next.feeders.find(f => f.id === route.id).bends.pop(); })">Quitar último quiebre</button><button type="button" @click="emit('edit', next => { next.feeders = next.feeders.filter(f => f.id !== route.id); })">Quitar recorrido</button></div>
    </template>
    </section>
  </div>
</template>
<style scoped>
.infrastructure-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;border-top:1px solid #475366;padding-top:20px;margin-top:20px}.infrastructure-panel{min-width:0;border:1px solid #475366;border-radius:8px;padding:16px}.infra-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}.infra-heading h3{margin:0}.infra-heading button{font-size:13px;padding:6px 10px}.infrastructure-controls .catalog-fields{grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));margin-top:18px}.equipment-list{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.equipment-list button{overflow-wrap:anywhere;max-width:100%}
@media(max-width:900px){.infrastructure-controls{grid-template-columns:1fr}}
</style>
