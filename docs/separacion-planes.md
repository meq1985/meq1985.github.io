# Separación de planes y contratación

- Básico (`presupuestos`): ARS 12.000/mes, presupuesto manual, catálogo editable, proyectos/versiones, promociones y PDF.
- Full (`croquis`): ARS 25.000/mes, todo lo anterior, editor de croquis, propuesta eléctrica y materiales.
- Prueba: 30 días con Full, hasta 10 proyectos; sin tarjeta ni renovación automática. Los planes pagos permiten 100 proyectos; todos salvo administrador tienen 10 guardados por 24 horas.
- Administrador: acceso completo sin suscripción.

## Permisos

La pantalla y el servicio de guardado aplican la misma política. Firestore vuelve a verificar el plan y el vencimiento con la hora del servidor: un cliente manipulado no puede crear ni cambiar el JSON del croquis en Básico. Puede conservar exactamente el croquis de la última versión al editar el presupuesto manual. Las versiones antiguas siguen legibles/descargables incluso al vencer. La edición del croquis y sus cálculos son funciones del Full; los cálculos se ejecutan en el navegador, por lo que no constituyen una API privada del servidor.

La suscripción activa prevalece sobre una prueba todavía vigente. Un checkout autorizado o pendiente no cuenta como pago. Solo pagos aprobados con vendedor, comprador de prueba (en modo test), moneda, importe y suscripción verificados activan el plan registrado por el servidor. No se acepta un importe ni un plan efectivo enviados por el cliente para conceder acceso.

## Contratación

Cada plan tiene su propio consentimiento con precio y renovación. El servidor conserva fecha, plan, importe y versión de condiciones. Retomar un checkout solo permite el plan originalmente elegido. Las operaciones de una cuenta se serializan; una respuesta perdida se recupera por referencia y nunca provoca otro POST a ciegas.

No se permiten mensualidades solapadas: cancelar la renovación conserva el período pagado, y el cambio de plan se realiza después de su vencimiento. Un checkout pendiente puede cancelarse y luego elegirse otro. No hay prorrateo ni cambio inmediato con cobro de diferencias.

Cada período aprobado conserva su plan en el registro privado. Las notificaciones duplicadas no alargan períodos ni transforman un pago Básico en Full. Cancelación conserva el período, rechazo/reversión no concede acceso, y una renovación válida mantiene su propio período aunque se revierta uno anterior. Los registros históricos sin plan explícito se interpretan como Básico.

## Publicación y verificación

Los cobros reales siguen apagados: este cambio no modifica `configuracion/facturacion`, credenciales, `MP_MODE` ni la cuenta QA. Se requiere publicar conjuntamente reglas, funciones y frontend después de revisión. El workflow de Hosting no publica funciones/reglas. Mantener `MP_MODE=test` y ambos indicadores comerciales en falso; comprobarlos antes y después de desplegar. No habilitar pagos reales como parte de esta publicación.

Las pruebas usan `demo-presupuesto-electrico` y un proveedor simulado: no crean usuarios de producción ni hacen pagos o devoluciones reales. La validación en el checkout externo de Mercado Pago para Full queda para una prueba privada autorizada con comprador ficticio antes de habilitar cobros reales.

Validación local: 213 pruebas de aplicación, 25 de Auth/Firestore, 14 unitarias de servidor y 16 escenarios de integración de facturación (17 entradas contando el grupo padre), todos correctos. Build y prerender de seis páginas correctos. Se verificó solo en lectura que `billingEnabled=false` y `checkoutAvailable=false` en producción.
