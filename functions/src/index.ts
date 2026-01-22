/**
 * Firebase Functions - Telegram Webhook Handler
 * Torre EL - Sistema de verificación de pagos con IA
 */

import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';

// Initialize Firebase Admin
admin.initializeApp();

// Definir secretos usando Secret Manager
const telegramToken = defineSecret('TELEGRAM_TOKEN');
const openaiApiKey = defineSecret('OPENAI_API_KEY');
const cloudinaryCloudName = defineSecret('CLOUDINARY_CLOUD_NAME');
const cloudinaryApiKey = defineSecret('CLOUDINARY_API_KEY');
const cloudinaryApiSecret = defineSecret('CLOUDINARY_API_SECRET');

// Configuración desde Secret Manager
const getConfig = () => ({
    telegramToken: telegramToken.value(),
    openaiApiKey: openaiApiKey.value(),
    cloudinaryCloudName: cloudinaryCloudName.value(),
    cloudinaryApiKey: cloudinaryApiKey.value(),
    cloudinaryApiSecret: cloudinaryApiSecret.value()
});

// Interfaces
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

interface PaymentVerificationResult {
    success: boolean;
    amount?: number;
    date?: string;
    reference?: string;
    bank?: string;
    confidence: number;
    error?: string;
}

// Función para enviar mensajes de Telegram
async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
    const config = getConfig();
    const url = `https://api.telegram.org/bot${config.telegramToken}/sendMessage`;

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

// Obtener userId desde chatId
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

// Procesar comando /start
async function processStartCommand(chatId: number, text: string, userName: string): Promise<void> {
    const parts = text.split(' ');

    if (parts.length < 2) {
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

// Descargar foto de Telegram
async function downloadTelegramPhoto(fileId: string): Promise<Buffer> {
    const config = getConfig();
    const fileInfoUrl = `https://api.telegram.org/bot${config.telegramToken}/getFile?file_id=${fileId}`;
    const fileInfoResponse = await fetch(fileInfoUrl);
    const fileInfo = await fileInfoResponse.json() as { ok: boolean; result: { file_path: string } };

    if (!fileInfo.ok) {
        throw new Error('No se pudo obtener información del archivo');
    }

    const filePath = fileInfo.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${config.telegramToken}/${filePath}`;
    const fileResponse = await fetch(fileUrl);
    const arrayBuffer = await fileResponse.arrayBuffer();

    return Buffer.from(arrayBuffer);
}

// Subir a Cloudinary
async function uploadToCloudinary(imageBuffer: Buffer, userId: string): Promise<string> {
    const config = getConfig();
    
    cloudinary.config({
        cloud_name: config.cloudinaryCloudName,
        api_key: config.cloudinaryApiKey,
        api_secret: config.cloudinaryApiSecret
    });

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `torre-el/payments/${userId}`,
                resource_type: 'image',
                format: 'jpg'
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else if (result) {
                    resolve(result.secure_url);
                } else {
                    reject(new Error('No result from Cloudinary'));
                }
            }
        );

        uploadStream.end(imageBuffer);
    });
}

// Verificar pago con OpenAI Vision
async function verifyPaymentWithAI(imageUrl: string, expectedAmount: number): Promise<PaymentVerificationResult> {
    const config = getConfig();
    
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.openaiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `Eres un asistente especializado en analizar comprobantes de pago bancarios mexicanos.
                        Extrae la siguiente información del comprobante:
                        - Monto total de la transferencia (en pesos mexicanos)
                        - Fecha de la transacción
                        - Número de referencia o folio
                        - Nombre del banco emisor

                        Responde SOLO en formato JSON con esta estructura exacta:
                        {
                            "amount": número (sin símbolos, solo el valor numérico),
                            "date": "YYYY-MM-DD",
                            "reference": "número de referencia",
                            "bank": "nombre del banco",
                            "confidence": número del 0 al 100 indicando qué tan seguro estás de la extracción
                        }

                        Si no puedes identificar algún campo, usa null.
                        El monto esperado es aproximadamente $${expectedAmount} MXN.`
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Analiza este comprobante de pago y extrae la información solicitada.'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageUrl,
                                    detail: 'high'
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const errorData = await response.json() as { error?: { message?: string } };
            return {
                success: false,
                confidence: 0,
                error: `Error de API: ${errorData.error?.message || 'Error desconocido'}`
            };
        }

        const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return {
                success: false,
                confidence: 0,
                error: 'No se recibió respuesta de la IA'
            };
        }

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return {
                success: false,
                confidence: 0,
                error: 'Respuesta no válida de la IA'
            };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            success: parsed.amount !== null,
            amount: parsed.amount ? parseFloat(parsed.amount) : undefined,
            date: parsed.date || undefined,
            reference: parsed.reference || undefined,
            bank: parsed.bank || undefined,
            confidence: parsed.confidence || 0
        };
    } catch (error) {
        console.error('Error al verificar comprobante:', error);
        return {
            success: false,
            confidence: 0,
            error: error instanceof Error ? error.message : 'Error al procesar el comprobante'
        };
    }
}

// Procesar foto de pago
async function processPaymentPhoto(chatId: number, photos: TelegramPhoto[]): Promise<void> {
    try {
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

        await sendTelegramMessage(
            chatId,
            '📸 <b>Comprobante recibido</b>\n\n' +
            'Estoy procesando tu comprobante de pago, esto puede tardar unos segundos...'
        );

        const bestPhoto = photos[photos.length - 1];
        const photoBuffer = await downloadTelegramPhoto(bestPhoto.file_id);
        const cloudinaryUrl = await uploadToCloudinary(photoBuffer, userId);

        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (!userData) {
            await sendTelegramMessage(
                chatId,
                '❌ <b>Error</b>\n\n' +
                'No se encontró tu información de usuario.'
            );
            return;
        }

        const expectedAmount = userData.amount || 0;
        const verification = await verifyPaymentWithAI(cloudinaryUrl, expectedAmount);

        const paymentData = {
            userId: userId,
            tenantName: userData.fullname || 'Desconocido',
            department: userData.department || 'N/A',
            receiptUrl: cloudinaryUrl,
            uploadedAt: new Date().toISOString(),
            verificationResult: verification,
            status: verification.success && verification.confidence >= 70 ? 'pending_approval' : 'needs_review',
            submittedVia: 'telegram',
            chatId: chatId.toString()
        };

        await db.collection('payments').add(paymentData);

        const formatCurrency = (n: number) =>
            new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

        if (verification.success && verification.amount) {
            const amountMatches = Math.abs(verification.amount - expectedAmount) <= (expectedAmount * 0.01);

            if (amountMatches && verification.confidence >= 70) {
                await sendTelegramMessage(
                    chatId,
                    '✅ <b>Comprobante Verificado</b>\n\n' +
                    `💰 Monto: ${formatCurrency(verification.amount)}\n` +
                    `📅 Fecha: ${verification.date || 'No detectada'}\n` +
                    `🏦 Banco: ${verification.bank || 'No detectado'}\n` +
                    `📋 Referencia: ${verification.reference || 'No detectada'}\n\n` +
                    `🔍 Confianza: ${verification.confidence}%\n\n` +
                    '⏳ Tu pago está <b>pendiente de aprobación</b> por el administrador.\n\n' +
                    'Te notificaremos una vez que sea aprobado. ¡Gracias!'
                );
            } else {
                await sendTelegramMessage(
                    chatId,
                    '⚠️ <b>Requiere Revisión Manual</b>\n\n' +
                    'Tu comprobante ha sido enviado al administrador para revisión.\n\n' +
                    'Te notificaremos del resultado.'
                );
            }
        } else {
            await sendTelegramMessage(
                chatId,
                '❌ <b>No se pudo verificar automáticamente</b>\n\n' +
                'Tu comprobante ha sido recibido y enviado al administrador para revisión manual.\n\n' +
                'Te notificaremos una vez que sea revisado.'
            );
        }

    } catch (error) {
        console.error('Error procesando pago:', error);
        await sendTelegramMessage(
            chatId,
            '❌ <b>Error al procesar comprobante</b>\n\n' +
            'Hubo un error. Por favor, intenta nuevamente.'
        );
    }
}

// Webhook principal - Firebase Functions v2 con Secret Manager
export const telegramWebhook = onRequest(
    {
        secrets: [telegramToken, openaiApiKey, cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret],
        region: 'us-central1'
    },
    async (req, res) => {
    try {
        const update: TelegramUpdate = req.body;

        if (!update.message) {
            res.status(200).send('OK');
            return;
        }

        const chatId = update.message.chat.id;
        const userName = update.message.from.first_name || 'Usuario';

        // Procesar fotos
        if (update.message.photo && update.message.photo.length > 0) {
            await processPaymentPhoto(chatId, update.message.photo);
            res.status(200).send('OK');
            return;
        }

        // Procesar texto
        if (update.message.text) {
            const text = update.message.text.trim();

            if (text.startsWith('/start')) {
                await processStartCommand(chatId, text, userName);
            } else {
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
});

// Función para verificar comprobantes de pago desde el frontend
export const verifyPaymentReceipt = onRequest(
    {
        secrets: [openaiApiKey],
        region: 'us-central1',
        cors: true
    },
    async (req, res) => {
        if (req.method !== 'POST') {
            res.status(405).json({ success: false, error: 'Method not allowed' });
            return;
        }

        try {
            const { receiptUrl, expectedAmount } = req.body;

            if (!receiptUrl || expectedAmount === undefined) {
                res.status(400).json({
                    success: false,
                    error: 'receiptUrl y expectedAmount son requeridos'
                });
                return;
            }

            const result = await verifyPaymentWithAI(receiptUrl, expectedAmount);
            res.status(200).json(result);

        } catch (error) {
            console.error('Error verifying payment:', error);
            res.status(500).json({
                success: false,
                confidence: 0,
                error: error instanceof Error ? error.message : 'Error al verificar el comprobante'
            });
        }
    }
);

// Función para enviar mensajes de Telegram desde el frontend (recordatorios, etc.)
export const sendTelegramMessageFn = onRequest(
    {
        secrets: [telegramToken],
        region: 'us-central1',
        cors: true
    },
    async (req, res) => {
        // Solo permitir POST
        if (req.method !== 'POST') {
            res.status(405).json({ success: false, error: 'Method not allowed' });
            return;
        }

        try {
            const { chatId, text, parseMode } = req.body;

            if (!chatId || !text) {
                res.status(400).json({
                    success: false,
                    error: 'chatId y text son requeridos'
                });
                return;
            }

            // Verificar que el usuario autenticado tiene permiso (opcional: agregar auth)
            const config = getConfig();
            const url = `https://api.telegram.org/bot${config.telegramToken}/sendMessage`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: parseMode || 'Markdown'
                })
            });

            const data = await response.json() as { ok: boolean; result?: { message_id: number }; description?: string };

            if (!response.ok || !data.ok) {
                throw new Error(data.description || 'Error al enviar mensaje');
            }

            res.status(200).json({
                success: true,
                messageId: data.result?.message_id
            });

        } catch (error) {
            console.error('Error sending Telegram message:', error);
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Error al enviar mensaje'
            });
        }
    }
);
