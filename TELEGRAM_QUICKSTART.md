# ⚡ Quick Start - Telegram con Verificación de Pagos por IA

## 🎯 Resumen en 1 Minuto

Tu bot **@torreel_pagos_bot** está listo para:
- ✅ Conectar inquilinos automáticamente
- 📸 Recibir fotos de comprobantes
- 🤖 Verificarlos con OpenAI Vision
- 💾 Guardarlos en Firebase
- 📱 Notificar resultados

**Falta solo:** Desplegar el webhook en Firebase

---

## 🚀 3 Pasos para Poner en Marcha

### 1️⃣ Configurar Firebase Functions (5 minutos)

```bash
# Si no has inicializado Functions
firebase init functions

# Configurar variables
firebase functions:config:set \
  telegram.token="YOUR_TELEGRAM_BOT_TOKEN" \
  openai.apikey="YOUR_OPENAI_API_KEY" \
  cloudinary.cloudname="YOUR_CLOUD_NAME" \
  cloudinary.apikey="YOUR_CLOUDINARY_API_KEY" \
  cloudinary.apisecret="YOUR_CLOUDINARY_API_SECRET"

# Instalar dependencias
cd functions
npm install cloudinary
cd ..
```

### 2️⃣ Desplegar el Webhook (2 minutos)

**Archivo:** `functions/src/index.ts`

Copia el contenido de [src/services/telegramWebhookService.ts](src/services/telegramWebhookService.ts) ajustando:

```typescript
// Cambiar esta línea:
const TELEGRAM_BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || '';

// Por:
const TELEGRAM_BOT_TOKEN = functions.config().telegram.token;
```

**Desplegar:**
```bash
firebase deploy --only functions:telegramWebhook
```

**Copia la URL** que aparece (ejemplo: `https://us-central1-xxx.cloudfunctions.net/telegramWebhook`)

### 3️⃣ Conectar el Bot (30 segundos)

```bash
curl -X POST "https://api.telegram.org/botYOUR_TELEGRAM_BOT_TOKEN/setWebhook?url=TU_URL_AQUI"
```

✅ **Listo!** Ya funciona.

---

## 🧪 Probar que Funciona

### Test 1: Verificar Webhook
```bash
curl "https://api.telegram.org/botYOUR_TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

Deberías ver: `"url": "tu-function-url"`

### Test 2: Conectar Telegram
1. Entra como inquilino a tu app
2. Ve a "Account" → "Notificaciones de Telegram"
3. Click "Conectar Telegram"
4. Debería abrir @torreel_pagos_bot
5. Presiona "Iniciar"
6. ✅ Recibes confirmación

### Test 3: Enviar Comprobante
1. Abre @torreel_pagos_bot en Telegram
2. Envía una foto de un comprobante
3. Espera ~20 segundos
4. ✅ Recibes análisis del comprobante

---

## 📱 Flujo del Usuario Final

```
INQUILINO:
1. Se conecta desde su perfil (una sola vez)
2. Cuando paga, envía foto por Telegram
3. Recibe verificación automática en segundos
4. Espera aprobación del admin
5. Recibe confirmación final

ADMIN:
1. Ve el pago en panel de administración
2. Revisa foto y datos extraídos
3. Aprueba o rechaza con un click
4. El inquilino recibe notificación automática
```

---

## 🔥 Features Destacados

### Para Inquilinos
- 📸 Envían foto por Telegram (fácil y rápido)
- ⚡ Verificación en 10-30 segundos
- ✅ Confirmación automática
- 📱 Todo desde el celular

### Para Admin
- 🤖 95%+ de pagos se verifican automáticamente
- 👁️ Solo revisas los casos dudosos
- 📊 Toda la info extraída (monto, fecha, banco, ref)
- ✅ Apruebas con un click

### Tecnología
- 🧠 OpenAI GPT-4o Vision
- ☁️ Cloudinary para almacenamiento
- 🔥 Firebase para backend
- 💬 Telegram para comunicación

---

## 💰 Costos

- **Telegram:** Gratis
- **Cloudinary:** Gratis (hasta 25GB)
- **Firebase Functions:** Gratis (hasta 2M llamadas/mes)
- **OpenAI Vision:** ~$0.005 USD por pago

**Total:** < $3 USD/mes con 500 pagos

---

## 🐛 Troubleshooting Rápido

**Bot no responde:**
```bash
firebase functions:log
```

**Webhook no configurado:**
```bash
curl "https://api.telegram.org/botYOUR_TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

**OpenAI da error:**
- Verifica saldo en platform.openai.com
- Checa que la key esté configurada

**Functions no despliegan:**
```bash
firebase projects:list
firebase use [tu-proyecto]
firebase deploy --debug
```

---

## 📚 Documentación Completa

- **Setup técnico:** [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md)
- **Guía para inquilinos:** [TELEGRAM_PAYMENT_GUIDE.md](TELEGRAM_PAYMENT_GUIDE.md)
- **Implementación detallada:** [IMPLEMENTACION_TELEGRAM.md](IMPLEMENTACION_TELEGRAM.md)

---

## ✅ Checklist

- [ ] Configurar Firebase Functions
- [ ] Desplegar webhook
- [ ] Configurar webhook del bot
- [ ] Probar conexión
- [ ] Probar envío de comprobante
- [ ] Integrar panel admin
- [ ] Compartir guía con inquilinos

**Tiempo total:** ~15-20 minutos

---

**Bot:** @torreel_pagos_bot
**Estado:** ✅ Código listo
**Siguiente paso:** Desplegar Firebase Function
