# Cloud Functions - Torre El

## Funciones Disponibles

### sendContractEmail
Envía automáticamente el contrato por correo cuando se crea un documento en la colección `emailRequests`.

### resendContractEmail
Endpoint HTTP para reenviar un correo (útil para reintentos manuales).

## Configuración

### 1. Configurar Gmail App Password

Para usar Gmail como servicio de envío, necesitas crear una "App Password":

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Activa la verificación en 2 pasos si no la tienes
3. Ve a Seguridad > Contraseñas de aplicaciones
4. Crea una nueva contraseña para "Correo" en "Otro dispositivo"
5. Copia la contraseña generada (16 caracteres)

### 2. Configurar Firebase Functions

Ejecuta estos comandos para configurar las credenciales:

```bash
# Configurar email de Gmail
firebase functions:config:set gmail.email="tu-email@gmail.com"

# Configurar App Password de Gmail
firebase functions:config:set gmail.password="xxxx-xxxx-xxxx-xxxx"

# Verificar la configuración
firebase functions:config:get
```

### 3. Desplegar las funciones

```bash
# Desde la raíz del proyecto
firebase deploy --only functions

# O solo una función específica
firebase deploy --only functions:sendContractEmail
```

## Desarrollo Local

### Emular funciones localmente

```bash
# Obtener configuración para emulador
firebase functions:config:get > .runtimeconfig.json

# Iniciar emulador
npm run serve
```

### Ver logs

```bash
firebase functions:log
```

## Estructura de emailRequests

Cuando se crea un documento en `emailRequests`, debe tener esta estructura:

```javascript
{
  contractId: "abc123",        // ID del contrato
  tenantId: "user123",         // ID del inquilino
  recipientEmail: "email@example.com", // Email destino
  type: "contract",            // Tipo de email
  status: "pending",           // Estado inicial
  createdAt: "2024-01-01..."   // Fecha de creación
}
```

La función actualizará el documento con:
- `status: "sent"` si se envió correctamente
- `status: "error"` si hubo un error
- `sentAt` o `errorAt` con la fecha correspondiente
- `error` con el mensaje de error si aplica

## Alternativas a Gmail

Si prefieres usar otro servicio de email (recomendado para producción):

### SendGrid
```typescript
import * as sgMail from '@sendgrid/mail';
sgMail.setApiKey(functions.config().sendgrid.key);
```

### Mailgun
```typescript
import * as mailgun from 'mailgun-js';
const mg = mailgun({ apiKey: functions.config().mailgun.key, domain: 'tu-dominio.com' });
```
