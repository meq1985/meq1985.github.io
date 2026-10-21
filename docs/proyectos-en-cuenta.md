# Proyectos guardados en la cuenta

## Datos y privacidad

Cada cuenta verificada utiliza `cuentas/{uid}/proyectos/{id}`. El documento contiene únicamente un resumen (nombre, cliente, inmueble, total, número de versión y fechas del servidor). Cada guardado agrega `versiones/{n}` con una copia del presupuesto, sus cantidades, unidades, precios y datos profesionales. No se suben PDF, imágenes ni archivos a Firebase Storage.

El resumen y la versión se guardan juntos en una transacción. Las reglas solo permiten a la cuenta con ese UID leer y crear sus proyectos. Bloquean el acceso anónimo, las cuentas sin verificar, las lecturas de otras cuentas, el listado global, los cambios de propietario, las versiones huérfanas y la modificación o eliminación de versiones anteriores. No hay borrado de proyectos en esta etapa.

Los importes se vuelven a calcular y se validan antes de guardar y al recuperar un presupuesto. Se admiten hasta 200 trabajos, cliente/nombre de 120 caracteres, descripciones de 1000 y tipo de inmueble de 80. Estos límites mantienen la copia de datos dentro del tamaño admitido por Firestore. No son límites comerciales.

## Uso

- Presupuestar ofrece «Guardar proyecto en mi cuenta», «Guardar presupuesto local» y «Descargar PDF». El nombre del proyecto es opcional: se usa el cliente si no se completa.
- Mis proyectos permite abrir la última versión, editar manteniendo precios históricos y descargar cualquier versión. El PDF usa la fecha y los datos profesionales de esa copia. «Usar mis datos profesionales actuales» actualiza el perfil de la siguiente versión de forma explícita.
- Cada actualización comprueba la versión esperada. Dos dispositivos no pueden sobrescribir cambios silenciosamente. El editor conserva los datos al fallar el guardado, permite guardar una copia local y advierte al abandonar cambios pendientes.
- Un reintento con el mismo contenido reconoce el guardado anterior si se perdió su respuesta. Nunca se anuncia guardado correcto antes de que la transacción termine.
- Se consultan 20 proyectos y 10 versiones por página, sin listeners permanentes ni consultas sobre todas las cuentas. Las listas se leen del servidor; un fallo de conexión se muestra como error, no como lista vacía.
- Al cambiar de cuenta se recrea la vista para no conservar datos privados del usuario anterior.

## Importación local

Presupuestos locales conserva los archivos originales en IndexedDB. «Copiar a mi cuenta» importa los datos del presupuesto, con un identificador estable para evitar duplicados incluso después de editar el proyecto importado. No borra ni modifica el PDF original.

Las copias antiguas no contienen los datos profesionales con los que se generó su PDF. La versión importada conserva `profile: null`; para generar un nuevo PDF desde la cuenta se debe abrir el proyecto, revisar los datos actuales y guardar una nueva versión. El PDF original se sigue descargando desde el historial local. No se reconstruyen datos históricos por suposición ni se migran los archivos antiguos de Storage.

## Publicación

Primero aprobar y publicar únicamente las reglas de `firestore.rules`, conservando los accesos existentes a perfiles y precios. Después integrar el PR para que Netlify publique la aplicación. `firebase.json` incluye la ruta de reglas para un despliegue explícito con `--only firestore:rules`; este trabajo no despliega Firebase Hosting ni cambia el plan Spark. No publicar la interfaz con las reglas antiguas: estas rechazan los nuevos proyectos.

La publicación de reglas y la aplicación queda pendiente de la autorización del propietario. No ejecutar pruebas sobre el proyecto de producción. Los tests de integración usan exclusivamente `demo-presupuesto-electrico` y emuladores locales.
