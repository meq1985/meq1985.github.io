# Croquis inicial

Disponible dentro de Presupuestar, asociado al proyecto y a su versión. Permite hasta cinco niveles, veinte ambientes rectangulares en total y trescientos puntos eléctricos (luminarias, tomas y llaves). Medidas en metros; posiciones X/Y desde la esquina superior izquierda. Los puntos conservan su posición relativa al cambiar las dimensiones. Deshacer/rehacer conserva hasta cuarenta cambios de la sesión.

El guardado usa la misma transacción y autorización del presupuesto, sin almacenamiento local ni una colección adicional. Requiere cliente y al menos un trabajo válido. Una edición del dibujo cuenta como cambio sin guardar. Los proyectos anteriores abren sin croquis. No se modifica el PDF existente.

Cada versión puede incluir `sketch`, un JSON de hasta 80.000 bytes, schema 1. El cliente valida tipos, medidas, referencias y unicidad de identificadores al escribir y leer; Firestore controla dueño verificado, límites de tamaño, permisos de proyecto y versiones inmutables. Las reglas tratan el dibujo como contenido opaco; nunca se ejecuta ni se interpreta como permisos. Los intentos de guardar desde versiones atrasadas siguen rechazándose, aunque el único cambio sea el croquis. Publicar primero las reglas compatibles y después Hosting.

La superficie es la suma de ambientes, no una unión geométrica. El borrador de presupuesto rechaza ambientes superpuestos en un mismo nivel. No se habilita la contratación del plan con croquis ni los cobros reales.

## Presupuesto para obra nueva

Reglas acordadas: una boca completa por luminaria o toma, con las llaves incluidas en la iluminación. No suma los componentes de canalización, cableado y conexión por separado. Las extensiones mayores a 5 m entre cajas se revisan manualmente y se indican como bocas adicionales. La colocación de artefactos no se agrega automáticamente.

Proyecto eléctrico usa `proyecto_m2` por la superficie total dibujada, con un mínimo de 30 m². No suma mínimos monetarios, ítems de plano ni lista de materiales por separado. Puede excluirse explícitamente el proyecto por m². Cada trabajo usa el precio vigente de la cuenta, nunca un precio de respaldo del catálogo base. Si falta un precio válido, no se genera el borrador.

Se puede elegir un tablero, un seccional adicional, PAT separada y un trabajo de acometida. Se rechaza PAT separada si el paquete elegido ya la incluye, y un tablero principal separado junto a acometidas que ya incluyen TP. Otros componentes se agregan después en el detalle. Las alturas generales de tomas, llaves y techo son opcionales y se conservan en `sketch.quote`, pero todavía no calculan recorridos ni materiales.

Primero se muestra el borrador, sus cantidades, precios y total. Aplicarlo reemplaza el detalle; si ya tiene trabajos requiere marcar una confirmación que advierte que también se quitarán los manuales. No se agregan filas repetidas por aplicar dos veces. Un cambio del dibujo o los precios invalida la revisión. Después se pueden editar las filas y guardar normalmente; el PDF usa ese detalle, sin incluir el dibujo.

Próxima etapa: recorridos y criterios necesarios para materiales, circuitos y secciones; no se deducen de contar puntos. Antes de habilitar comercialmente el plan con croquis, agregar su autorización en cliente y servidor.
