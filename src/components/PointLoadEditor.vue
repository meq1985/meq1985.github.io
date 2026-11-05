<script setup>
import NumberField from './NumberField.vue';
const props = defineProps({ point: Object, disabled: Boolean });
const emit = defineEmits(['update', 'close']);
function kind(value) {
  if (props.disabled) return;
  emit('update', value ? {kind:value,name:props.point.load?.name ?? 'Carga especial',powerW:props.point.load?.powerW ?? 2200,powerFactor:props.point.load?.powerFactor ?? 1} : null);
}
function edit(key,value) { if (!props.disabled && props.point.load) emit('update',{...props.point.load,[key]:value}); }
</script>
<template>
  <section class="point-load catalog-panel" aria-label="Carga del punto seleccionado">
    <div class="catalog-actions"><h3>Carga del punto seleccionado</h3><button type="button" @click="emit('close')">Cerrar carga</button></div>
    <label>Uso de esta toma<select :disabled="disabled" :value="point.load?.kind ?? ''" @change="kind($event.target.value)"><option value="">TUG · uso general</option><option value="TUE">TUE · uso especial</option><option value="dedicated">Carga dedicada · uso específico</option></select></label>
    <template v-if="point.load">
      <div class="load-fields"><label>Nombre de la carga<input :disabled="disabled" :value="point.load.name" maxlength="60" @change="edit('name',$event.target.value)" /></label><label>Potencia absorbida (W)<NumberField :disabled="disabled" :model-value="point.load.powerW" :min="1" :max="14000" :step="100" @update:model-value="edit('powerW',$event)" /></label><label>Factor de potencia<NumberField :disabled="disabled" :model-value="point.load.powerFactor" :min="0.1" :max="1" :step="0.05" @update:model-value="edit('powerFactor',$event)" /></label></div>
      <small>Usá la potencia eléctrica de entrada de la placa, no la potencia frigorífica o mecánica. Cada carga declarada recibe un circuito independiente. TUE toma al menos 3300 VA y limita la carga unitaria a 20 A; para mayor consumo elegí carga dedicada. La protección del circuito TUE no supera 32 A; una carga dedicada requiere condiciones del fabricante.</small>
    </template>
  </section>
</template>
<style scoped>.point-load{margin:12px 0}.point-load h3{margin:0}.load-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}.point-load small{display:block;margin-top:12px}.point-load label{display:flex;flex-direction:column;gap:6px}</style>
