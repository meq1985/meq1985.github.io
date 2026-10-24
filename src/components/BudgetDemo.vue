<script setup>
import { computed, onUnmounted, ref } from 'vue';
const elapsed = ref(0), playing = ref(false), quantity = ref(43);
let timer;
const step = computed(() => elapsed.value < 15 ? 0 : elapsed.value < 35 ? 1 : 2);
const titles = ['Elegí los trabajos', 'Ajustá las cantidades', 'Descargá tu presupuesto'];
const total = computed(() => '$ ' + (quantity.value * 50000 + 1766000).toLocaleString('es-AR'));
function pause() { clearInterval(timer); playing.value = false; }
function play() {
  if (elapsed.value >= 50) elapsed.value = 0;
  pause(); playing.value = true;
  timer = setInterval(() => { elapsed.value++; if (elapsed.value >= 50) pause(); }, 1000);
}
function selectStep(index) { pause(); elapsed.value = [0, 15, 35][index]; }
onUnmounted(pause);
</script>

<template>
  <section id="demostracion" class="budget-demo section" aria-labelledby="demo-title">
    <div><p class="eyebrow">DE UN TRABAJO AL PDF</p><h2 id="demo-title">Mirá cómo se hace.</h2><p class="section-copy">Una demostración interactiva de 50 segundos. Recorré los pasos a tu ritmo, sin crear una cuenta.</p>
      <button class="button secondary" :aria-pressed="playing" @click="playing ? pause() : play()">{{ playing ? 'Pausar demostración' : elapsed >= 50 ? 'Volver a reproducir' : 'Reproducir demostración' }}</button>
      <p class="demo-time">{{ elapsed }} / 50 segundos</p><progress :value="elapsed" max="50" aria-label="Progreso de la demostración" />
      <nav class="demo-steps" aria-label="Pasos de la demostración"><button v-for="(title, index) in titles" :key="title" :aria-current="step === index ? 'step' : undefined" @click="selectStep(index)">{{ index + 1 }}. {{ title }}</button></nav>
    </div>
    <div class="demo-screen"><p class="eyebrow">EJEMPLO INTERACTIVO · DATOS FICTICIOS</p><h3 aria-live="polite">{{ titles[step] }}</h3>
      <template v-if="step === 0"><p>Seleccioná trabajos del catálogo de mano de obra.</p><ul><li>✓ Bocas completas</li><li>✓ Proyecto por m², tableros y alimentación</li></ul><button class="button secondary" @click="selectStep(1)">Ajustar cantidades →</button></template>
      <template v-else-if="step === 1"><label for="demo-quantity">Bocas completas · $50.000 por boca</label><div class="demo-quantity"><button aria-label="Quitar una boca" :disabled="quantity <= 1" @click="quantity--">−</button><output id="demo-quantity" aria-live="polite">{{ quantity }}</output><button aria-label="Agregar una boca" :disabled="quantity >= 100" @click="quantity++">+</button></div><p>Proyecto por 120 m², tableros y alimentación: $1.766.000</p><strong>Total mano de obra: {{ total }}</strong><p>Los valores son ilustrativos. En tu cuenta usás tus propios precios.</p><button class="button secondary" @click="selectStep(2)">Ver el resultado →</button></template>
      <template v-else><p>Tu PDF reúne tus datos profesionales, el cliente, el detalle y el total de mano de obra.</p><p>El archivo de muestra tiene 43 bocas, proyecto por 120 m², tableros y alimentación, por $3.916.000. No cambia al explorar esta demostración.</p><a class="button" href="/ejemplo-presupuesto-electrico.pdf" download>Descargar PDF de ejemplo</a><p class="demo-time">Datos ficticios · Sin registro · Materiales no incluidos</p></template>
    </div>
  </section>
</template>

<style scoped>
.eyebrow{color:#99cfff;font-size:11px;font-weight:700;letter-spacing:1.8px;margin-bottom:20px}h2{font-size:clamp(27px,3vw,37px);line-height:1.2;letter-spacing:-.8px;margin-bottom:28px}.section-copy{color:#b6c3d2;font-size:15px}.button{display:inline-flex;align-items:center;justify-content:center;background:#99d2ff;color:#102335;padding:13px 22px;border:1px solid transparent;border-radius:7px;font:700 14px Arial,sans-serif;text-decoration:none;min-height:48px;cursor:pointer}.button.secondary{background:transparent;color:#edf2f8;border-color:#647789}.budget-demo{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}.demo-screen{background:#19232f;border:1px solid #3a4d60;border-radius:14px;padding:30px;min-height:365px}.demo-screen p,.demo-screen li{color:#b6c3d2}.demo-screen li{margin:16px 0}.demo-screen ul{padding:0;list-style:none}.demo-screen h3{font-size:24px;color:#edf2f8}.demo-time{font-size:12px;color:#b6c3d2}.demo-steps{display:grid;gap:10px;margin-top:20px}.demo-steps button,.demo-quantity button{font:inherit;color:#edf2f8;background:#223346;border:1px solid #647789;border-radius:7px;padding:10px;cursor:pointer;text-align:left}.demo-steps button[aria-current]{border-color:#99d2ff;background:#304a63}.demo-quantity{display:flex;align-items:center;gap:20px;margin:18px 0}.demo-quantity button{width:44px;text-align:center}.demo-quantity button:disabled{opacity:.5;cursor:default}progress{width:100%;accent-color:#99d2ff}button:focus-visible,a:focus-visible{outline:3px solid #ffda84;outline-offset:4px}@media(max-width:680px){.budget-demo{grid-template-columns:1fr;gap:24px}.demo-screen{padding:22px;min-height:0}}
</style>
