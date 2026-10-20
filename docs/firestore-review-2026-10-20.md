# Revisión y publicación de reglas de Firestore — 20/10/2026

Proyecto: `presupuesto-electrico`, base `(default)`. Alcance: reglas de Firestore solamente. Sin escrituras, borrados, altas de usuarios ni despliegues de la aplicación.

## Cambio autorizado

La regla anterior permitía acceso anónimo de lectura y escritura a todos los documentos hasta el 31/12/2026. Se conserva una copia documental en `firestore-before-2026-10-20.rules.txt`; no debe restaurarse como solución normal de compatibilidad.

La regla nueva limita `usuarios/{email}` y `costos/{email}` al email del token autenticado. Las actualizaciones y la lectura de datos personales existentes requieren correo verificado. Antes de la verificación se permite crear documentos propios y comprobar su ausencia, para el registro de mejoras-v2. El catálogo `costos/codigos` se puede leer con correo verificado y no se puede modificar desde clientes. Listados, eliminaciones y otras rutas quedan denegados.

El propietario del proyecto autorizó cerrar ahora el acceso público, aceptando que el registro de la versión anterior quede incompleto hasta publicar mejoras-v2. No se fusionó ni desplegó esa rama.

## Pruebas realizadas

Se usó la Zona de pruebas de reglas de Firebase Console sobre el borrador sin publicar, con identidades simuladas. No se ejecutó un emulador local: no estaba instalado el runtime de Java ni Firebase CLI. Las operaciones create/update/delete fueron exclusivamente simuladas. Una lectura de un perfil existente se usó para comprobar el requisito de verificación; no se incluyen sus datos en este informe.

| Caso | Resultado observado |
|---|---|
| Anónimo: leer catálogo | Denegado |
| Cuenta sin verificar: leer catálogo | Denegado |
| Cuenta verificada: leer catálogo | Permitido |
| Cuenta verificada: leer perfil ajeno | Denegado |
| Propietario verificado: leer ruta de perfil propia | Permitido |
| Propietario sin verificar: crear perfil propio | Permitido |
| Cuenta sin verificar: crear perfil ajeno | Denegado |
| Propietario sin verificar: crear costos propios | Permitido |
| Propietario sin verificar: actualizar costos propios | Denegado |
| Propietario verificado: actualizar costos propios | Permitido |
| Cuenta verificada: actualizar catálogo | Denegado |
| Cuenta verificada: actualizar costos ajenos | Denegado |
| Propietario verificado: actualizar perfil propio | Permitido |
| Propietario verificado: eliminar perfil | Denegado |
| Propietario sin verificar: consultar perfil todavía inexistente | Permitido |
| Anónimo: crear perfil (escritura prematura de versión anterior) | Denegado |
| Email coincidente sin verificar: leer perfil existente | Denegado |
| Email coincidente verificado: leer perfil existente | Permitido |

Además, `npm test` aprobó las 26 pruebas aisladas de la aplicación. Esas pruebas no sustituyen las simulaciones de reglas ni constituyen una prueba completa de navegador.

## Compatibilidad y límites

La versión anterior llama al registro asíncrono y escribe perfil/costos inmediatamente, antes de disponer de una sesión. Esa escritura ahora se rechaza de forma deliberada. mejoras-v2 espera la creación de la cuenta y prepara sus documentos autenticados; un ingreso posterior con correo verificado puede reparar inicializaciones incompletas.

Las pruebas conservaron los permisos necesarios para los usuarios existentes verificados y para el flujo de mejoras-v2. No se crearon cuentas reales ni se ejecutó un registro completo contra producción.

Se mantiene el esquema por email para evitar una migración de datos. La validación del esquema de los documentos y una futura migración a UID son trabajos separados. App Check continúa sin configurar; el plan continúa en Spark.

## Publicación

Firebase Console confirmó la publicación con el mensaje: «Los cambios publicados pueden tardar hasta un minuto en propagarse». Se recargó la consola para comprobar la versión activa. No se modificaron datos de Firestore, Auth, Storage ni configuración de facturación.
