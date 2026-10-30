# Postulaciones Burger Ya

Estado: implementación para revisión en rama. NO habilitada ni publicada por este cambio.
Ruta prevista: `/trabaja` (también acepta `/trabaja/`). La ruta funciona independientemente de sold out y pantallas de eventos. No agrega enlaces ni cambia el menú, precios, carrito o WhatsApp.

## Qué recibe

Tres pasos: disponibilidad, experiencia y contacto. Nombre, teléfono, localidad sin domicilio y aclaración opcional; sin CV, foto, DNI, edad, género, estado civil, nacionalidad o salud. No guarda datos en localStorage/sessionStorage ni en URLs. El recibo se muestra solo al confirmar una escritura durable.

Condiciones obligatorias: presencial Hurlingham; miércoles-domingo y feriados operativos; cambiado y listo 19:30; turno completo con cierre; continuidad. Salida confirmada por Lautaro el 15/10/2026: **01:30 del día siguiente, incluido el cierre**. Turno: **19:30–01:30**. El servidor usa 01:30 por defecto; se muestra en el formulario habilitado y se registra con la respuesta.

Clasificación de servidor (el cliente no puede definirla):
- Algún `no`: **No cumple requisitos operativos**, con claves de motivos.
- Sin `no`, algún `consultar`: **Disponibilidad por aclarar**.
- Todos `si`: **Cumple disponibilidad declarada**.

No se rechaza ni contrata automáticamente. Se conservan las respuestas con consentimiento, incluso si hay incompatibilidad; el equipo decide. Experiencia, autonomía y escenario de alta demanda orientan entrevista/prueba, sin puntaje ni filtro oculto. No se filtra por localidad, por tener vehículo o por situación personal.

## Arquitectura y opciones evaluadas

La web ya tiene Vercel Functions y un adaptador Upstash para límites de ubicación. Se reutilizan; no se agrega dependencia, base de datos o panel público.

`Navegador → POST /api/postulaciones → Apps Script autenticado → Google Sheets privado`.

Google Forms + Sheets sería la opción de menor mantenimiento si no se necesitara el formulario integrado; implicaría salir de la web o embeber otra experiencia. Gmail solo seguiría obligando a revisar mensajes. Se elige Sheets para filtrar/consultar sin construir un sistema de usuarios. Apps Script ofrece doPost y acceso a Sheets: https://developers.google.com/apps-script/guides/web ; https://developers.google.com/apps-script/reference/spreadsheet/sheet . El puente de servidor evita el envío no-cors sin confirmación y mantiene el secreto fuera del navegador.

El portal de referencia de Sabores Express presentó una verificación antirrobots; no se pudo inspeccionar su formulario. Solo se toma el patrón descrito por el usuario.

## Activación (pendiente; no hay credenciales inventadas)

1. Horario confirmado: 19:30–01:30, incluido el cierre; a las 19:30 debe estar cambiado y listo. Configurar `RECRUITMENT_SHIFT_END=01:30` y comprobar que no haya un valor anterior distinto en Vercel. Confirmar los días festivos aplicables y condiciones de la oferta antes de entrevistas.
2. Crear Google Sheet **Burger Ya – Postulaciones** con acceso **Restringido** en la cuenta del negocio. No habilitar “cualquiera con enlace”, ni publicar en la web. Dar acceso únicamente a responsables de selección con su cuenta individual; no compartir credenciales.
3. Abrir Extensiones → Apps Script. Copiar `integrations/recruitment/Code.gs` y el manifiesto `appsscript.json`. En propiedades de script configurar `SPREADSHEET_ID` y `RECRUITMENT_SECRET` (32 bytes aleatorios o más; generar por ejemplo `openssl rand -hex 32`, no pegar en GitHub ni chats).
4. Ejecutar `setupRecruitment` como propietario y autorizar. Crea pestaña, filtro y tarea diaria de eliminación a 90 días. Revisar el historial de ejecuciones y alertas de fallos del propietario. La eliminación abarca filas operativas; revisar además historial de versiones, copias y políticas de retención de Workspace: borrar una fila no promete eliminar todos los backups del proveedor.
5. Implementar Apps Script como aplicación web, ejecutar como propietario y permitir invocación externa (“Cualquier usuario”). Esto publica SOLO el receptor: no la planilla. Sin secreto válido no escribe, y no existe lectura por web. Copiar la URL `/exec` (no `/dev`). Si Workspace impide apps web externas, detener la activación y evaluar Google Forms privado en sus respuestas; no abrir permisos de la planilla para compensarlo.
6. Configurar en Vercel, SOLO en el servidor, las variables del ejemplo de abajo. Reutilizar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` existentes; no se verificó que estén configuradas en la cuenta. Se requiere Redis incluso en preview para evitar límites que se pierdan entre instancias. No usar prefijo `VITE_` para secretos.
7. Usar planilla/secreto independientes para preview. Probar los casos de abajo. Habilitar `RECRUITMENT_ENABLED=true` solo tras verificar la planilla y el aviso de datos. Recompilar/desplegar la rama según el flujo habitual. Este PR NO modifica main ni hace merge.

Variables (configuración de ejemplo, valores reales pendientes):
```
RECRUITMENT_ENABLED=false
RECRUITMENT_ORIGIN=https://burgerya.com.ar
RECRUITMENT_SHIFT_END=01:30   # confirmado; incluye cierre
RECRUITMENT_SHEETS_URL=      # URL de Apps Script terminada en /exec
RECRUITMENT_SECRET=          # secreto aleatorio compartido con Apps Script
UPSTASH_REDIS_REST_URL=      # reutilizar instancia existente
UPSTASH_REDIS_REST_TOKEN=    # reutilizar credencial existente
```

Configurar el origen EXACTO desde el que se envía, sin barra final. Si hay www, redirigir al canónico. En preview usar su origen y almacenamiento de prueba. El chequeo de origen no autentica al candidato ni sustituye el rate limit. La URL privada de Apps Script nunca se envía al navegador.

## Consultar y operar

En Sheets, filtrar por Búsqueda + Clasificación + Estado de revisión. Ordenar por fecha. Usar Estado de revisión: Nueva / Contactar / Entrevista / Prueba / Cerrada. Escribir observaciones laborales breves en Notas internas, sin datos sensibles. Los motivos son claves de preguntas (`presencial`, `dias`, `puntualidad`, `turno`, `continuidad`). La clasificación inicial no se cambia al editar notas; es un resumen de lo declarado.

El texto de privacidad incluye contacto presencial en Malaspina 1602, Hurlingham, y comprobante. Revisar que siga siendo válido antes de abrir. Atender corrección/eliminación buscando el ID; verificar con el contacto del candidato sin pedir DNI. Eliminar la fila cuando corresponda y gestionar copias/historial según las políticas de la cuenta. No copiar postulaciones a GitHub, issues, chats o enlaces públicos.

Para cerrar la búsqueda: `RECRUITMENT_ENABLED=false` y redesplegar. GET informa cierre; POST rechaza incluso si había un formulario abierto. Para otra búsqueda: cambiar `CAMPAIGN.id`, versión, título y textos, revisar preguntas, condiciones y aviso; no reutilizar consentimiento de candidatos anteriores.

## Seguridad y límites

- API de solo recepción; GET devuelve configuración pública, nunca candidatos. No reutiliza el admin del menú.
- Allowlist de campos/opciones, límite 8 KB, validación servidor, consentimiento obligatorio, honeypot, mismo origen, errores sin detalles privados.
- Upstash: claves separadas de pedidos, máximo 10 envíos válidos por IP/hora y 500 globales/día; IP con HMAC, no texto plano. Redis debe estar disponible; ante fallo no se confirma el envío. No es defensa absoluta frente a bots distribuidos; si aparece abuso, sumar CAPTCHA/WAF antes de subir límites.
- Apps Script: secreto en propiedades, escritura bajo lock, ID estable para deduplicar reintentos. Nunca devuelve filas, evita fórmulas inyectadas. No registra payloads en consola.
- Vercel confirma solo si Apps Script devuelve `ok:true` y el mismo ID. Un timeout puede ocurrir después de escribir: reintentar sin recargar conserva ID. Si se editan respuestas después de un fallo se crea un nuevo ID y podría existir la versión anterior: revisar duplicados por teléfono en ese caso.
- Cuotas de Apps Script, disponibilidad de Google, mantenimiento de accesos y retención requieren seguimiento. No hay correos automáticos ni adjuntos.
- GitHub Pages no ejecuta `/api`: allí la página queda sin recepción. Usar el dominio servido por Vercel. No cambiar rutas/rewrites existentes sin comprobar el proyecto real.

## Verificación

Automática: `npm test` y `npm run build`. Pruebas de formulario/endpoint: opciones inválidas, requisitos, consentimiento, manipulación, origen, límites, fallos upstream, recibo y modo cerrado. Script probado con servicios simulados: no sustituye ejecución real en Google.

Antes de habilitar, en un despliegue preview con datos ficticios:
1. Abrir `/trabaja` y `/trabaja/` a 360 px; navegar radios con teclado; probar volver y corregir; enviar con número válido.
2. Confirmar EXACTAMENTE una fila en planilla privada y coincidencia del recibo; refrescar/reintentar una solicitud con el mismo ID y comprobar que no duplica.
3. Probar una incompatibilidad y una duda: motivos correctos en Sheets; experiencia no cambia disponibilidad.
4. Cortar red/forzar fallo de Apps Script: ningún éxito falso y respuestas permanecen en pantalla.
5. Verificar permisos con cuenta sin acceso; no debe ver planilla. GET API nunca contiene datos.
6. Verificar borrado con fila ficticia de más de 90 días y ejecución del trigger; retirar pruebas.
7. Abrir menú, carrito y checkout sin enviar pedidos; revisar que precios y enlaces WhatsApp no cambiaron.

No se enviaron mensajes a postulantes, no se crearon datos reales ni se configuraron secretos/Apps Script desde esta sesión.
