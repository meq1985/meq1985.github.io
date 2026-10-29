# Seguridad y control de consumo

## Controles implementados
- Proyectos y versiones solo para su titular con correo verificado.
- Alta de perfiles/costos solo después de verificar correo.
- Prueba de 30 días: fecha de servidor inmutable, no depende del reloj del navegador ni del flag de cobros.
- Hasta 10 proyectos creados en prueba, 100 proyectos por cuenta paga y 10 guardados por ventana de 24 horas. Contadores transaccionales vinculados al proyecto; no se pueden reiniciar desde el cliente. Administrador exento.
- Los contadores comienzan al usar esta versión: los proyectos históricos previos no se recorren ni se borran.
- Tamaños acotados de croquis, presupuestos y consultas paginadas. Archivos PDF generados en el dispositivo.
- Corte de emergencia: un operador autorizado puede escribir `configuracion/seguridad.pauseWrites=true` con herramientas administrativas. Pausa escrituras de usuarios, conserva lectura y proyectos. No es automático ni impide lecturas facturables. Administrador de proyectos exento.
- Funciones de pagos: máximo 2 instancias, sin instancias mínimas, firmas de webhook y circuito QA privado. Cobros reales deshabilitados.
- HTTPS de Google Trust Services; HSTS, nosniff, referrer policy y restricción de marcos/permisos.

## Riesgos que estos controles NO eliminan
Los límites por cuenta no impiden múltiples cuentas, lecturas repetidas ni tráfico al Hosting. Las solicitudes rechazadas por reglas pueden implicar lecturas de evaluación. No existe un techo monetario global de Firestore definido por estas reglas. Las alertas de facturación no detienen los cargos.

## Protección anti-bots
Turnstile Managed: clave privada en Secret Manager, hostname y acción signup validados en servidor, tokens de un solo uso. Función registerAccount con máximo una instancia, 5 solicitudes concurrentes y timeout 20 segundos. Límite global inicial: 25 intentos de alta verificados por ventana de 24 horas; por IP: 3. La IP se conserva como HMAC, no en claro. expiresAt marca 7 días, pero no hay TTL habilitado: requiere limpieza operativa o configurar TTL antes de prometer borrado automático. No se afirma retención automática de 7 días. Los registros ya existentes continúan recuperándose por Ingresar. Deshabilitar el alta directa del cliente Firebase al publicar para impedir saltarse el servidor. Verificar este estado en la configuración de Authentication. El contador global puede ser consumido por un atacante con desafíos válidos y bloquear altas legítimas: preferible al gasto ilimitado, requiere supervisión. Alternativamente App Check con reCAPTCHA Enterprise y enforcement real en Firestore/Auth: requiere configurar y probar el proveedor, informar transferencias y costos potenciales (10.000 verificaciones/mes sin cargo, excedente según Google). No marcar un proveedor como activo por tener código opcional.

## Operación
Crear alertas de consumo/costos, supervisar Authentication/Firestore/Functions, revisar cuotas disponibles y mantener un procedimiento de pausa. Ninguna cifra de presupuesto debe presentarse como tope duro de todo Firebase. La cuenta propietaria debe usar segundo factor y conservar credenciales fuera de Git. No registrar contraseñas ni tokens. Revisar y actualizar dependencias.

## Legal
Las solicitudes recibidas por correo de baja/arrepentimiento requieren atención del responsable y código de identificación dentro de 24 horas; la web no las procesa ni confirma automáticamente. Los derechos de datos personales deben atenderse dentro de los plazos legales. Revisar el aviso legal, identificación fiscal, domicilio comercial completo y obligaciones de registro con asesoría local antes de activar cobros. No exhibir certificados o avales no obtenidos.
