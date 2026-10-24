# Materiales desde el croquis: primera entrega

Esta entrega permite definir circuitos y conductores individuales manualmente, dibujar tramos interiores y obtener una lista parcial sin precios. No implementa el dimensionamiento automático del plan completo. No activa pagos ni permisos nuevos y no debe publicarse hasta revisar el alcance con el titular.

## Interacción en el plano

«Conectar» permite tocar un elemento de origen y luego el destino. «Trazar conexión» permite marcar quiebres en el plano entre ambos. Escape o Cancelar descarta el trazado sin guardarlo; cambiar de nivel también lo descarta. Una conexión existente se selecciona en lugar de duplicarse. Tocar una línea abre sus propiedades; «Ver materiales» abre la lista y «Opciones de materiales» agrupa los ajustes. No hay selectores Desde/Hasta ni bloques permanentes de recorridos debajo del dibujo.

Las conexiones entre llave y luminaria se guardan como vínculos de control. No asignan por sí solas el circuito ni la cantidad de retornos o conductores. Sus longitudes representan el trazado elegido y requieren completar los conductores en las propiedades.

## Geometría y medición

Los extremos pueden ser puntos existentes, equipos o nuevas cajas de paso. Los tramos se editan con quiebres en el plano, en un mismo nivel. La longitud suma segmentos y los metros verticales explícitos; no infiere bajadas con las alturas generales. Los cruces gráficos no crean conexiones. Una caja de paso intermedia requiere dividir los tramos deliberadamente.

Cada tramo físico admite varios circuitos y cuenta una sola canalización. Los conductores se agregan explícitamente por circuito, función, cantidad y sección; no se suponen neutros, PE ni retornos. La familia de conductor sigue pendiente de confirmar. No se admiten cables multipolares ni se asignan secciones o protecciones automáticamente.

Los recorridos TP → TG se pueden incorporar por referencia: conservan la geometría y verticales del original, incluso cuando se edita. No se vuelven a sumar como otro tramo. Borrar puntos, cajas o equipos elimina los tramos vinculados; Deshacer recupera el conjunto. Se impiden duplicados entre dos extremos, referencias rotas y conductores duplicados por función dentro del mismo circuito/tramo.

## Lista y exportación

Se suman canalizaciones, conductores, una caja y un mecanismo por símbolo, cajas de paso y equipos dibujados. Los componentes sin especificación se identifican como pendientes. Las cajas compartidas y conjuntos de pilar/tablero requieren revisión manual: no se genera una receta de componentes ni se verifica el diseño eléctrico. Las jabalinas dibujadas se mantienen en materiales aunque su mano de obra esté incluida en un paquete.

Los adicionales se suman expresamente a lo dibujado; no reemplazan filas. La reserva elegida es cero por defecto y afecta solo longitudes. Cantidad calculada y cantidad con reserva se muestran separadas. El CSV incluye el estado parcial y las observaciones y neutraliza fórmulas de hojas de cálculo. El PDF existente continúa siendo de mano de obra; esta entrega no crea un PDF de materiales.

## Persistencia y compatibilidad

Un dibujo sin materiales conserva schema 1. La primera edición de materiales crea schema 2 con un bloque `materials` versionado que contiene circuitos, cajas, tramos, adicionales y reserva. Se conserva el límite total de 80.000 bytes del JSON, validado al guardar. Se guarda dentro de la versión del proyecto mediante la transacción existente. Las reglas de Firestore ya admiten este string acotado y no se modifican. Los clientes anteriores rechazan schema 2 y no pueden abrirlo y sobrescribirlo descartando los materiales.

El resultado se deriva de los datos guardados; no se persiste una aprobación ni una lista obsoleta. Una exportación refleja el estado actual y siempre es parcial. Los límites de esta entrega son 50 circuitos, 50 cajas de paso, 150 tramos, 50 quiebres por tramo y 100 adicionales, sujetos también al límite de bytes.

## Chequeo monofásico

La comprobación independiente de un tramo recibe demanda aparente, tensión, longitud de ida, resistencia, factor de potencia y reactancia, o una decisión explícita de omitirla. Calcula corriente, caída y porcentaje sin redondeos intermedios. El límite es ingresado por el usuario; no se atribuye a una norma validada. Comprueba parcialmente IB ≤ In ≤ Iz con la corriente admisible corregida ingresada y compara poder de corte con cortocircuito previsto únicamente cuando ambos datos están presentes.

El caso aportado por el titular usa 440 VA, 220 V, 24 m, R = 7,98 Ω/km, cos φ = 0,95 y omite X. Reproduce 2 A, 0,727776 V y 0,3308072727 %. Los 10 A de protección y 21 A admisibles son entradas, no selecciones del motor. Los 3 kA no quedan confirmados sin cortocircuito previsto. No verifica curva, desconexión, coordinación completa ni caída acumulada.

Las tablas aportadas de AEA 770 de 2016 provienen de un documento para discusión pública. No se incorporan como reglamento vigente ni se eligen automáticamente calibre, sección o electrificación. La automatización requiere contrastar edición publicada, correcciones, alcance y casos revisados por el titular.

Referencias de la fórmula y comprobaciones parciales:
- https://www.electrical-installation.org/enwiki/Calculation_of_voltage_drop_in_steady_load_conditions
- https://www.se.com/ph/en/faqs/FAQ000283711/
- https://www.electrical-installation.org/enwiki/Selection_of_a_circuit-breaker

## Trabajo posterior

Faltan mecanismos múltiples en una caja, circuitos propuestos según usos/cargas, recorridos entre niveles, familias y presentaciones comerciales, perfiles de tableros/pilar/PAT, dimensionamiento técnico completo, revisión persistente, PDF de materiales y permisos Full en cliente/servidor. No anunciar esas funciones como implementadas.
