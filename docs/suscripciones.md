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

## Cobro: pendiente de conectar y verificar

Esta entrega no crea suscripciones en Mercado Pago, no procesa tarjetas, no contiene credenciales y no ejecuta cargos. Los botones de contratación están deshabilitados y explican su estado. No debe activarse el límite comercial hasta tener un medio de contratación probado, salvo una prueba local deliberada.

Siguiente etapa: implementar y probar el servidor de Mercado Pago con credenciales de prueba. Mantener las claves fuera de Vite y del repositorio. El servidor debe validar Firebase ID tokens, fijar ARS y el precio del plan, controlar solicitudes repetidas y consultar pagos reales antes de escribir suscripciones/{uid}. Procesar aprobación, rechazo, renovación, cancelación, reembolso y notificaciones duplicadas o desordenadas. No activar planes ni registrar clientes reales durante las pruebas.

Las credenciales y el circuito de prueba del vendedor deben configurarse en el servidor elegido; nunca deben pegarse en el chat. Conectar Mercado Pago no resuelve automáticamente la facturación fiscal.

Fuentes: https://www.mercadopago.com.ar/developers/es/docs/subscriptions/overview y https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks

## Costos y publicación

Este código usa las consultas y transacciones de Firestore existentes; agrega lecturas de configuración, asignación y suscripción. En Spark se aplican sus cuotas gratuitas, sin prometer capacidad ilimitada. No habilita Blaze, Firebase Storage, Functions, tarjetas de facturación ni recargas automáticas.

El servidor de pagos futuro puede consumir recursos: Firebase Cloud Functions requiere Blaze; Netlify Functions depende del plan real y sus límites. Antes de elegirlo, revisar y aprobar ese costo potencial. Mercado Pago cobra comisión por mensualidad según cuenta y plazo de disponibilidad. Dominio, correo externo, respaldos y servicios de facturación pueden sumar costos si se incorporan.

Publicar primero las reglas y luego la interfaz, manteniendo enabled ausente o false durante la preparación. La limpieza de usuarios en producción es una operación distinta y requiere verificar que se preserve el administrador, sus proyectos, su perfil, sus precios y costos/codigos.
