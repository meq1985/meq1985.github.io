<template>
  <div class="landing-sketch">
    <div class="sketch-caption"><span>OBRA NUEVA · EJEMPLO</span><span>30 m²</span></div>
    <svg viewBox="0 0 460 260" role="img" aria-label="Ejemplo ilustrativo de dos ambientes con luminarias, tomas, tablero general, pilar y puesta a tierra">
      <defs><pattern id="landing-sketch-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#36506a" stroke-width="0.6" /></pattern></defs>
      <rect x="1" y="1" width="458" height="258" rx="8" fill="url(#landing-sketch-grid)" />
      <path d="M96 40H424V204H96Z M266 40V204" fill="#1b3349" stroke="#9acfff" stroke-width="2" />
      <text x="112" y="64" fill="#edf2f8" font-size="13">Estar / cocina</text><text x="282" y="64" fill="#edf2f8" font-size="13">Dormitorio</text>
      <g fill="#142333" stroke="#f3ce84" stroke-width="2"><circle cx="176" cy="120" r="12"/><path d="m168 112 16 16m-16 0 16-16"/><circle cx="344" cy="120" r="12"/><path d="m336 112 16 16m-16 0 16-16"/><circle cx="117" cy="181" r="9"/><path d="M114 176v10m6-10v10"/><circle cx="398" cy="181" r="9"/><path d="M395 176v10m6-10v10"/></g>
      <path d="M48 204H80V87H118" stroke="#83d9b8" stroke-width="2" stroke-dasharray="6 4" fill="none" />
      <g fill="#122538" stroke="#91cbff" stroke-width="2"><rect x="23" y="204" width="50" height="27" rx="5"/><rect x="118" y="75" width="34" height="25" rx="4"/><rect x="23" y="124" width="48" height="24" rx="4"/></g>
      <g fill="#edf2f8" font-size="11" text-anchor="middle"><text x="48" y="222">M + TP</text><text x="135" y="92">TG</text><text x="47" y="141">PAT</text></g>
      <text x="96" y="238" fill="#a9c4dc" font-size="11">Puntos, tableros y recorrido en un mismo croquis.</text>
    </svg>
    <p>Del dibujo a un borrador que podés revisar.</p>
  </div>
</template>
<style scoped>
.landing-sketch{border:1px solid #476683;border-radius:14px;padding:20px;background:#172635;min-width:0}.sketch-caption{display:flex;justify-content:space-between;gap:14px;font-size:11px;letter-spacing:1px;color:#99cfff;margin-bottom:16px}.landing-sketch svg{display:block;width:100%;height:auto}.landing-sketch p{font-size:13px;color:#b6c3d2;margin:16px 0 0}@media(max-width:680px){.landing-sketch{padding:12px}.sketch-caption{font-size:9px}}
</style>
