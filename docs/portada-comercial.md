# Portada comercial y SEO

La portada prioriza presupuestos con precios propios y PDF profesional para electricistas independientes de Argentina. El croquis es el segundo argumento. Los precios siguen en ARS 12.000 y 25.000; este cambio no modifica el catálogo comercial ni activa cobros.

## Ejemplo público

El ejemplo utiliza cantidades, importes y estructura de un proyecto proporcionado por el titular. Todas las identidades, CUIT, matrícula, contactos y dirección son ficticios. El archivo original no se incorpora al repositorio. El PDF público se genera con el mismo generador de la aplicación y lleva una leyenda de ejemplo.

Para regenerarlo: `node scripts/generate-sample-pdf.mjs`. Revisar visualmente el resultado antes de publicarlo. El resumen de la portada debe coincidir con ese PDF: 43 bocas, 120 m², tableros y alimentación, total ARS 3.916.000. La descarga se identifica como PDF de ejemplo con datos ficticios y valores ilustrativos. La portada no incluye una demostración interactiva; el bloque del croquis aparece antes de las seis tarjetas de herramientas.

## SEO y páginas públicas

Se incluyen metadatos iniciales, Open Graph, Twitter, JSON-LD sin reseñas ni ofertas inventadas, URLs canónicas y un sitemap limitado a inicio, condiciones y privacidad. Las rutas de cuenta llevan `noindex` en el navegador y en los encabezados de Firebase Hosting. Las reglas de autorización siguen protegiendo los datos; `noindex` no sustituye esa protección.

La URL canónica es `https://electricistaxpress.com.ar`. El dominio propio y `www` están conectados a Firebase Hosting; `www` redirige al dominio principal. Metadatos iniciales, servicio de SEO, sitemap y robots usan el dominio propio. Se conserva el acceso por `electricistaxpress.web.app` para mantener enlaces anteriores. Search Console y el prerenderizado de contenido público no forman parte de este cambio.

## Antes de publicar o vender

Este PR prepara la presentación de producto terminado solicitada por el titular. No publicar como lanzamiento comercial hasta completar los permisos Básico/Full y comprobar el circuito de contratación de ambos planes. Los indicadores comerciales de producción permanecen deshabilitados y el Full conserva su bloqueo de contratación. No se modifican funciones, reglas Firestore ni credenciales.

No se agregan testimonios hasta contar con opiniones reales y autorización. Las páginas de condiciones y privacidad describen las funciones y servicios existentes; el titular debe confirmar esos textos y los datos del responsable antes del lanzamiento comercial.
