<script setup>
import { computed } from 'vue';
import NumberField from './NumberField.vue';
import ElectricalReview from './ElectricalReview.vue';
import { TECHNICAL_DEFAULTS } from '../services/electricalReview';
import { canMergeCircuits, DEFAULT_CALCULATION, proposeElectrical } from '../services/automaticDesign';
import { emptyMaterialNetwork } from '../services/materialNetwork';
const props = defineProps({ sketch: Object, disabled: Boolean });
const emit = defineEmits(['edit']);
const design = computed(() => proposeElectrical(props.sketch));
const settings = computed(() => ({ ...DEFAULT_CALCULATION, ...props.sketch.materials?.calculation }));
const mergeOptions = computed(() => new Map(design.value?.circuits.map(c => [
  c.id, design.value.circuits.filter(other => canMergeCircuits(c, other)),
])));
function update(key, value) {
  if (props.disabled) return;
  emit('edit', next => { next.schema = 2; next.materials ??= emptyMaterialNetwork(); next.materials.calculation = { ...settings.value, [key]: value, ...(key === 'profile' && !settings.value.technical ? {technical:structuredClone(TECHNICAL_DEFAULTS)} : {}) }; });
}
function merge(circuit, targetId) {
  const target = mergeOptions.value.get(circuit.id)?.find(c => c.id === targetId);
  if (!target) return;
  const points = [...circuit.pointIds, ...target.pointIds];
  const otherMerges = (settings.value.circuitMerges ?? []).filter(group => !group.some(id => points.includes(id)));
  update('circuitMerges', [...otherMerges, points]);
}
</script>
<template>
  <section class="auto-design" aria-label="Cálculo automático de circuitos">
    <h3>Circuitos y cables desde el croquis</h3>
    <p>Vivienda monofásica · cobre unipolar PVC en cañería embutida. Se propone un recorrido radial sobre las líneas dibujadas.</p>
    <button v-if="!design" type="button" :disabled="disabled" @click="update('profile', 'cu-pvc-iram-40-v2')">Calcular circuitos y cables</button>
    <template v-else>
      <p>Demanda TUG: {{ settings.tugDemandMode === 'per-point-150' ? '150 VA por toma · estimación del proyecto' : '2200 VA por circuito · referencia de tabla AEA' }}.</p>

      <details><summary>Datos del cálculo</summary><label>Perfil térmico<select :value="settings.profile" :disabled="disabled" @change="update('profile', $event.target.value)"><option value="cu-pvc-b1-v1">Referencia anterior · IEC B1 · 30 °C · 3 cargados</option><option value="cu-pvc-iram-40-v2">Prysmian Argentina 2020 · 40 °C · 2 cargados + PE</option></select></label><label>Demanda de tomacorrientes<select :value="settings.tugDemandMode" :disabled="disabled" @change="update('tugDemandMode', $event.target.value)"><option value="per-point-150">150 VA por toma · estimación del proyecto</option><option value="per-circuit-2200">2200 VA por circuito · referencia de tabla AEA</option></select></label><p>Entre tomas se usa trazado directo por defecto; en los demás enlaces se usa techo. Podés cambiar el trazado en cada conexión. El alimentador TP → TG incorpora 3 m para subidas/bajadas. Un valor vertical manual mayor que cero reemplaza esas verticales. Las alturas generales se editan al lado del croquis.</p>
        <div class="auto-fields"><label v-for="f in [['voltage','Tensión (V)',200,240,1],['limitPercent','Máximo del circuito terminal (%)',0.1,2,0.1],['feederLimitPercent','Máximo TP → TG (%)',0.1,1,0.1],['totalLimitPercent','Máximo total TP → punto (%)',0.1,3,0.1],['upstreamPercent','Caída previa al tablero (%)',0,5,0.1],['boardHeight','Altura de tableros (m)',0.1,5,0.1],['correctionFactor','Factor adicional por temperatura / instalación',0.1,1,0.01]]" :key="f[0]">{{ f[1] }}<NumberField :model-value="settings[f[0]]" :min="f[2]" :max="f[3]" :step="f[4]" :disabled="disabled" @update:model-value="v => update(f[0], v)" /></label></div>
        <p>{{ settings.profile === 'cu-pvc-iram-40-v2' ? 'Referencia Prysmian Argentina a 40 °C, dos conductores cargados más PE' : 'Referencia anterior IEC B1 a 30 °C, tres conductores cargados' }}; el agrupamiento se reduce automáticamente por los circuitos que comparten cañería. Factor adicional 1 supone esas condiciones de referencia. Caída calculada con R = 23,7/S Ω/km, cos φ = 1 y X despreciada para las secciones propuestas.</p>
        <p>En mandos, se usa la longitud equivalente de ida del lazo eléctrico. Los metros de materiales se suman por conductor en cada tramo.</p><p>IUG: 40 VA simultáneos por luminaria. La demanda TUG sigue el criterio seleccionado. Máximo 15 puntos por circuito, con mínimos de cantidad según superficie aportados para el proyecto. Verificá consumos reales antes de ejecutar.</p>
      </details>
      <p>Los circuitos IUG parten de 2,5 mm². Los retornos y puentes de llaves combinadas usan 1,5 mm².</p>
      <p>Podés unir circuitos IUG entre sí o TUG entre sí, del mismo tablero y con hasta 15 puntos en total.</p>
      <div class="catalog-scroll">
        <table class="catalog-table">
          <thead><tr><th>Circuito</th><th>Puntos</th><th>Longitud de cálculo</th><th>Corriente</th><th>Sección</th><th>Caída total</th><th>Protección propuesta</th><th>Unir circuitos</th></tr></thead>
          <tbody>
            <tr v-for="c in [...design.feederCircuits, ...design.circuits]" :key="c.id">
              <td>{{ c.name }}</td><td>{{ c.pointIds.length }}</td><td>{{ c.meters.toFixed(2) }} m</td><td>{{ c.current.toFixed(2) }} A</td>
              <td>{{ c.section ? `${c.section} mm²` : c.status === 'reserved' ? 'Reserva' : 'Pendiente' }}</td>
              <td>{{ c.percent == null ? '—' : `${c.percent.toFixed(2)} %` }}</td>
              <td>{{ c.breaker == null ? 'Pendiente' : `${c.breaker} A` }} · verificar curva y corte</td>
              <td>
                <select v-if="mergeOptions.get(c.id)?.length" :aria-label="`Unir ${c.name} con otro circuito`" :disabled="disabled" @change="merge(c, $event.target.value); $event.target.value = ''">
                  <option value="">Unir con…</option>
                  <option v-for="other in mergeOptions.get(c.id)" :key="other.id" :value="other.id">{{ other.name }} ({{ c.pointIds.length + other.pointIds.length }} puntos)</option>
                </select>
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button v-if="settings.circuitMerges?.length" type="button" :disabled="disabled" @click="update('circuitMerges', [])">Restablecer circuitos automáticos</button>
      <ElectricalReview :design="design" :disabled="disabled" @edit="emit('edit',$event)" />
      <ul><li v-for="warning in design.warnings" :key="warning">{{ warning }}</li></ul>
      <button type="button" :disabled="disabled" @click="emit('edit', next => { delete next.materials.calculation; })">Volver a conductores manuales</button>
    </template>
  </section>
</template>
<style scoped>.auto-design{margin:12px 0}.auto-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.auto-design summary{cursor:pointer;font-weight:700}.catalog-scroll{overflow:auto}.auto-design th,.auto-design td{padding:10px;text-align:left}</style>
