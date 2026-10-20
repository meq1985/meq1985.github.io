# Precios sugeridos mensuales

La aplicación consulta el campo `suggestedCatalog` del documento `costos/codigos`.
Las reglas actuales permiten leerlo a usuarios con correo verificado y bloquean toda escritura desde la aplicación. La publicación mensual debe realizarla el propietario desde Firebase Console o un proceso administrativo con permisos propios. No cambiar las reglas para permitir publicaciones desde cuentas normales.

Formato del contenido (se admite un mapa de Firestore o texto JSON completo de tipo string):

```json
{
  "version": "2026-11-v1",
  "label": "Noviembre 2026",
  "prices": { "visita": 60000, "urgencia_nocturna": 140000 }
}
```

El ejemplo está abreviado: `prices` debe contener los 98 identificadores actuales, sin agregar identificadores anteriores. El archivo `docs/precios-sugeridos-iniciales.json` contiene el mapa completo con los valores iniciales. Cambiar los importes, la etiqueta del mes y la versión antes de publicar cada actualización. Usar números, no textos con símbolos monetarios; cero es válido. No cambiar los identificadores ni sus unidades.

Para cargar desde Firebase Console, agregar o editar el campo `suggestedCatalog` de tipo string y pegar el contenido completo del archivo JSON. Esto permite publicar los 98 importes en una sola operación. También se admite un mapa con la misma estructura desde procesos administrativos. Actualizar únicamente `suggestedCatalog`, conservando los demás campos de `costos/codigos`. No importar este archivo como reemplazo de toda la colección ni de los documentos personales. Publicar todos los precios en una sola actualización del mapa para no exponer una versión parcialmente cargada. Cada corrección del mismo mes debe tener otra versión (por ejemplo `2026-11-v2`).

Si todavía no hay un campo publicado, el botón ofrece el catálogo inicial incluido en la aplicación. Un mapa presente pero incompleto o inválido se rechaza; nunca se mezclan meses parcialmente.

Las cuentas nuevas usan el catálogo compartido vigente al crear sus precios. Si el campo todavía no existe, reciben los valores iniciales. Las cuentas existentes solo adoptan los precios después de pulsar «Consultar precios sugeridos actualizados», revisar la comparación y confirmar «Aplicar y guardar». Se conservan ítems anteriores y presupuestos ya generados. Los ajustes por porcentaje siguen disponibles.

Antes de guardar, una transacción vuelve a comprobar los valores personales y los sugeridos. Si otra pestaña o el administrador modificaron los datos después de la revisión, se cancela la operación y se solicita revisar de nuevo. La aplicación no escribe el catálogo compartido y no necesita Firebase Storage, Cloud Functions ni un cambio de plan.

Añadir trabajos o cambiar descripciones/unidades requiere una actualización de la aplicación; la publicación mensual está destinada a los importes de los trabajos existentes.
