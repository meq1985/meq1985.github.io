# Migración a Firebase Hosting

Se prepara desde main publicado, separada del PR de suscripciones. No activa pagos ni límites comerciales.

Sitio definitivo elegido: electricistaxpress (https://electricistaxpress.web.app). El proyecto y los datos siguen en el proyecto Firebase existente.

## Pruebas y despliegue

- npm test y npm run build.
- firebase emulators:exec --project demo-presupuesto-electrico --only hosting "node scripts/check-hosting.mjs": verifica portada, rutas Vue cargadas directamente y recurso JavaScript compilado. No ejecuta escrituras de datos de producción.
- La configuración declara cabeceras de seguridad, entrada sin caché y recursos con hash inmutables. El emulador local no devolvió las cabeceras configuradas; ya se verificaron de forma explícita en la vista previa real, sin presentar la prueba local como verificación de esas cabeceras.
- El workflow de vista previa usa el secreto de despliegue de Firebase ya configurado en el repositorio. Publica el canal temporal migration con vencimiento a 7 días; no sustituye el sitio live.
- Antes de promover: verificar cabeceras, portada, carga directa de rutas, ingreso de administrador, catálogo, proyectos y PDF. Cambiar dominio requiere verificar también dominios autorizados de Auth, redirecciones de acceso y futuras URLs de Mercado Pago.

## Facturación y transición

El titular debe crear y vincular personalmente la cuenta de facturación para Blaze, aceptando los cargos por consumo. Las cuotas gratuitas no garantizan una factura cero. Configurar alertas y revisar el alcance de los límites de cada servicio; una alerta no es un tope global.

No borrar el sitio de Netlify durante la transición. No comprar dominio ni asumir disponibilidad de marca. Nombre de trabajo elegido por el titular: Electricista Xpress. No implica disponibilidad de marca o de dominio propio.

El sitio Firebase existente tiene una publicación antigua: primero probar el canal temporal, después actualizar live. La CLI local no tiene sesión; el workflow intenta usar la credencial de despliegue existente. Si está vencida o no tiene permisos, renovar la configuración mediante autorización del titular sin copiar claves al chat ni al repositorio.
