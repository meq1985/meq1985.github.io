# Operación y preparación comercial — 3 de noviembre de 2026

## Alcance de esta entrega

El detalle de suscripción distingue contratación iniciada, aprobación de un pago, débito programado por Mercado Pago y fin de acceso abonado. No se deriva la próxima fecha de cobro del vencimiento. Fechas ausentes se informan como tales. La autorización de una suscripción no otorga un período pagado: solo los pagos aprobados y validados por el servidor. Un rechazo de renovación no retira un período anterior todavía vigente.

El historial es una proyección acotada por usuario en suscripciones/{uid}/pagos: estado, plan, importe, moneda y fechas, sin pagador, tarjeta ni respuesta del proveedor. Se consulta bajo demanda de a 20, con cursor; las reglas impiden leerlo desde otra cuenta y prohíben escrituras del cliente. Los historiales anteriores se completan al reconciliar contra el proveedor, no se inventan fechas ni se ejecuta un backfill productivo en esta entrega.

## Operación autorizada

Configuración declarada en ops/firebase-operations.json para presupuesto-electrico, base (default), southamerica-east1:

- Copia nativa de Firestore diaria; retención de siete días. La primera copia no existe por el solo hecho de crear el calendario. Revisar su estado después de la primera ejecución.
- TTL solo sobre registrationLimits.expiresAt, usado en contadores IP temporales con caducidad de siete días. No borra Authentication, proyectos, perfiles, precios, pagos ni gestiones. El contador global carece de ese campo y se conserva. El TTL es asíncrono y no garantiza borrado al segundo exacto.
- Alertas para errores del servidor y nuevas gestiones de consumo, más uso Firestore de 40.000 lecturas o 15.000 escrituras en una ventana de 24 h. Correo del responsable. No son topes de gasto ni cubren todas las fuentes de consumo.
- Se mantienen 30 días de logs; no se amplía la retención. Los mensajes nuevos de error usan eventos estáticos y no incluyen credenciales, correos, direcciones IP ni respuestas del proveedor.
- Se conservan las alertas de presupuesto USD 1, 3 y 5 previamente autorizadas. No hay apagado automático de Firebase.

Costos: backups, restauraciones y borrados TTL no usan la cuota gratuita de Firestore; dependen de tamaño, región y consumo. Las alertas de Monitoring tienen condiciones tarifarias futuras anunciadas desde septiembre de 2027. No se garantiza un máximo mensual. No se activa PITR, monitores sintéticos ni métricas personalizadas.

## Supervisión y recuperación

Al recibir error: revisar el evento en Logs Explorer, Functions/Cloud Run y el estado del proveedor; no copiar secretos o cuerpos financieros a tickets. Si falla un webhook, Mercado Pago debe poder reintentar. No habilitar acceso por una URL de retorno ni por una captura de pago. Reconciliar desde la cuenta y verificar fechas/estados.

Ante consumo alto: comprobar lecturas/escrituras, tráfico de Hosting, instancias y registros; revisar cuota y alertas de facturación. Si hay abuso, usar configuracion/seguridad.pauseWrites=true para pausar escrituras no administradoras y revisar el alta protegida. Esa pausa no bloquea lecturas, Hosting ni todos los costos.

Ante pérdida de datos: detener escrituras, identificar el backup anterior al incidente por fecha y estado, restaurar primero en una base aislada autorizada, comprobar proyectos/versiones, perfiles, catálogo, accesos y metadatos de facturación. No restaurar encima de la base activa ni reactivar suscripciones basándose solo en la copia: contrastar con Mercado Pago. La restauración usa una base nueva, puede generar costos y necesita un plan de corte y autorización de escritura/migración. Esta entrega no realiza una restauración de producción ni afirma haber probado una copia aún no generada.

Firestore no respalda por sí solo usuarios de Authentication, Secret Manager, DNS, Hosting, reglas o configuración de Mercado Pago. Conservar Git/CI y las configuraciones operativas; revisar retención de versiones de secretos y el procedimiento administrativo de recuperación de cuentas. No exportar contraseñas, hashes ni claves al repositorio. Un backup de Firestore no equivale a recuperación integral de toda la plataforma.

## Bajas y arrepentimientos

Los enlaces de la portada están visibles desde el primer acceso y llevan a /gestiones, sin requerir inicio de sesión. El formulario protegido registra el pedido y entrega inmediatamente un código y comprobante descargable por el mismo canal. La referencia y el mensaje son opcionales; no exige documentos ni tarjetas. El correo continúa como alternativa.

La administración consulta las solicitudes en Planes. Estados: recibida, en gestión y resuelta. Cambiar ese estado no cancela una suscripción ni ejecuta una devolución. Pasos del responsable:

1. Revisar la bandeja de gestiones y el correo cada día; las alertas ayudan, no sustituyen la revisión.
2. Confirmar la correspondencia con el titular por medios razonables; no cancelar una cuenta ajena basándose solo en un formulario anónimo.
3. Para baja, detener la renovación en la suscripción correcta de Mercado Pago y verificar la confirmación/reconciliación; conservar el período abonado y los proyectos.
4. Para arrepentimiento, revisar fecha y alcance del derecho aplicable, comunicar y ejecutar la devolución que corresponda; no asumir que cancelar renovación devuelve un pago.
5. Responder por el canal pertinente, conservar la constancia y marcar resuelta solo cuando la gestión se haya completado. Las solicitudes por correo deben recibir su código identificador dentro de 24 h. La pantalla entrega el código del formulario al registrarlo.

Identificación publicada: Martin E. Quiroga, CUIT 20-31509073-4, Yaktemi 966, Río Grande, Tierra del Fuego, Argentina, CP 9420; meq1985@hotmail.com. Domicilio confirmado por el titular para esta finalidad.

Revisión normativa: Disposición 954/2025 y aclaración 3/2026 sobre mecanismos razonables de verificación; Ley 24.240 y Código Civil y Comercial para derechos aplicables. No se presenta esta revisión técnica como dictamen jurídico. Antes de vender resta la revisión fiscal del comprobante/factura que corresponda y obligaciones del responsable ante ARCA/AAIP según su actividad; no se inventa una inscripción o certificación.

## Publicación

Los cambios de interfaz, reglas y funciones se entregan para revisión; requieren desplegarse coordinadamente, con reglas antes de la nueva lectura de historial. El formulario requiere la función submitConsumerManagement y el secreto Turnstile ya configurado. El widget usa la acción consumer_request, separada de signup. Los cobros reales permanecen deshabilitados y las claves reales no se vinculan automáticamente a funciones. Publicar esta entrega no autoriza activar cobros ni cambiar precios de contratos existentes.

Fuentes oficiales:
- https://firebase.google.com/docs/firestore/backups
- https://firebase.google.com/docs/firestore/ttl
- https://firebase.google.com/docs/firestore/pricing
- https://cloud.google.com/products/observability/pricing
- https://www.mercadopago.com.ar/developers/es/reference/online-payments/subscriptions/get-preapproval/get
- https://www.argentina.gob.ar/normativa/nacional/disposicion-954-2025-417152/texto
- https://www.argentina.gob.ar/normativa/nacional/disposicion-3-2026-423007/texto
