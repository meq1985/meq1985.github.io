<script setup>
import { computed } from 'vue';
import NumberField from './NumberField.vue';
import { DEFAULT_CALCULATION, proposeElectrical } from '../services/automaticDesign';
import { emptyMaterialNetwork } from '../services/materialNetwork';
const props = defineProps({ sketch: Object, disabled: Boolean });
const emit = defineEmits(['edit']);
const design = computed(() => proposeElectrical(props.sketch));
const settings = computed(() => ({ ...DEFAULT_CALCULATION, ...props.sketch.materials?.calculation }));
function update(key, value) {
  if (props.disabled) return;
  emit('edit', next => { next.schema = 2; next.materials ??= emptyMaterialNetwork(); next.materials.calculation = { ...settings.value, [key]: value }; });
}
</script>
<template>
  <section class="auto-design" aria-label="Cálculo automático de circuitos">
    <h3>Circuitos y cables desde el croquis</h3>
    <p>Vivienda monofásica · cobre unipolar PVC en cañería embutida. Se propone un recorrido radial sobre las líneas dibujadas.</p>
    <button v-if="!design" type="button" :disabled="disabled" @click="update('profile', 'cu-pvc-b1-v1')">Calcular circuitos y cables</button>
    <template v-else>
      <p>Demanda TUG: {{ settings.tugDemandMode === 'per-point-150' ? '150 VA por toma · estimación del proyecto' : '2200 VA por circuito · referencia de tabla AEA' }}.</p>

      <details><summary>Datos del cálculo</summary><label>Demanda de tomacorrientes<select :value="settings.tugDemandMode" :disabled="disabled" @change="update('tugDemandMode', $event.target.value)"><option value="per-point-150">150 VA por toma · estimación del proyecto</option><option value="per-circuit-2200">2200 VA por circuito · referencia de tabla AEA</option></select></label><p>Entre tomas se usa trazado directo por defecto; en los demás enlaces se usa techo. Podés cambiar el trazado en cada conexión. El alimentador TP → TG incorpora 3 m para subidas/bajadas. Un valor vertical manual mayor que cero reemplaza esas verticales. Las alturas generales se editan al lado del croquis.</p>
        <div class="auto-fields"><label v-for="f in [['voltage','Tensión (V)',200,240,1],['limitPercent','Máximo del circuito terminal (%)',0.1,2,0.1],['feederLimitPercent','Máximo TP → TG (%)',0.1,1,0.1],['totalLimitPercent','Máximo total TP → punto (%)',0.1,3,0.1],['upstreamPercent','Caída previa al tablero (%)',0,5,0.1],['boardHeight','Altura de tableros (m)',0.1,5,0.1],['correctionFactor','Factor adicional por temperatura / instalación',0.1,1,0.01]]" :key="f[0]">{{ f[1] }}<NumberField :model-value="settings[f[0]]" :min="f[2]" :max="f[3]" :step="f[4]" :disabled="disabled" @update:model-value="v => update(f[0], v)" /></label></div>
        <p>Referencia térmica a 30 °C, B1 con tres conductores cargados; el agrupamiento se reduce automáticamente por los circuitos que comparten cañería. Factor adicional 1 supone esas condiciones de referencia. Caída calculada con R = 23,7/S Ω/km, cos φ = 1 y X despreciada para las secciones propuestas.</p>
        <p>En mandos, se usa la longitud equivalente de ida del lazo eléctrico. Los metros de materiales se suman por conductor en cada tramo.</p><p>IUG: 40 VA simultáneos por luminaria. La demanda TUG sigue el criterio seleccionado. Máximo 15 puntos por circuito, con mínimos de cantidad según superficie aportados para el proyecto. Verificá consumos reales antes de ejecutar.</p>
      </details>
      <div class="catalog-scroll"><table class="catalog-table"><thead><tr><th>Circuito</th><th>Puntos</th><th>Longitud de cálculo</th><th>Corriente</th><th>Sección</th><th>Caída total</th><th>Protección propuesta</th></tr></thead><tbody><tr v-for="c in [...design.feederCircuits, ...design.circuits]" :key="c.id"><td>{{ c.name }}</td><td>{{ c.pointIds.length }}</td><td>{{ c.meters.toFixed(2) }} m</td><td>{{ c.current.toFixed(2) }} A</td><td>{{ c.section ? `${c.section} mm²` : c.status === 'reserved' ? 'Reserva' : 'Pendiente' }}</td><td>{{ c.percent == null ? '—' : `${c.percent.toFixed(2)} %` }}</td><td>{{ c.breaker == null ? 'Pendiente' : `${c.breaker} A` }} · verificar curva y corte</td></tr></tbody></table></div>
      <ul><li v-for="warning in design.warnings" :key="warning">{{ warning }}</li></ul>
      <button type="button" :disabled="disabled" @click="emit('edit', next => { delete next.materials.calculation; })">Volver a conductores manuales</button>
    </template>
  </section>
</template>
<style scoped>.auto-design{margin:12px 0}.auto-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.auto-design summary{cursor:pointer;font-weight:700}.catalog-scroll{overflow:auto}.auto-design th,.auto-design td{padding:10px;text-align:left}</style>
