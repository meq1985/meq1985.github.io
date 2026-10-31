# Presupuesto como documento comercial

## Datos de la propuesta

El detalle agrega un bloque compacto de datos y condiciones, disponible tanto en Básico como en Full y prueba. Las propuestas nuevas reciben una referencia editable basada en el identificador de proyecto, fecha de emisión del calendario argentino y vigencia inicial de 15 días, editable de 0 a 365; 0 omite el vencimiento. La referencia identifica el proyecto, no constituye numeración fiscal ni un contador correlativo. Las versiones guardadas se identifican también en el PDF; una descarga administrativa con cambios sin guardar no se presenta como una versión guardada.

Dirección de obra, alcance, exclusiones, plazo estimado y condiciones de pago son opcionales. No se agregan cláusulas automáticas en esos campos. Los textos largos se despliegan para mantener compacta la pantalla. Se puede desactivar la inclusión de condiciones; al volver a activarlas durante esa edición se recupera el borrador ingresado.

## Anticipo

Por decisión del titular se calcula sobre el importe al contado después del descuento. Ejemplo: mano de obra ARS 1.000, descuento al contado 10 %, anticipo 30 % = ARS 270; saldo ARS 630. Las cuotas mantienen sus recargos sobre el total original: no se resta ese anticipo de las alternativas financiadas. El anticipo es una condición propuesta; no registra cobros ni pagos recibidos. 0 % lo omite. Se redondea a centavos y el saldo es la diferencia exacta del contado.

## Persistencia y compatibilidad

`budget.commercialTerms` es un mapa opcional de nueve campos: reference (40), issuedOn (fecha ISO), validityDays (entero 0..365), workAddress (200), scope (800), exclusions (800), paymentTerms (400), executionPeriod (120), advancePercent (0..100). Los números entre paréntesis limitan caracteres. La aplicación valida fechas reales y normaliza porcentajes; Firestore limita forma, tamaño y rangos y rechaza claves adicionales. No se guardan importes derivados ni se altera el total de mano de obra.

Cada versión conserva fecha de emisión y condiciones. Guardar una revisión posterior no cambia automáticamente la fecha elegida. Abrir un proyecto anterior sin este campo no activa ni agrega condiciones comerciales; sus PDF mantienen los datos históricos. Se pueden incorporar explícitamente en una nueva versión. Mis proyectos descarga las condiciones, promociones y datos profesionales de la versión elegida.

## PDF y publicación

Cabecera compacta con referencia, fecha y versión; condiciones tras el total y las alternativas de pago. Los materiales comienzan en página independiente. Ejemplo verificado con ocho trabajos, todas las promociones y condiciones: una página de propuesta más una de materiales. Presupuestos o condiciones más extensos se paginan sin reducir su legibilidad.

Pruebas de fechas argentinas y años bisiestos, vigencia, redondeo del anticipo, snapshot histórico, cambios del formulario, datos antiguos y rechazo de escrituras malformadas en el emulador. PDF generado con identidad ficticia, renderizado e inspeccionado. Para publicar se necesitan Hosting y firestore:rules juntos; no requiere desplegar funciones ni activar cobros. Hasta esa publicación, las reglas actuales rechazan el nuevo campo en producción: usar el emulador para verificar su guardado.
