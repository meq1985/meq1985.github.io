# Verificación de la actualización — 20/10/2026

## Correcciones

- Registro reanudable: si el correo ya existe, se autentica con la contraseña proporcionada antes de reanudar la verificación o completar la cuenta. Una contraseña incorrecta nunca permite acceder a la cuenta.
- El registro no escribe documentos antes de verificar el correo. Después de verificarlo, perfil y costos se inicializan juntos en una transacción de Firestore; si una escritura falla, no se guarda ninguna. Un ingreso posterior reintenta y también repara cuentas antiguas con un solo documento, sin sobrescribir sus datos.
- Las rutas protegidas esperan tanto Auth como la inicialización de cuenta. Una interrupción de configuración muestra una vía de reintento y no un panel parcialmente inicializado.
- Dependencias actualizadas y dependencia ffmpeg sin uso eliminada. Override de la versión corregida de gRPC requerida por Firebase. Auditoría npm: cero vulnerabilidades conocidas.
- Compatibilidad con Pinia actual y nueva API de jsPDF/AutoTable; generación PDF probada con importes y datos reales de un caso ficticio. Carga de PDF bajo demanda y bundles separados, sin advertencia de 500 kB.
- Formularios reactivos de ingreso, registro y recuperación; controles accesibles; totales redondeados, costos no negativos y lectura compatible con el nombre antiguo del campo PVC.
- Netlify compila con Node 24, publica solamente dist y resuelve rutas Vue al recargar. Se evita disparar despliegues heredados de Firebase Hosting y Jekyll al fusionar; quedan manuales.

## Pruebas locales

- 41 pruebas aisladas: autenticación, recuperación de errores, guards, protección cliente de Firestore, validación de presupuestos/costos, persistencia IndexedDB y contenido PDF.
- 8 pruebas de integración en Auth + Firestore emulados, proyecto demo-presupuesto-electrico. Incluyen registro repetido, email no verificado, verificación con código de prueba, inicio/cierre de sesión, restablecimiento de contraseña, actualización de perfil/costos, inicialización concurrente, reparación de cuenta antigua, aislamiento por cuenta y denegación de listados/eliminaciones.
- Se forzó una regla que rechaza una de las escrituras de inicialización: ninguno de los dos documentos se guardó. Se restauraron las reglas de prueba y el reintento completó ambos.
- Prueba manual de navegador contra emuladores: registro ficticio, verificación por enlace local, ingreso, perfil, costo decimal y presupuesto guardado que persiste después de navegar.
- npm run build: correcto, sin advertencias de chunks grandes. npm audit: cero alertas. git diff --check: correcto.

No se crearon cuentas reales ni se modificaron documentos de producción durante estas pruebas. Auth y Firestore no tienen transacciones compartidas: una cuenta pendiente de verificar puede existir, pero el flujo muestra cómo reanudarla. Los documentos de la cuenta se crean en conjunto y se pueden reparar al ingresar; no se promete que una interrupción de red nunca requiera reintentar.

## Publicación

La publicación se realiza solamente después de validar el commit del PR en GitHub. La configuración de pruebas usa emuladores y un proyecto demo; el build de producción rechaza explícitamente el modo emulador. Los workflows conservan comprobaciones en main y PR, pero únicamente Netlify se despliega automáticamente al fusionar.

El guardado de presupuestos sigue siendo local al navegador, sin migrar los PDF históricos de Storage ni sincronizarlos entre dispositivos. No se modifica el plan Spark ni se activan servicios pagos. App Check queda como mejora separada: requiere configurar un proveedor y validar su integración antes de imponerlo a los usuarios existentes.
