# Pruebas de la Tool `send_email` (Componente C)

Este documento explica cómo probar el microservicio genérico de tools (`agent-factory-tools`) usando un cliente de API como Postman o cURL.

## Prerrequisitos

1. El servidor `agent-factory-tools` debe estar corriendo (localmente o desplegado). Si lo ejecutas localmente por defecto puede exponerse en `http://localhost:8089`.
2. Debes tener configuradas las variables de entorno en el servidor (`.env`):
   - `SENDGRID_API_KEY`
   - `EMAIL_HOST` (host SMTP)
   - `EMAIL_FROM` (dirección "from" por defecto)

> Nota: Asegúrate de que las credenciales tengan permisos para enviar correos desde la dirección `EMAIL_FROM`.

## Endpoint

- URL: `TU_URL_DE_DIGITALOCEAN`/api/tools/send-email
- Método: `POST`
- Content-Type: `application/json`

En local (ejemplo): `http://localhost:8089/api/tools/send-email`

## Lógica de la Tool

La tool espera un único objeto JSON en el `req.body`. Este payload contiene tanto la configuración (ej. a quién enviar) como los datos (ej. nombre del cliente).

El controlador realiza los siguientes pasos:

1. Recibe el payload completo.
2. Extrae las claves de configuración obligatorias: `to_email`, `subject_template`, y `body_template`.
3. Usa el resto de claves (por ejemplo `nombre`, `telefono`) como datos para hacer un "mail merge".
4. Renderiza las plantillas, reemplazando `{{nombre}}` por el valor correspondiente.
5. Envía el email usando `nodemailer`/SendGrid.

Si faltan campos de configuración obligatorios, la tool responde con un error descriptivo.

## Ejemplo de Prueba (cURL)

Este comando simula una llamada de un servicio externo a nuestra tool genérica.

```bash
curl -X POST 'https://tu-url-de-tools.ondigitalocean.app/api/tools/send-email' \
-H 'Content-Type: application/json' \
-d '{
  "to_email": "supervisor@empresa.com",
  "cc_email": "copia@empresa.com",
  "subject_template": "Nuevo Lead de Prueba: {{nombre}}",
  "body_template": "<h1>Nuevo Lead</h1><p>Nombre: {{nombre}}</p><p>Teléfono: {{telefono}}</p><p>Notas: {{notas_adicionales}}</p>",
  
  "nombre": "Pepito Pérez (Test)",
  "telefono": "555-1234",
  "notas_adicionales": "Quiere una limpieza dental."
}'
```

Respuesta esperada (éxito):

```json
{
  "success": true,
  "message": "Email enviado correctamente a ejemplo@empresa.com."
}
```

Respuesta esperada (error de configuración):

Si faltan `to_email`, `subject_template` o `body_template` la respuesta debe ser:

```json
{
  "success": false,
  "error": "Configuración de la tool incompleta. Faltan to_email, subject_template, o body_template."
}
```

## Ejemplo local (localhost)

Si ejecutas el servidor en `http://localhost:8089`, usa:

```bash
curl -X POST 'http://localhost:8089/api/tools/send-email' \
-H 'Content-Type: application/json' \
-d '{ "to_email": "tu@correo.local", "subject_template": "Prueba {{nombre}}", "body_template": "Hola {{nombre}}", "nombre": "Test Local" }'
```

## Probar con Postman

1. Crear una nueva petición `POST` a `https://tu-url-de-tools.ondigitalocean.app/api/tools/send-email` (o `http://localhost:8089/...`).
2. En la pestaña "Body" seleccionar `raw` -> `JSON` y pegar el JSON de ejemplo.
3. Enviar y revisar la respuesta y el inbox del destinatario.

## Integración con el Frontend (Componente D)

Cuando un usuario desde la UI arrastra la tool `send_email` a un agente:

- La UI debe consultar el `schema_template` genérico (tabla `admin_tools`) y renderizar un formulario de configuración.
- Los campos marcados como `constant_value` (por ejemplo `to_email`, `subject_template`, `body_template`) deben solicitarse al usuario y almacenarse como configuración del tool.
- Los campos `llm_prompt` (por ejemplo `nombre`, `telefono`) deben mostrarse para que el diseñador del agente sepa qué datos pedir al usuario o al LLM.
- La configuración resultante debe guardarse en Supabase (tabla `agents`, columna `tools_config` tipo `jsonb`) vinculada al agente.
- La "Fábrica" (Componente A) usará esa configuración para construir el JSON final que enviará a ElevenLabs u otros servicios durante el despliegue.

## Casos de fallo y chequeos recomendados

- Revisar que `EMAIL_FROM` esté permitida en el proveedor SMTP/SendGrid.
- Comprobar errores en los logs del servicio cuando el envío falla (credenciales, bloqueo por proveedor, formato del correo).
- Verificar que las plantillas incluyan las llaves correctas `{{campo}}` y que esos campos existan en el payload.

## Resumen rápido

- Endpoint: `POST /api/tools/send-email`
- Enviar un JSON con `to_email`, `subject_template`, `body_template` y los campos a mergear.
- Revisar respuestas JSON de éxito/fracaso y los logs/cola de envío si hay problemas.
