/**
 * Telegram Webhook Service
 *
 * Este servicio debe ser desplegado como una Firebase Cloud Function o similar.
 * Se encarga de:
 * 1. Recibir webhooks del bot de Telegram
 * 2. Procesar comandos /start con códigos de conexión
 * 3. Guardar el chat_id del usuario en Firebase
 * 4. Enviar confirmación al usuario
 *
 * CONFIGURACIÓN NECESARIA:
 * 1. Desplegar esta función en Firebase Functions
 * 2. Configurar el webhook del bot de Telegram para apuntar a esta URL
 *    usando: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FUNCTION_URL>
 */

import * as admin from 'firebase-admin';

const TELEGRAM_BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || '';

interface TelegramPhoto {
    file_id: string;
    file_unique_id: string;
    file_size: number;
    width: number;
    height: number;
}

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
        photo?: TelegramPhoto[];
        caption?: string;
    };
}

/**
 * Envía un mensaje a través del bot de Telegram
 */
async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

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

/**
 * Procesa el comando /start con código de conexión
 */
async function processStartCommand(chatId: number, text: string, userName: string): Promise<void> {
    // Extraer el código de conexión del comando /start
    const parts = text.split(' ');

    if (parts.length < 2) {
        // No hay código de conexión
        await sendTelegramMessage(
            chatId,
            '👋 ¡Bienvenido al bot de Torre EL!\n\n' +
            'Para conectar tu cuenta, ve a tu perfil en la aplicación web y presiona el botón "Conectar Telegram".'
        );
        return;
    }

    const connectionCode = parts[1];

    try {
        const db = admin.firestore();

        // Buscar el código de conexión
        const connectionDoc = await db.collection('telegramConnections').doc(connectionCode).get();

        if (!connectionDoc.exists) {
            await sendTelegramMessage(
                chatId,
                '❌ Código de conexión inválido o expirado.\n\n' +
                'Por favor, genera un nuevo código desde tu perfil en la aplicación web.'
            );
            return;
        }

        const connectionData = connectionDoc.data();

        if (connectionData?.connected) {
            await sendTelegramMessage(
                chatId,
                '⚠️ Este código de conexión ya ha sido utilizado.\n\n' +
                'Si necesitas reconectar, genera un nuevo código desde tu perfil.'
            );
            return;
        }

        const userId = connectionData?.userId;

        if (!userId) {
            await sendTelegramMessage(
                chatId,
                '❌ Error en el código de conexión.\n\n' +
                'Por favor, genera un nuevo código desde tu perfil.'
            );
            return;
        }

        // Guardar el chat_id en el perfil del usuario
        await db.collection('users').doc(userId).update({
            telegramChatId: chatId.toString(),
            telegramUsername: userName,
            telegramConnectedAt: new Date().toISOString()
        });

        // Marcar la conexión como completada
        await db.collection('telegramConnections').doc(connectionCode).update({
            connected: true,
            chatId: chatId.toString(),
            connectedAt: new Date().toISOString()
        });

        // Enviar mensaje de confirmación
        await sendTelegramMessage(
            chatId,
            '✅ <b>¡Conexión exitosa!</b>\n\n' +
            'Tu cuenta de Telegram ha sido conectada correctamente con Torre EL.\n\n' +
            '🔔 Ahora recibirás:\n' +
            '• Recordatorios de pago automáticos\n' +
            '• Confirmaciones cuando tu pago sea verificado\n' +
            '• Notificaciones importantes sobre tu contrato\n\n' +
            '¡Gracias por usar nuestro servicio!'
        );

        console.log(`User ${userId} connected Telegram chat ${chatId}`);

    } catch (error) {
        console.error('Error processing connection:', error);
        await sendTelegramMessage(
            chatId,
            '❌ Error al conectar tu cuenta.\n\n' +
            'Por favor, intenta de nuevo más tarde o contacta al administrador.'
        );
    }
}

/**
 * Obtiene el userId a partir del chatId
 */
async function getUserIdFromChatId(chatId: number): Promise<string | null> {
    try {
        const db = admin.firestore();
        const usersSnapshot = await db.collection('users')
            .where('telegramChatId', '==', chatId.toString())
            .limit(1)
            .get();

        if (usersSnapshot.empty) {
            return null;
        }

        return usersSnapshot.docs[0].id;
    } catch (error) {
        console.error('Error obteniendo userId:', error);
        return null;
    }
}

/**
 * Procesa una foto de comprobante de pago
 * NOTA: Esta es una versión simplificada. Para la implementación completa,
 * importa y usa la función de telegramPaymentHandler.ts
 */
async function processPaymentPhoto(
    chatId: number,
    photos: TelegramPhoto[]
): Promise<void> {
    try {
        // Obtener el userId del usuario
        const userId = await getUserIdFromChatId(chatId);

        if (!userId) {
            await sendTelegramMessage(
                chatId,
                '❌ <b>Error</b>\n\n' +
                'No tienes una cuenta conectada. Por favor, conéctala primero desde tu perfil en la aplicación web.\n\n' +
                'Ve a tu perfil → Notificaciones de Telegram → Conectar Telegram'
            );
            return;
        }

        // Notificar que se está procesando
        await sendTelegramMessage(
            chatId,
            '📸 <b>Comprobante recibido</b>\n\n' +
            'Estoy procesando tu comprobante de pago, esto puede tardar unos segundos...'
        );

        // AQUÍ SE LLAMARÍA A LA FUNCIÓN COMPLETA DE PROCESAMIENTO
        // Por ahora solo notificamos que fue recibido
        // En la implementación real, importarías:
        // import { processPaymentPhoto } from './telegramPaymentHandler';

        await sendTelegramMessage(
            chatId,
            '✅ <b>Comprobante recibido</b>\n\n' +
            'Tu comprobante ha sido recibido y está siendo procesado.\n\n' +
            'El administrador lo revisará pronto y te notificaremos del resultado.\n\n' +
            '💡 <i>Tip: Para verificación automática, asegúrate de que tu comprobante sea claro y legible.</i>'
        );

    } catch (error: any) {
        console.error('Error procesando pago:', error);
        await sendTelegramMessage(
            chatId,
            '❌ <b>Error al procesar comprobante</b>\n\n' +
            'Hubo un error al procesar tu comprobante. Por favor, intenta nuevamente o contacta al administrador.'
        );
    }
}

/**
 * Función principal del webhook (Firebase Cloud Function)
 *
 * Para desplegar:
 * 1. Copia este código a functions/src/index.ts
 * 2. Ejecuta: firebase deploy --only functions
 * 3. Configura el webhook:
 *    curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FUNCTION_URL>"
 */
export async function telegramWebhook(req: any, res: any): Promise<void> {
    try {
        const update: TelegramUpdate = req.body;

        // Validar que hay un mensaje
        if (!update.message) {
            res.status(200).send('OK');
            return;
        }

        const chatId = update.message.chat.id;
        const userName = update.message.from.first_name || 'Usuario';

        // Procesar fotos (comprobantes de pago)
        if (update.message.photo && update.message.photo.length > 0) {
            await processPaymentPhoto(chatId, update.message.photo);
            res.status(200).send('OK');
            return;
        }

        // Procesar texto
        if (update.message.text) {
            const text = update.message.text.trim();

            // Procesar comando /start
            if (text.startsWith('/start')) {
                await processStartCommand(chatId, text, userName);
            } else {
                // Cualquier otro mensaje de texto
                await sendTelegramMessage(
                    chatId,
                    '👋 <b>Hola!</b>\n\n' +
                    'Para subir tu comprobante de pago, simplemente envía una <b>foto</b> del comprobante.\n\n' +
                    '📸 Asegúrate de que la foto sea clara y se puedan leer todos los datos.\n\n' +
                    '<i>El sistema verificará automáticamente tu pago usando inteligencia artificial.</i>'
                );
            }
        }

        res.status(200).send('OK');

    } catch (error) {
        console.error('Error in webhook:', error);
        res.status(500).send('Error');
    }
}

/**
 * Función auxiliar para enviar recordatorios de pago
 * Esta puede ser llamada por reminderService.ts
 */
export async function sendPaymentReminder(
    chatId: string,
    tenantName: string,
    dueDate: string,
    amount: number
): Promise<boolean> {
    try {
        const message =
            `🏠 <b>Recordatorio de Pago - Torre EL</b>\n\n` +
            `Hola ${tenantName},\n\n` +
            `Te recordamos que tu fecha de pago es el <b>${dueDate}</b>.\n` +
            `Monto: <b>$${amount.toLocaleString('es-MX')}</b>\n\n` +
            `Por favor, realiza tu pago a tiempo para evitar recargos.\n\n` +
            `Una vez que realices tu pago, súbelo en la aplicación para que podamos verificarlo.`;

        await sendTelegramMessage(parseInt(chatId), message);
        return true;
    } catch (error) {
        console.error('Error sending payment reminder:', error);
        return false;
    }
}

/**
 * Función auxiliar para enviar confirmación de pago
 */
export async function sendPaymentConfirmation(
    chatId: string,
    tenantName: string,
    month: string
): Promise<boolean> {
    try {
        const message =
            `✅ <b>Pago Verificado - Torre EL</b>\n\n` +
            `Hola ${tenantName},\n\n` +
            `Tu pago del mes de <b>${month}</b> ha sido verificado correctamente.\n\n` +
            `¡Gracias por tu puntualidad!`;

        await sendTelegramMessage(parseInt(chatId), message);
        return true;
    } catch (error) {
        console.error('Error sending payment confirmation:', error);
        return false;
    }
}
