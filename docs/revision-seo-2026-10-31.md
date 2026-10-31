# Revisión SEO — 31 de octubre de 2026

Sitio consultado: https://electricistaxpress.com.ar/. Se consultaron su HTML, una URL inexistente, robots.txt, sitemap.xml, DNS públicos y negociación TLS/HTTP2. Evidencia local: outputs/seo-live-audit-2026-10-31.json (fuera del repositorio). No se modificó producción ni DNS.

| Aviso | Resultado y decisión |
| --- | --- |
| 404 personalizada | Confirmado: una dirección inexistente respondía 200 con la portada. Se agrega NotFoundView para navegación interna y dist/404.html estático con noindex para Hosting. Se reemplaza el rewrite universal por rutas conocidas. El error carga sin JavaScript ni Firebase Auth. |
| SPF | No hay SPF, MX ni DMARC publicados en las consultas realizadas. El contacto actual es Hotmail. El titular consultó por crear correo del dominio: definir primero el proveedor/forma de envío; no publicar un SPF arbitrario que pueda bloquear mensajes legítimos. No se activó correo ni un servicio pago. |
| Descripción larga | El checker indicó 165; el HTML público consultado contiene 159 caracteres. Se deja una descripción de 155, consistente en HTML inicial, prerender y navegación. Google no establece un límite fijo de 160: el recorte depende del espacio disponible. |
| JavaScript antiguo | Se verificó una entrada type=module y ausencia de configuración de bundle legacy/nomodule. El código de compatibilidad de bibliotecas no demuestra que toda la web se sirva como ES5. El PDF y sus bibliotecas se importan cuando se genera. Falta el archivo y fragmento exacto señalado por el checker para decidir si se puede eliminar código de compatibilidad sin romper funciones. No se cambió el soporte de navegadores solo para mejorar la puntuación. |
| Preload | Se precarga con modulepreload el módulo de cada página pública conocida, usando el manifiesto de Vite. Antes se descubría después de inicializar el router. Los estilos se enlazan en el HTML inicial. No se precargan PDF, gráficos inexistentes ni recursos de cuenta que el visitante podría no usar. |
| Imágenes sin lazy loading | La portada pública devuelve cero etiquetas img. Sus dibujos y logo son SVG insertados en el HTML; no tienen una descarga de imagen que diferir. No se agrega lazy loading ficticio ni se retrasa el contenido principal. |
| HTTP/2 | Comprobado en producción: ALPN negoció h2 y las solicitudes se realizaron con HTTP/2. El aviso no se reprodujo. El emulador local usa HTTP/1.1; no representa el protocolo del sitio publicado. |
| Correos en texto | Intencional: contacto público y gestión de solicitudes. Puede facilitar spam; no se oculta información de contacto ni se dificulta el acceso sin JavaScript para satisfacer el checker. El formulario o un correo de dominio pueden evaluarse por separado. |
| Microdata ausente | La portada contiene SoftwareApplication en JSON-LD, formato recomendado por Google y alternativo a Microdata. No hace falta duplicarlo. Se sincroniza también al navegar: se agrega al volver al inicio y se retira de páginas legales, privadas y errores. No se inventan reseñas ni certificaciones. |

Se fija una estrategia común de identificadores CSS de Vue para que el HTML prerenderizado y los estilos compilados coincidan. Esto se verifica en la 404; también beneficia las páginas legales antes de arrancar JavaScript.

## Pruebas

215 pruebas de aplicación, build y prerender correctos. El emulador de Firebase Hosting verificó 18 rutas: las válidas conservan respuesta 200; las inexistentes, incluidas rutas profundas y archivos ausentes, responden 404 con el diseño propio. Se verificaron noindex, ausencia de canonical/datos estructurados/entrada JS en errores, existencia del módulo precargado y coincidencia de estilos con el HTML generado. Inspección visual de la página de error en el navegador. Se incorpora la comprobación de Hosting al workflow del PR.

Antes de publicar, repetir esta comprobación en Hosting de vista previa; después verificar estado 404 y el resto de rutas en el dominio real. El SPF queda pendiente de la elección de correo. No hay garantía de una puntuación determinada ni de resultados enriquecidos por estos cambios.

## Referencias oficiales

- Firebase Hosting, 404 y prioridad de archivos/rewrite: https://firebase.google.com/docs/hosting/full-config
- Google, descripción y recorte de snippets: https://developers.google.com/search/docs/appearance/snippet
- Google, formatos de datos estructurados: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Chrome, precarga de recursos críticos: https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preload
- web.dev, efectos de lazy loading: https://web.dev/articles/lcp-lazy-loading
- Cloudflare, correo y autenticación DNS: https://developers.cloudflare.com/dns/manage-dns-records/how-to/email-records/
- Cloudflare, reenvío y envío: https://developers.cloudflare.com/email-service/
