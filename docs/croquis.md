# Croquis inicial

Disponible dentro de Presupuestar, asociado al proyecto y a su versión. Permite hasta cinco niveles, veinte ambientes rectangulares en total y trescientos puntos eléctricos (luminarias, tomas y llaves). Medidas en metros; posiciones X/Y desde la esquina superior izquierda. Los puntos conservan su posición relativa al cambiar las dimensiones. Deshacer/rehacer conserva hasta cuarenta cambios de la sesión.

El guardado usa la misma transacción y autorización del presupuesto, sin almacenamiento local ni una colección adicional. Requiere cliente y al menos un trabajo válido. Una edición del dibujo cuenta como cambio sin guardar. Los proyectos anteriores abren sin croquis. No se modifica el PDF existente.

Cada versión puede incluir `sketch`, un JSON de hasta 80.000 bytes, schema 1. El cliente valida tipos, medidas, referencias y unicidad de identificadores al escribir y leer; Firestore controla dueño verificado, límites de tamaño, permisos de proyecto y versiones inmutables. Las reglas tratan el dibujo como contenido opaco; nunca se ejecuta ni se interpreta como permisos. Los intentos de guardar desde versiones atrasadas siguen rechazándose, aunque el único cambio sea el croquis. Publicar primero las reglas compatibles y después Hosting.

La superficie es la suma de ambientes, no una unión geométrica; se avisa cuando se superponen en el mismo nivel. Es un esquema de organización: aún no calcula trabajos, importes, circuitos, secciones de conductores ni cantidades de materiales. No se habilita la contratación del plan con croquis ni los cobros reales.

Próxima etapa: definir con el electricista las correspondencias entre símbolos y trabajos del catálogo, revisar cantidades antes de agregarlas al presupuesto y definir los datos necesarios para materiales (recorridos, alturas, circuitos y criterios de instalación). Antes de habilitar comercialmente el plan con croquis, agregar su autorización en cliente y servidor.
