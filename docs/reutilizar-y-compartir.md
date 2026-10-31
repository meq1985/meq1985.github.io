# Reutilizar y compartir presupuestos

## Trabajo repetido

Mis proyectos permite duplicar el proyecto actual o reutilizar una versión concreta. Abre un borrador nuevo, sin crear documentos de inmediato: conserva cliente, trabajos, cantidades, precios y promociones. Si hay condiciones comerciales, conserva su contenido y duración de vigencia, pero renueva fecha de emisión y referencia. Usa el perfil profesional actual para la propuesta nueva. El original y sus versiones no se modifican.

El croquis se copia solo con acceso Full, prueba o administrador. En Básico se reutilizan los trabajos y se indica que el dibujo no se copió. Al guardar se usa el mismo servicio transaccional existente: límite de proyectos, diez guardados por día, control de versión, sesión y propiedad. Los parámetros de duplicación no conceden permisos ni omiten esos límites. Cambiar de fuente con un borrador modificado activa la confirmación de salida habitual.

## Compartir

Presupuestar prepara el mismo PDF que descargaría; en cuentas no administradoras guarda primero los cambios mediante el circuito habitual. Mis proyectos permite compartir una versión guardada incluso después del vencimiento, sin crear otra versión ni cambiar precios o condiciones. El mensaje identifica referencia, versión, total de mano de obra, descuento al contado, vigencia y profesional cuando existen.

El PDF se prepara en memoria como File. Un segundo botón, pulsado directamente por la persona, abre Web Share si el dispositivo admite ese archivo. Las aplicaciones disponibles dependen del navegador y dispositivo. No se garantiza que aparezca WhatsApp ni correo en todos ellos. Que el panel se abra o cierre no acredita entrega; una cancelación no se muestra como envío exitoso.

Fallback: descargar el PDF, copiar el mensaje o abrir WhatsApp / correo con texto editable y destinatario opcional. Los enlaces wa.me y mailto no adjuntan el PDF; la interfaz lo explica antes de usarlos. El usuario debe adjuntarlo y confirmar el envío. El correo se abre con su aplicación habitual; no requiere credenciales de una casilla del dominio. Los destinatarios del panel no se guardan como una agenda en esta etapa.

No se sube el PDF a Cloud Storage, no se crea una URL pública del proyecto, no hay API de WhatsApp Business ni servicio SMTP contratado y no se registran estados de entrega. Los enlaces de descarga locales se revocan al cerrar. Se vuelve a comprobar la identidad antes de generar y antes de cada acción de compartir para evitar reutilizar una sesión anterior. No se enviaron mensajes reales durante las pruebas.

## Verificación

Pruebas de copia sin mutar originales, fecha/referencia nuevas, preservación de precios, mensaje y archivo de la versión elegida, importes y vigencia, codificación de enlaces y rechazo de destinatarios inválidos/inyección de cabeceras. Pruebas del panel con y sin Web Share, cancelación, cambio de sesión, copia local del texto y revocación del enlace temporal. Emulador: una copia ocupa un proyecto y un guardado, reintentar no duplica contadores y Básico no puede guardar una copia de croquis Full.

Referencias: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share , https://faq.whatsapp.com/5913398998672934 , https://www.rfc-editor.org/rfc/rfc6068 .
