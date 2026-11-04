# Captación y medición — 4 de noviembre de 2026

## Decisiones confirmadas
- Contacto y envío desde la aplicación de correo: meq1985@hotmail.com. No se contrata correo de dominio. Microsoft administra SPF/DKIM/DMARC de hotmail.com; no se copian registros de Hotmail al DNS de electricistaxpress.com.ar. El dominio no tiene proveedor de correo saliente autorizado por esta tarea.
- GA4 opcional y métricas internas. Sin testimonios hasta recibir textos reales y autorización para publicarlos.
- Cobros reales deshabilitados. Este cambio no habilita checkout ni utiliza claves productivas.

## Google Analytics
Cuenta existente Default Account for Firebase (293210139), nueva propiedad Electricista Xpress (562386947), flujo web 16272952489, etiqueta pública G-J2R5497R0F. No se modifica la propiedad iaintegrationweb.

La etiqueta solo carga con permiso explícito y en el dominio canónico. No se envían pings antes de aceptar o tras rechazar. Se puede retirar el permiso; se eliminan las cookies GA accesibles y se recarga para descargar la etiqueta. La preferencia se sincroniza entre pestañas. Sin publicidad, Google Signals, User-ID, enlaces automáticos, formulario automático, query strings, fragmentos ni rutas privadas. Medición mejorada desactivada en la consola; verificar que siga así si alguien cambia la configuración de GA.

Eventos: page_view (solo páginas públicas predefinidas), trial_interest (clic principal), trial_start (primer acceso verificado que inicia prueba), project_saved (nuevo proyecto confirmado; no se presenta como usuario único), begin_checkout (URL válida de Mercado Pago recibida). Solo se permite el parámetro plan con valores presupuestos/croquis. No se emite purchase desde el navegador. El checkout no es una venta. Rechazo, bloqueadores y múltiples dispositivos hacen que GA sea parcial.

Conservación de eventos y usuarios: dos meses, sin renovar por actividad. Informes agregados de Google pueden tener otros ciclos de conservación. Cookies configuradas por hasta 60 días. Deben revisarse las opciones del proveedor antes de cambiar estos plazos.

## Métricas internas
acquisitionAccounts/{uid}: solo servidor, marcas numéricas por hito para deduplicar; sin correo, IP, presupuesto ni datos de clientes. Se conserva para no contar una misma cuenta repetidamente; atender supresión junto con el resto de los datos de cuenta según las obligaciones aplicables.

acquisitionDays/{fechaUTC}: resúmenes por día UTC. Solo administradores verificados pueden consultar, con límite de 31 documentos. El panel en Planes requiere consulta explícita, sin listeners ni sondeo.

- registrations: createUser efectivamente creó una cuenta nueva desde el registro protegido. Un correo ya existente no cuenta ni se revela en la respuesta pública. La medición no puede hacer fallar un registro exitoso; un error en ese registro puede dejar el hito sin contabilizar (no se promete exactitud contable).
- trials: creación confirmada del acceso verificado (evento Firestore).
- firstProjects: primer proyecto efectivamente persistido (evento Firestore).
- firstSubscriptions: primer período válido de un pago real aprobado en Mercado Pago; nunca pagos de prueba ni clics. No es ingreso neto ni saldo de suscriptores activos: no descuenta devoluciones ni bajas.

Cada hito se cuenta una sola vez por UID en una transacción. Se excluyen administradores y cualquier documento billingTesters, aunque esté deshabilitado. Solo cuentas registradas después de activar esta medición; no hay reconstrucción histórica ni lectura masiva de usuarios. Los hitos diarios no son cohortes ni tasas de conversión comparables automáticamente.

## Operación y posible consumo
No hay endpoint público para enviar eventos internos arbitrarios. Dos funciones reciben eventos de creación en Firestore: accesos y proyectos; región southamerica-east1, minInstances 0, maxInstances 1, concurrencia 5, reintentos idempotentes. Deben desplegarse junto con las reglas y el frontend antes de contar como implementación activa.

GA4 estándar no requiere un plan pago. Firebase añade invocaciones/Eventarc y lecturas: hasta tres lecturas iniciales por evento, y para un hito nuevo una lectura de resumen y dos escrituras. Cada proyecto nuevo dispara una comprobación aunque ya exista el primer hito. Puede consumir cuota y generar cargos en Blaze; no existe tope de gasto. No se habilitan estos despliegues en esta tarea de preparación. Mantener las alertas de consumo aprobadas.

## Search Console
Verificación por TXT DNS, sin OAuth de acceso general a Cloudflare. Propiedad de dominio verificada por TXT en Cloudflare el 4/11/2026 con emanuelquiroga.bgh@gmail.com, con autorización explícita del titular. Conservar ese TXT para mantener la verificación. Sitemap enviado y procesado correctamente el 4/11/2026: Google confirmó la lectura y seis páginas descubiertas. El sitemap y robots.txt públicos responden HTTP 200 (application/xml para el sitemap). La advertencia inicial desapareció al procesarlo; descubrir páginas no garantiza su indexación ni posición. Sitemap objetivo: https://electricistaxpress.com.ar/sitemap.xml. El dominio ya está verificado; los datos de búsqueda pueden tardar en aparecer. Evento trial_start marcado como clave en GA4, sin valor monetario predeterminado.

## Testimonios
No mostrar placeholders como opiniones reales. Para incorporar uno: recibir texto aprobado, nombre o alias autorizado y alcance del permiso; conservar evidencia privada y una vía para retirarlo por Hotmail. No publicar datos de contacto ni resultados económicos sin autorización específica. No se enviaron mensajes solicitando testimonios.

## Referencias
- https://developers.google.com/tag-platform/security/guides/consent
- https://developers.google.com/analytics/devguides/collection/ga4/views
- https://support.google.com/analytics/answer/6366371
- https://support.google.com/webmasters/answer/9008080
- https://firebase.google.com/docs/functions/firestore-events
