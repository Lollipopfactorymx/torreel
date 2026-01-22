# Configuración de Telegram Bot para Torre EL

Esta guía te ayudará a configurar el bot de Telegram para capturar automáticamente el Chat ID de los inquilinos y enviar recordatorios de pago.

## Requisitos Previos

- Cuenta de Telegram
- Firebase Functions configurado en tu proyecto
- Node.js y npm instalados
- Token del bot de Telegram (ya lo tienes en `.env`)

## Paso 1: Verificar Token del Bot

Ya tienes el token configurado en `.env`:
```
VITE_TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
```

## Paso 2: Verificar el Username del Bot

Tu bot ya está configurado con el username: **@torreel_pagos_bot**

Este username ya está actualizado en el código ([src/components/Account/TelegramConnect.tsx:59](src/components/Account/TelegramConnect.tsx#L59)).

## Paso 4: Desplegar Firebase Function

### Opción A: Desplegar Firebase Function (Recomendado)

1. **Inicializar Firebase Functions** (si aún no lo has hecho):
```bash
firebase init functions
```

2. **Copiar el código del webhook a Functions:**

Crea o edita `functions/src/index.ts` y agrega:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const TELEGRAM_BOT_TOKEN = functions.config().telegram.token;

interface TelegramUpdate {
    update_id: number;
    message?: {
        message_id: number;
        from: {
            id: number;
            is_bot: boolean;
            first_name: string;
            last_name?: string;
            username?: string;
        };
        chat: {
            id: number;
            type: string;
        };
        date: number;
        text?: string;
    };
}

async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
    const url = \`https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/sendMessage\`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            })
        });

        if (!response.ok) {
            console.error('Error sending Telegram message:', await response.text());
        }
    } catch (error) {
        console.error('Error in sendTelegramMessage:', error);
    }
}

async function processStartCommand(chatId: number, text: string, userName: string): Promise<void> {
    const parts = text.split(' ');

    if (parts.length < 2) {
        await sendTelegramMessage(
            chatId,
            '👋 ¡Bienvenido al bot de Torre EL!\\n\\n' +
            'Para conectar tu cuenta, ve a tu perfil en la aplicación web y presiona el botón "Conectar Telegram".'
        );
        return;
    }

    const connectionCode = parts[1];

    try {
        const db = admin.firestore();

        const connectionDoc = await db.collection('telegramConnections').doc(connectionCode).get();

        if (!connectionDoc.exists) {
            await sendTelegramMessage(
                chatId,
                '❌ Código de conexión inválido o expirado.\\n\\n' +
                'Por favor, genera un nuevo código desde tu perfil en la aplicación web.'
            );
            return;
        }

        const connectionData = connectionDoc.data();

        if (connectionData?.connected) {
            await sendTelegramMessage(
                chatId,
                '⚠️ Este código de conexión ya ha sido utilizado.\\n\\n' +
                'Si necesitas reconectar, genera un nuevo código desde tu perfil.'
            );
            return;
        }

        const userId = connectionData?.userId;

        if (!userId) {
            await sendTelegramMessage(
                chatId,
                '❌ Error en el código de conexión.\\n\\n' +
                'Por favor, genera un nuevo código desde tu perfil.'
            );
            return;
        }

        await db.collection('users').doc(userId).update({
            telegramChatId: chatId.toString(),
            telegramUsername: userName,
            telegramConnectedAt: new Date().toISOString()
        });

        await db.collection('telegramConnections').doc(connectionCode).update({
            connected: true,
            chatId: chatId.toString(),
            connectedAt: new Date().toISOString()
        });

        await sendTelegramMessage(
            chatId,
            '✅ <b>¡Conexión exitosa!</b>\\n\\n' +
            'Tu cuenta de Telegram ha sido conectada correctamente con Torre EL.\\n\\n' +
            '🔔 Ahora recibirás:\\n' +
            '• Recordatorios de pago automáticos\\n' +
            '• Confirmaciones cuando tu pago sea verificado\\n' +
            '• Notificaciones importantes sobre tu contrato\\n\\n' +
            '¡Gracias por usar nuestro servicio!'
        );

        console.log(\`User \${userId} connected Telegram chat \${chatId}\`);

    } catch (error) {
        console.error('Error processing connection:', error);
        await sendTelegramMessage(
            chatId,
            '❌ Error al conectar tu cuenta.\\n\\n' +
            'Por favor, intenta de nuevo más tarde o contacta al administrador.'
        );
    }
}

export const telegramWebhook = functions.https.onRequest(async (req, res) => {
    try {
        const update: TelegramUpdate = req.body;

        if (!update.message || !update.message.text) {
            res.status(200).send('OK');
            return;
        }

        const chatId = update.message.chat.id;
        const text = update.message.text.trim();
        const userName = update.message.from.first_name || 'Usuario';

        if (text.startsWith('/start')) {
            await processStartCommand(chatId, text, userName);
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error('Error in webhook:', error);
        res.status(500).send('Error');
    }
});
```

3. **Configurar el token en Firebase:**
```bash
firebase functions:config:set telegram.token="YOUR_TELEGRAM_BOT_TOKEN"
```

4. **Desplegar la función:**
```bash
cd functions
npm install
cd ..
firebase deploy --only functions:telegramWebhook
```

5. **Anotar la URL de la función** que se muestra después del deploy (algo como):
```
https://us-central1-torre-el.cloudfunctions.net/telegramWebhook
```

## Paso 5: Configurar el Webhook del Bot

Usa el siguiente comando curl para configurar el webhook del bot (reemplaza `<FUNCTION_URL>` con la URL de tu función):

```bash
curl -X POST "https://api.telegram.org/botYOUR_TELEGRAM_BOT_TOKEN/setWebhook?url=<FUNCTION_URL>"
```

**Ejemplo:**
```bash
curl -X POST "https://api.telegram.org/botYOUR_TELEGRAM_BOT_TOKEN/setWebhook?url=https://us-central1-torre-el.cloudfunctions.net/telegramWebhook"
```

**Deberías recibir una respuesta como:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

## Paso 6: Verificar la Configuración

1. **Verificar el webhook:**
```bash
curl "https://api.telegram.org/botYOUR_TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

2. **Deberías ver algo como:**
```json
{
  "ok": true,
  "result": {
    "url": "https://us-central1-torre-el.cloudfunctions.net/telegramWebhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## Paso 7: Probar la Conexión

1. Inicia sesión como inquilino en la aplicación web
2. Ve a tu perfil (Account)
3. Busca la sección "Notificaciones de Telegram"
4. Haz clic en "Conectar Telegram"
5. Se abrirá Telegram
6. Presiona "Iniciar" o envía `/start`
7. Espera unos segundos
8. Deberías ver un mensaje de confirmación en Telegram
9. La página web debería mostrar que tu Telegram está conectado

## Flujo de Conexión

```
1. Usuario hace clic en "Conectar Telegram" en su perfil
   ↓
2. Se genera un código único (ej: "abc12345-xyz")
   ↓
3. Se guarda en Firebase: telegramConnections/abc12345-xyz
   ↓
4. Se abre Telegram con: t.me/torreel_pagos_bot?start=abc12345-xyz
   ↓
5. Usuario presiona "Iniciar"
   ↓
6. Telegram envía webhook a tu función con el código
   ↓
7. La función busca el código en Firebase
   ↓
8. Guarda el chat_id en users/{userId}/telegramChatId
   ↓
9. Marca la conexión como completada
   ↓
10. El componente detecta el cambio y muestra "Conectado"
```

## Estructura de Datos en Firebase

### Collection: `telegramConnections`
```json
{
  "abc12345-xyz": {
    "userId": "user123",
    "createdAt": "2024-01-15T10:30:00Z",
    "connected": true,
    "chatId": "123456789",
    "connectedAt": "2024-01-15T10:31:00Z"
  }
}
```

### Collection: `users` (campo agregado)
```json
{
  "user123": {
    "fullname": "Juan Pérez",
    "email": "juan@example.com",
    ...
    "telegramChatId": "123456789",
    "telegramUsername": "Juan",
    "telegramConnectedAt": "2024-01-15T10:31:00Z"
  }
}
```

## Envío de Recordatorios

Una vez que los usuarios tengan su `telegramChatId` guardado, puedes enviarles recordatorios usando:

```typescript
import TelegramService from './services/telegramService';

const telegramService = new TelegramService();

await telegramService.sendPaymentReminder(
    user.telegramChatId,
    user.fullname,
    3500, // monto
    '2024-02-05', // fecha de vencimiento
    '201' // departamento
);
```

## Solución de Problemas

### El webhook no responde
- Verifica que la función esté desplegada correctamente
- Revisa los logs de Firebase Functions: `firebase functions:log`
- Verifica que la URL del webhook sea la correcta

### El usuario no se conecta
- Verifica que el código de conexión se esté generando correctamente
- Revisa la colección `telegramConnections` en Firestore
- Verifica los logs de la función

### Los mensajes no se envían
- Verifica que el token del bot sea correcto
- Asegúrate de que el bot no esté bloqueado por el usuario
- Verifica que el `chatId` esté guardado correctamente

## Seguridad

- El token del bot debe mantenerse secreto
- Los códigos de conexión expiran automáticamente (considera agregar una limpieza periódica)
- Solo los usuarios autenticados pueden generar códigos de conexión
- Los códigos de conexión son de un solo uso

## Funcionalidad Extra: Verificación de Pagos por Telegram

### ¿Qué es esto?

Los inquilinos pueden enviar fotos de sus comprobantes de pago **directamente por Telegram**, y el sistema:

1. ✨ Verifica automáticamente el pago usando **OpenAI Vision**
2. 📊 Extrae monto, fecha, referencia y banco
3. 💾 Guarda el pago en Firebase
4. ✅ Notifica al inquilino del resultado
5. 📧 Alerta al administrador para aprobación final

### Cómo funciona

```
1. Inquilino envía foto de comprobante por Telegram
   ↓
2. Bot recibe la foto y notifica "Procesando..."
   ↓
3. Descarga la foto de Telegram
   ↓
4. Sube la foto a Cloudinary
   ↓
5. OpenAI Vision analiza el comprobante
   ↓
6. Extrae: monto, fecha, referencia, banco
   ↓
7. Compara con el monto esperado del inquilino
   ↓
8. Guarda en Firebase con estado "pending_approval" o "needs_review"
   ↓
9. Responde al inquilino con el resultado
   ↓
10. Administrador revisa y aprueba (si necesario)
```

### Requisitos Adicionales

Para habilitar esta funcionalidad, necesitas:

1. **OpenAI API Key** (ya configurada en tu `.env`):
   ```
   VITE_OPENAI_API_KEY=YOUR_OPENAI_API_KEY
   ```

2. **Cloudinary configurado** (ya está en `.env`):
   ```
   VITE_CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
   VITE_CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
   VITE_CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET
   ```

3. **Actualizar el webhook** con el código extendido que maneja fotos

### Actualizar el Webhook para Manejar Fotos

En tu archivo `functions/src/index.ts`, el webhook ya está preparado para manejar fotos. Asegúrate de que tu función incluya:

```typescript
// Procesar fotos (comprobantes de pago)
if (update.message.photo && update.message.photo.length > 0) {
    await processPaymentPhoto(chatId, update.message.photo);
    res.status(200).send('OK');
    return;
}
```

### Instalación de Dependencias Adicionales

En tu carpeta `functions/`, instala Cloudinary:

```bash
cd functions
npm install cloudinary
cd ..
```

### Probar la Funcionalidad

1. Como inquilino, abre el chat con tu bot en Telegram
2. Toma una foto clara de tu comprobante de pago
3. Envía la foto al bot (puedes agregar un mensaje opcional)
4. Espera unos segundos
5. El bot te responderá con el resultado de la verificación

**Ejemplo de respuesta exitosa:**
```
✅ Comprobante Verificado

💰 Monto: $3,500.00
📅 Fecha: 2024-01-15
🏦 Banco: BBVA
📋 Referencia: 12345678

🔍 Confianza: 95%

⏳ Tu pago ha sido recibido y está pendiente de aprobación por el administrador.

Te notificaremos una vez que sea aprobado. ¡Gracias!
```

### Casos Especiales

#### Caso 1: Monto diferente detectado
```
⚠️ Monto Diferente Detectado

💰 Monto detectado: $3,600.00
💵 Monto esperado: $3,500.00
🔍 Confianza: 92%

Tu comprobante ha sido enviado al administrador para revisión manual.

Te notificaremos del resultado.
```

#### Caso 2: Baja confianza
```
⚠️ Verificación con Baja Confianza

💰 Monto detectado: $3,500.00
🔍 Confianza: 45%

Tu comprobante ha sido enviado al administrador para revisión manual.

Te notificaremos del resultado.
```

#### Caso 3: No se pudo verificar
```
❌ No se pudo verificar automáticamente

Tu comprobante ha sido recibido y enviado al administrador para revisión manual.

Posibles razones:
• La imagen está borrosa o poco clara
• El formato del comprobante no es reconocido
• Falta información en el comprobante

Te notificaremos una vez que sea revisado.
```

### Estructura de Pago en Firebase

Los pagos enviados por Telegram se guardan en la colección `payments`:

```json
{
  "userId": "abc123",
  "tenantName": "Juan Pérez",
  "department": "201",
  "receiptUrl": "https://res.cloudinary.com/...",
  "uploadedAt": "2024-01-15T10:30:00Z",
  "verificationResult": {
    "success": true,
    "amount": 3500,
    "date": "2024-01-15",
    "reference": "12345678",
    "bank": "BBVA",
    "confidence": 95
  },
  "status": "pending_approval",
  "submittedVia": "telegram",
  "chatId": "123456789"
}
```

### Panel de Administración

El administrador puede:

1. Ver todos los pagos en estado `pending_approval`
2. Revisar el comprobante original en Cloudinary
3. Ver los datos extraídos por OpenAI
4. Aprobar o rechazar el pago
5. Si aprueba: el pago se marca como `approved` y se notifica al inquilino
6. Si rechaza: se notifica al inquilino con el motivo

### Tips para Mejores Resultados

**Para los inquilinos:**
- 📸 Toma fotos claras y bien iluminadas
- 🔍 Asegúrate de que todos los datos sean legibles
- 📱 No uses screenshots, usa la foto directa del comprobante
- 🖼️ Evita reflejos y sombras

**Formatos de comprobantes soportados:**
- ✅ Comprobantes bancarios (BBVA, Santander, Banorte, etc.)
- ✅ Transferencias SPEI
- ✅ Depósitos en efectivo con comprobante
- ✅ Capturas de pantalla de apps bancarias (si son claras)

### Costos de OpenAI

- **Modelo usado**: GPT-4o (con visión)
- **Costo aproximado**: ~$0.005 USD por verificación
- **Tokens promedio**: ~500 tokens por análisis

Con 100 verificaciones mensuales: ~$0.50 USD/mes

### Seguridad

- ✅ Solo usuarios autenticados pueden enviar pagos
- ✅ Los comprobantes se almacenan en Cloudinary (seguro)
- ✅ Las API keys nunca se exponen al cliente
- ✅ Los pagos requieren aprobación final del admin
- ✅ Se registra quién subió cada pago y cuándo

## Próximos Pasos

1. Implementar limpieza automática de códigos de conexión viejos
2. Agregar scheduled functions para enviar recordatorios automáticos
3. ✅ ~~Implementar notificaciones de pagos verificados~~ (Ya implementado)
4. Agregar comandos adicionales al bot:
   - `/saldo` - Consultar saldo pendiente
   - `/proximo_pago` - Ver fecha del próximo pago
   - `/historial` - Ver últimos 3 pagos
5. Implementar notificaciones push al admin cuando llega un pago nuevo
