# Croquis inicial

Disponible dentro de Presupuestar, asociado al proyecto y a su versión. Permite hasta cinco niveles, veinte ambientes rectangulares en total y trescientos puntos eléctricos (luminarias, tomas y llaves). Medidas en metros; posiciones X/Y desde la esquina superior izquierda. Los puntos conservan su posición relativa al cambiar las dimensiones. Deshacer/rehacer conserva hasta cuarenta cambios de la sesión.

El guardado usa la misma transacción y autorización del presupuesto, sin almacenamiento local ni una colección adicional. Requiere cliente y al menos un trabajo válido. Una edición del dibujo cuenta como cambio sin guardar. Los proyectos anteriores abren sin croquis. No se modifica el PDF existente.

Cada versión puede incluir `sketch`, un JSON de hasta 80.000 bytes, schema 1. El cliente valida tipos, medidas, referencias y unicidad de identificadores al escribir y leer; Firestore controla dueño verificado, límites de tamaño, permisos de proyecto y versiones inmutables. Las reglas tratan el dibujo como contenido opaco; nunca se ejecuta ni se interpreta como permisos. Los intentos de guardar desde versiones atrasadas siguen rechazándose, aunque el único cambio sea el croquis. Publicar primero las reglas compatibles y después Hosting.

La superficie es la suma de ambientes, no una unión geométrica. El borrador de presupuesto rechaza ambientes superpuestos en un mismo nivel. No se habilita la contratación del plan con croquis ni los cobros reales.

## Presupuesto para obra nueva

Reglas acordadas: una boca completa por luminaria o toma, con las llaves incluidas en la iluminación. No suma los componentes de canalización, cableado y conexión por separado. Las extensiones mayores a 5 m entre cajas se revisan manualmente y se indican como bocas adicionales. La colocación de artefactos no se agrega automáticamente.

Proyecto eléctrico usa `proyecto_m2` por la superficie total dibujada, con un mínimo de 30 m². No suma mínimos monetarios, ítems de plano ni lista de materiales por separado. Puede excluirse explícitamente el proyecto por m². Cada trabajo usa el precio vigente de la cuenta, nunca un precio de respaldo del catálogo base. Si falta un precio válido, no se genera el borrador.

Se puede elegir un tablero, un seccional adicional, PAT separada y un trabajo de acometida. La PAT separada se descuenta si ya está incluida en un paquete. Se rechaza un tablero principal separado junto a acometidas que ya incluyen TP. Otros componentes se agregan después en el detalle. Las alturas generales de tomas, llaves y techo son opcionales y se conservan en `sketch.quote`, pero no se usan para inferir recorridos.

Primero se muestra el borrador, sus cantidades, precios y total. Aplicarlo reemplaza el detalle; si ya tiene trabajos requiere marcar una confirmación que advierte que también se quitarán los manuales. No se agregan filas repetidas por aplicar dos veces. Un cambio del dibujo o los precios invalida la revisión. Después se pueden editar las filas y guardar normalmente; el PDF usa ese detalle, sin incluir el dibujo.

Próxima etapa: criterios necesarios para materiales, circuitos y secciones; no se deducen de contar puntos ni de medir un recorrido. Antes de habilitar comercialmente el plan con croquis, agregar su autorización en cliente y servidor.

## Equipos y alimentación TP → TG

El croquis admite hasta 50 elementos independientes de los ambientes: medidor con tablero principal, TP separado, tablero general interior (TG), tableros seccionales adicionales (TS) y jabalinas de protección. Todos usan coordenadas en metros dentro del nivel y pueden ubicarse fuera de los ambientes. Para el general y los seccionales se elige el ítem del catálogo por polos; el rol queda indicado en el detalle del presupuesto sin modificar el catálogo compartido.

Cada elemento elige su trabajo del catálogo. Medidor + TP ofrece pilar completo o agregado de gabinete con TP; el principal separado ofrece monofásico o trifásico. Si existen elementos dibujados, sustituyen las selecciones manuales anteriores de tablero, PAT y acometida. No se suman ambos orígenes. Se impide dibujar medidor + TP y otro TP separado en el mismo borrador. Cada paquete con PAT cubre una de las jabalinas dibujadas: se descuenta esa cantidad, con un aviso visible; solo se cotizan las restantes. No se distinguen PAT de servicio y protección para ese descuento, según lo indicado por el titular.

Hasta 50 recorridos conectan TP o medidor + TP con TG del mismo nivel. Se dibujan como una polilínea con hasta 50 quiebres; al mover un extremo se actualiza su longitud. La medida suma segmentos en planta y los metros verticales ingresados explícitamente. No se deducen bajadas de las alturas de tomas o techo. Se rechazan referencias rotas, recorridos duplicados entre los mismos extremos y conexiones entre niveles distintos. Quitar un equipo o un nivel quita también los recorridos asociados; deshacer puede recuperarlos.

Antes de generar el borrador, cada recorrido debe indicar un trabajo por metro, por tramo de 5 m, o «Solo medir». Los tramos se redondean hacia arriba; los trabajos por metro usan la longitud con dos decimales. «Solo medir» se advierte expresamente como excluido del importe. La distancia no define sección, número de conductores, método de instalación ni materiales. El dibujo todavía no forma parte del PDF.


## Pantalla compacta y edición numérica

Los datos del proyecto siguen al principio; agregar trabajos individuales queda junto al detalle del presupuesto. Equipos y recorridos se muestran en dos columnas en escritorio y se apilan en móvil. Las explicaciones y notas del catálogo se consultan en una ayuda modal por temas, con botones para volver a abrirla. La ayuda inicial aparece al cargar por primera vez en este navegador; solo guarda una preferencia de lectura (`electricistaxpress:presupuestar-ayuda:v1`), nunca presupuestos ni datos de cuenta. Si el almacenamiento de preferencias no está disponible, la ayuda sigue funcionando. El diálogo conserva el foco, admite Escape y devuelve el foco al botón de origen.

Los campos numéricos mantienen un borrador visual mientras se escribe: permiten borrar la medida sin guardar NaN ni una geometría inválida. Al salir de un campo obligatorio vacío se restaura el último valor válido. Las alturas opcionales pueden quedar vacías. Alturas y cantidades medidas avanzan de 0,1; bocas, unidades y tramos avanzan de 1. Los valores históricos no se redondean al abrir un proyecto.
