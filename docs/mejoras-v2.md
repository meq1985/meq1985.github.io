# Mejoras v2: alcance y revisión

## Cambios

- Un único guard espera el primer evento de Firebase Auth antes de decidir. La ruta de entrada para una cuenta verificada es `/config`.
- El registro espera la cuenta, inicializa perfil y costos sin sobrescribir documentos existentes, envía la verificación y cierra la sesión incluso si falla el envío. Los errores parciales no eliminan cuentas ni datos: el siguiente ingreso reintenta la inicialización.
- Cada operación de perfil/costos comprueba la sesión; las inicializaciones comprueban además que el email corresponde a esa cuenta. Las lecturas pendientes no actualizan el estado si cambió la cuenta. El catálogo compartido `costos/codigos` queda sin función de escritura en el cliente.
- El observador de Auth sincroniza Pinia y limpia los datos del usuario anterior.
- Se validan cliente, descripción, cantidad positiva, precios no negativos y valores finitos antes de exportar o guardar. Los subtotales se redondean a centavos.
- Los presupuestos nuevos se guardan con identificador único en IndexedDB por UID: PDF y detalle del presupuesto. Se pueden listar, descargar y eliminar desde Mis Presupuestos.

## Persistencia compatible con Spark

Esta iteración guarda presupuestos en el navegador; no necesita Cloud Storage, Cloud Functions ni un cambio de plan. El perfil y los costos conservan sus rutas actuales de Firestore por email para evitar una migración de producción.

El guardado local no sincroniza dispositivos y no es un respaldo. Borrar los datos del navegador, usar otro navegador o cambiar de dominio deja esos archivos fuera del alcance. La interfaz avisa de esto y permite descargar copias. Los PDF existentes en Firebase Storage no se eliminaron ni migraron y no aparecen en el listado local. En la revisión inicial no se realizaron conexiones de prueba a Firebase de producción; la revisión posterior de reglas está documentada en firestore-review-2026-10-20.md.

Firebase exige Blaze para Cloud Storage, incluidos los buckets predeterminados: https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024

## Seguridad y despliegue

Los controles del cliente no sustituyen reglas del servidor. `firestore.rules` contiene las reglas revisadas y publicadas en Firebase Console el 20/10/2026: acceso individual por email, creación propia durante el registro, lectura de datos existentes y cambios con correo verificado y lectura del catálogo compartido. No permite listar colecciones, borrar documentos ni escribir el catálogo desde el cliente.

Las reglas se publicaron manualmente por autorización del propietario después de 18 simulaciones en la Zona de pruebas de reglas. No están conectadas a firebase.json y el PR no las despliega automáticamente. El registro de la versión anterior puede quedar incompleto por sus escrituras prematuras; el usuario aceptó esta limitación para cerrar ahora el acceso público. No se modificaron documentos ni se desplegó la aplicación. El esquema por email se mantiene por compatibilidad; una migración futura a UID requiere planificar la propiedad de los datos existentes. Ver firestore-review-2026-10-20.md para los resultados y límites de las pruebas.

El workflow de PR ejecuta pruebas y build, sin credenciales de Firebase ni despliegue. El comando de exclusión de Netlify omite la rama `mejoras-v2` (BRANCH o HEAD). Los commits también usan `[skip netlify]`. No se modifican los workflows de despliegue de main ni se fusiona este PR.

Referencia del comando ignore: https://docs.netlify.com/build/configure-builds/ignore-builds/

## Verificación

- `npm test`: pruebas aisladas de navegación, espera de Auth, registro, protección del cliente Firestore, validación y persistencia IndexedDB con una implementación de prueba.
- `npm run build`: compilación de producción.
- La revisión posterior incluye 18 simulaciones de reglas en Firebase Console y publicación verificada. No se crearon usuarios ni se modificaron documentos. Quedan pendientes pruebas completas de navegador y una suite automatizada con emuladores.
- El árbol de dependencias heredado tiene alertas de seguridad y el build avisa de un bundle mayor a 500 KiB. La modernización de Vite, Firebase y jsPDF debe abordarse por separado con pruebas de compatibilidad, antes de publicar.
