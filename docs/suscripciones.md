# Proyecto gratuito, planes mensuales y administración

## Primera entrega

- Un proyecto gratuito por cuenta verificada, sin días de vencimiento, tarjeta ni renovación automática. Sus ediciones y versiones no consumen proyectos adicionales.
- Presupuestos: ARS 12.000 por mes. Presupuestos + croquis: ARS 25.000 por mes, anunciado como próximo hasta implementar el croquis. Sin créditos.
- Administrador: la cuenta designada por el propietario, con correo verificado y un documento privado administradores/{uid} con enabled=true. Solo la consola o un servidor de confianza pueden asignarlo. Acceso completo a las funciones y proyectos propios sin suscripción. La excepción no da lectura a los datos privados de otras cuentas.
- Al necesitar otro proyecto se informa la suscripción y se enlaza a /planes. El editor conserva el borrador si el guardado falla. Antes de generar un PDF nuevo en modalidad limitada se guarda el proyecto, evitando generar presupuestos sin consumir el proyecto gratuito.

## Protección de Firestore

configuracion/facturacion.enabled controla la activación. Ausente o false: acceso actual disponible durante la preparación. No se modifica ese documento de producción desde esta entrega.

accesos/{uid} contiene freeProjectId y claimedAt. Se crea una sola vez, junto al primer guardado del proyecto, en una transacción. Las reglas exigen un proyecto propio existente al finalizar la operación; nadie puede modificar o borrar esta asignación. Dos pestañas compiten por el mismo documento y solo una puede reservar el proyecto gratuito.

suscripciones/{uid} se consulta solo por su titular y nunca admite escrituras del cliente. Para habilitar proyectos adicionales requiere planId=presupuestos, status=active y paidThrough (timestamp) posterior al reloj de Firestore. No basta con regresar de un checkout ni con que Mercado Pago autorice una suscripción. El plan croquis todavía no habilita acceso pago.

Las reglas protegen tanto la creación de proyectos como nuevas versiones. Una suscripción vencida conserva lectura de proyectos anteriores; se puede seguir editando el proyecto gratuito. Los guards y el reloj del navegador no conceden permisos. Los clientes solo pueden consultar su propio registro de administrador; no pueden crearlo ni modificarlo. Ningún campo admin en el perfil concede acceso especial.

## Servidor de Mercado Pago: implementado, pendiente de validación con el proveedor

functions/ contiene Cloud Functions de segunda generación, Node 22. createSubscription, refreshSubscription y cancelSubscription son callable y exigen Firebase Authentication con correo verificado. El webhook mercadoPagoWebhook usa una URL independiente del dominio del frontend. Ninguna función se despliega por fusionar este PR. No se habilitan límites ni cobros en producción desde el repositorio.

El importe, la moneda, la frecuencia y el plan se fijan en el servidor: ARS 12.000 mensuales, sin plan croquis. El cliente debe confirmar la renovación mensual y completar el pago en el checkout de Mercado Pago. No se procesan ni guardan tarjetas en la aplicación. El administrador no puede contratar por accidente.

Antes de operar, el servidor consulta /users/me con el token y valida el vendedor, el sitio MLA y la etiqueta test_user. MP_MODE=test rechaza credenciales de vendedores reales, y MP_MODE=live rechaza vendedores ficticios. No se determina el entorno por el prefijo TEST o APP_USR: el panel actual puede entregar un token APP_USR para una cuenta ficticia. Confirmar esta respuesta también con el proveedor antes de desplegar.

Un bloqueo transaccional por cuenta serializa creación, consulta, cancelación y notificaciones. La referencia opaca se guarda ANTES de crear la suscripción. Solicitudes repetidas retoman el checkout pendiente. Una respuesta perdida se recupera buscando la referencia; si el resultado es ambiguo, se bloquea otra creación para revisión manual. No se presupone que Mercado Pago garantiza idempotencia de POST /preapproval. Una suscripción vigente impide crear otra.

Las notificaciones exigen firma HMAC y solo disparan consultas autenticadas al proveedor. El receptor no confía en importe, estado o usuario del cuerpo. Verifica suscripción propia, referencia, vendedor, ARS, importe y entorno; consulta la factura recurrente y el pago real. Guarda un período por factura y calcula el acceso desde la fecha de débito programada más un mes calendario. Notificaciones duplicadas no suman meses; pagos pendientes, rechazados, reembolsos incluso parciales y contracargos no conceden período. Una cancelación detiene renovaciones y conserva los períodos ya pagados. El cliente puede consultar nuevamente al volver del checkout; la URL de retorno no concede acceso.

Los registros billingCheckouts, billingBindings, billingPayments, billingAccounts, billingLocks y billingTesters son exclusivos del servidor y quedan denegados al cliente por las reglas. El frontend solo consulta suscripciones/{uid}, que no contiene tokens ni datos de tarjeta. Las notificaciones se reconsultan dentro del bloqueo para evitar que una copia anterior revoque un reembolso nuevo. Las respuestas fallidas del proveedor no se vuelcan a los logs.

Limitaciones antes de habilitar producción:

- Confirmar con una suscripción de prueba real que notification_url se acepta, que llegan los tópicos y que incluyen la firma/configuración esperada. La documentación de MP distingue suscripciones de la configuración general de Webhooks; NO se admite un evento sin firma como atajo. Si el flujo real usa IPN sin firma, adaptar la integración de forma explícita y volver a probar antes de habilitarla.
- El checkout ficticio confirmó que los pagos de suscripciones devuelven live_mode=true incluso con vendedor y comprador ficticios. En modo test se exige vendedor verificado con test_user y coincidencia exacta del correo del pagador con el comprador ficticio privado; no se deduce el entorno solamente de live_mode. Verificar init_point y collector_id con las credenciales correctas. No usar tarjetas ni fondos reales en esta etapa.
- Probar primera aprobación, rechazo, repetición, renovación, cancelación y reembolso de punta a punta, además de pérdida de notificación y recuperación manual. Las pruebas locales actuales simulan la API de MP y no sustituyen estas comprobaciones.
- La reconciliación pagina el historial de facturas de cinco en cinco (tamaño verificado con la API), con un límite de seguridad de 5.000 registros; un historial mayor requiere mantenimiento. No hay un trabajo periódico de conciliación todavía. El usuario puede actualizar el estado y MP reintenta webhooks fallidos; se debe definir supervisión/conciliación antes de operar a escala.
- Configurar alertas de errores/costos y revisar la política comercial/fiscal antes de activar renovaciones reales.

Las credenciales y el circuito de prueba del vendedor deben configurarse en el servidor elegido; nunca deben pegarse en el chat. Conectar Mercado Pago no resuelve automáticamente la facturación fiscal.

Fuentes: https://www.mercadopago.com.ar/developers/es/docs/subscriptions/overview y https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks

## Costos y publicación

El proyecto ya utiliza Blaze. Además de lecturas/escrituras de Firestore, desplegar el servidor puede generar consumo de Cloud Functions/Cloud Run, Cloud Build, Artifact Registry, red y Secret Manager. Cada función tiene minInstances=0 y maxInstances=2; esto no es un tope de facturación del proyecto. Los webhooks y las reconciliaciones también consumen recursos. Configurar alertas de presupuesto; una alerta no detiene por sí sola el gasto.

Mercado Pago cobra comisión por mensualidad según cuenta y plazo de disponibilidad. Dominio, correo externo, respaldos y servicios de facturación pueden sumar costos si se incorporan. Netlify queda fuera del circuito: ignore-netlify-build.cjs cancela TODOS sus builds automáticos cuando reciba esta configuración. Solo se publican cambios en Firebase.

Publicar primero las reglas y luego la interfaz, manteniendo enabled ausente o false durante la preparación. La limpieza de usuarios en producción es una operación distinta y requiere verificar que se preserve el administrador, sus proyectos, su perfil, sus precios y costos/codigos.

## Configuración y despliegue separado

1. Guardar MP_ACCESS_TOKEN y MP_WEBHOOK_SECRET exclusivamente en Google Secret Manager del proyecto de destino, mediante Firebase CLI functions:secrets:set o la consola. Nunca VITE_*, GitHub, commits, chat, capturas ni logs. Los .env y .secret de functions/ están ignorados.
2. Parámetros no secretos: MP_MODE=disabled (predeterminado), test (solo billingTesters/{uid}.enabled=true) o live; APP_ORIGIN=https://electricistaxpress.web.app; MP_COLLECTOR_ID del vendedor del entorno; MP_WEBHOOK_URL=https://us-central1-presupuesto-electrico.cloudfunctions.net/mercadoPagoWebhook. Para pruebas aisladas usar otro proyecto Firebase o los emuladores; una prueba en el proyecto real requiere cuentas ficticias específicamente autorizadas.
3. El workflow manual firebase-billing-manual.yml permite únicamente disabled o test. Usa el environment firebase-billing (configurar aprobación de despliegue), sus variables APP_ORIGIN/MP_COLLECTOR_ID y el secreto de despliegue existente. Requiere permisos de despliegue Functions/Cloud Run y acceso a los secretos para el runtime. Revisar IAM con el titular; no otorgar Owner/Editor ni publicar claves. No hay ampliaciones de permisos automáticas.
4. Desplegar primero Functions y reglas, verificar el endpoint real y configurar la URL en MP. Completar las pruebas con comprador/vendedor ficticios. Mantener configuracion/facturacion.enabled y checkoutAvailable ausentes o false.
5. Solo después de revisión y autorización del titular: credenciales de producción, MP_MODE=live y ambos flags enabled=true/checkoutAvailable=true. El workflow de prueba no permite esta activación. Confirmar el acceso del administrador y la asignación del proyecto gratuito antes de habilitar la interfaz.

## Cambio de dominio

En modo test, cada registro privado billingTesters/{uid} necesita payerEmail del comprador ficticio de Mercado Pago (dominio testuser.com). Esta dirección se configura solo en el servidor: el correo de Firebase puede ser distinto y ningún correo enviado por el cliente sustituye esta configuración. La consulta del estado y la cancelación siguen disponibles aunque falte el comprador. En modo live se utiliza el correo verificado de Firebase sin este reemplazo.

Actualizar APP_ORIGIN y redesplegar Functions modifica back_url para NUEVAS suscripciones; la URL de notificaciones permanece fija en cloudfunctions.net. Agregar el dominio al Hosting y a Authentication. Conservar electricistaxpress.web.app y las antiguas direcciones de retorno para checkouts ya creados o actualizar sus back_url en MP de forma controlada. No cambiar de vendedor ni proyecto Firebase. Cambiar el dominio del frontend no migra automáticamente la configuración de suscripciones existentes.

## Pruebas reproducibles

- npm test y npm run build en la raíz.
- npm ci --prefix functions --ignore-scripts y npm test --prefix functions (Node 22).
- Ejecutar tests/emulator con firebase.emulators.json y proyecto demo-presupuesto-electrico.
- Con GCLOUD_PROJECT=demo-presupuesto-electrico y Firestore Emulator en 127.0.0.1:8080: node --test functions/emulator-test/billing.test.js. La suite rechaza otros proyectos/hosts y sustituye toda la API de Mercado Pago por un simulador sin red real. Valida concurrencia, recuperación de respuesta perdida y ciclo de pagos/cancelación/reembolso.
