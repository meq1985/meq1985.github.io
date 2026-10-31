<script setup>
import BrandMark from '../components/BrandMark.vue';
</script>

<template>
  <main class="not-found">
    <a class="not-found-brand" href="/" aria-label="Electricista Xpress, inicio"><BrandMark /><span>Electricista <strong>Xpress</strong></span></a>
    <section aria-labelledby="not-found-title">
      <p class="not-found-code">404 · PÁGINA NO ENCONTRADA</p>
      <h1 id="not-found-title">Esta conexión no lleva a ninguna página.</h1>
      <p>El enlace puede haber cambiado o la dirección puede estar incompleta. Podés volver al inicio o entrar a tus proyectos.</p>
      <nav aria-label="Continuar navegando"><a class="not-found-primary" href="/">Volver al inicio</a><a href="/proyectos">Ir a mis proyectos →</a></nav>
    </section>
  </main>
</template>

<style scoped>
:global(body){margin:0}
.not-found{box-sizing:border-box;min-height:100vh;margin:0;padding:clamp(24px,6vw,80px);background:#101720;color:#eef4fb;font-family:system-ui,sans-serif}
.not-found-brand{display:inline-flex;align-items:center;gap:14px;text-decoration:none;color:inherit;font-size:20px}
.not-found section{max-width:700px;margin:clamp(70px,12vh,150px) auto}
.not-found-code{color:#82b7f5;font-size:13px;font-weight:700;letter-spacing:.12em}
.not-found h1{font-size:clamp(32px,6vw,54px);line-height:1.12;letter-spacing:-.035em}
.not-found section>p:last-of-type{max-width:590px;color:#b6c2d1;font-size:18px;line-height:1.65}
.not-found nav{display:flex;flex-wrap:wrap;align-items:center;gap:24px;margin-top:32px}
.not-found nav a{color:#d7e8ff;font-weight:650;text-underline-offset:5px}
.not-found nav .not-found-primary{padding:15px 22px;border-radius:10px;background:#2475b9;color:white;text-decoration:none}
.not-found a:focus-visible{outline:3px solid #94c7ff;outline-offset:6px}
</style>
