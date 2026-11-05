<script setup>
import { computed, ref } from 'vue';
import NumberField from './NumberField.vue';
import { TECHNICAL_DEFAULTS } from '../services/electricalReview';
const props=defineProps({design:Object,disabled:Boolean});
const emit=defineEmits(['edit']);
const view=ref('conduits');
const review=computed(()=>props.design.review);
const settings=computed(()=>props.design.settings.technical ?? TECHNICAL_DEFAULTS);
const boardData=id=>settings.value.boards.find(b=>b.id===id) ?? {id,ikMaxKA:null,ikMinA:null,sourceNote:'',enclosureModules:null};
function change(fn){if(!props.disabled)emit('edit',s=>{s.materials.calculation.technical??=structuredClone(TECHNICAL_DEFAULTS);fn(s.materials.calculation.technical);});}
function board(id,key,value){const data={...boardData(id),[key]:value};change(t=>{t.boards=t.boards.filter(b=>b.id!==id);t.boards.push(data);});}
const state=s=>({pass:'Cumple este chequeo',fail:'No cumple',pending:'Pendiente'}[s]);
const n=value=>value==null?'—':value.toLocaleString('es-AR',{maximumFractionDigits:2});
</script>
<template>
  <section class="electrical-review" aria-label="Revisión técnica de la instalación">
    <h3>Cañerías y tableros</h3>
    <button v-if="!review" type="button" :disabled="disabled" @click="change(()=>{})">Ampliar verificación técnica</button>
    <template v-else>
      <p class="catalog-notice">Verificación parcial. Los datos faltantes quedan pendientes.</p>
      <details><summary>Configuración de gabinetes</summary>
        <div v-for="b in review.boards" :key="b.id" class="review-entry"><h4>{{ b.name }}</h4><div class="review-fields">
          <label>Capacidad real del gabinete (módulos)<NumberField nullable integer :disabled="disabled" :model-value="boardData(b.id).enclosureModules" :min="1" :max="144" :step="1" @update:model-value="board(b.id,'enclosureModules',$event)" /></label>
        </div></div>
        <div class="review-fields"><label>Reserva libre del gabinete (%)<NumberField :disabled="disabled" :model-value="settings.reservePercent" :min="0" :max="50" :step="5" @update:model-value="change(t=>t.reservePercent=$event)" /></label><label>Módulos extra para DPS y auxiliares<NumberField integer :disabled="disabled" :model-value="settings.extraModules" :min="0" :max="100" :step="1" @update:model-value="change(t=>t.extraModules=$event)" /></label></div>
      </details>
      <div class="catalog-actions" role="group" aria-label="Resultados técnicos"><button v-for="tab in [['conduits','Cañerías'],['boards','Tableros']]" :key="tab[0]" type="button" :aria-pressed="view === tab[0]" @click="view=tab[0]">{{ tab[1] }}</button></div>
      <div v-if="view === 'conduits'" class="catalog-scroll"><table class="catalog-table"><caption>Cañerías recomendadas · elegí una de las dos alternativas</caption><thead><tr><th>Recorrido</th><th>Conductores</th><th>Corrugado recomendado</th><th>Aislante rígido recomendado</th></tr></thead><tbody><tr v-for="r in review.conduits" :key="r.id"><td>{{ r.name }}</td><td>{{ r.wireCount }}</td><td>{{ r.sharingInvalid?'Separar circuitos':r.corrugated ?? 'Pendiente' }}</td><td>{{ r.sharingInvalid?'Separar circuitos':r.rigid ?? 'Pendiente' }}</td></tr></tbody></table></div>
      <div v-if="view === 'boards'" class="catalog-scroll"><table class="catalog-table"><caption>Previsión de tableros · confirmar componentes reales</caption><thead><tr><th>Tablero</th><th>Circuitos</th><th>Módulos ocupados</th><th>Mínimo con reserva / propuesta</th><th>Diferencial propuesto</th></tr></thead><tbody><tr v-for="b in review.boards" :key="b.id"><td>{{ b.name }}</td><td>{{ b.circuitCount }}</td><td>{{ b.occupiedModules }}</td><td>{{ n(b.minimumModules) }} / {{ n(b.proposedModules) }} · {{ state(b.status) }}</td><td><template v-if="b.hasRcd">2P · 30 mA · {{ n(b.rcdRatedA) }} A · tipo a confirmar</template><template v-else>No previsto · confirmar esquema Clase II</template><span v-if="b.outsideScope"> · fuera de alcance</span><span v-if="b.supplyUnresolved"> · alimentación pendiente</span></td></tr></tbody></table></div>
      <details><summary>Hipótesis y referencias</summary><ul><li v-for="w in review.warnings" :key="w">{{ w }}</li></ul><p>Referencia AEA 770: edición 2017 contrastada; edición 2026 anunciada, texto completo pendiente de revisión. Estos chequeos no acreditan cumplimiento de una edición vigente.</p><p>Diámetros de cable: <a href="https://latam.prysmian.com/sites/latam.prysmian.com/files/media/documents/PRY2020_Superastic%20Jet.pdf" target="_blank" rel="noopener noreferrer">Prysmian Argentina, ficha 2020</a>..</p></details>
    </template>
  </section>
</template>
<style scoped>.electrical-review{margin-top:24px}.review-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}.review-entry{margin:14px 0;padding:14px;border:1px solid #42556a;border-radius:8px}.review-entry h4{margin:0 0 12px}.review-fields label{display:flex;flex-direction:column;gap:6px}.electrical-review details{margin:16px 0}.electrical-review caption{text-align:left;font-weight:700;padding:12px 0}.electrical-review .catalog-scroll{margin:12px 0}.electrical-review td,.electrical-review th{min-width:130px;white-space:normal;padding:10px}</style>
