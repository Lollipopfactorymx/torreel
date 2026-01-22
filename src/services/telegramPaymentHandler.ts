/**
 * Servicio para manejar pagos enviados por Telegram
 *
 * Este servicio:
 * 1. Recibe fotos de comprobantes desde el webhook de Telegram
 * 2. Descarga la foto usando Telegram API
 * 3. La sube a Cloudinary
 * 4. Usa OpenAI Vision para verificar el pago
 * 5. Guarda el pago en Firebase
 * 6. Notifica al usuario del resultado
 *
 * DEBE SER USADO EN FIREBASE FUNCTIONS (backend)
 */

import * as admin from 'firebase-admin';

const TELEGRAM_BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || '';
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || '';
const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.VITE_CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.VITE_CLOUDINARY_API_SECRET || '';

interface TelegramPhoto {
    file_id: string;
    file_unique_id: string;
    file_size: number;
    width: number;
    height: number;
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

/**
 * Descarga una foto desde Telegram
 */
async function downloadTelegramPhoto(fileId: string): Promise<Buffer> {
    // 1. Obtener información del archivo
    const fileInfoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
    const fileInfoResponse = await fetch(fileInfoUrl);
    const fileInfo = await fileInfoResponse.json();

    if (!fileInfo.ok) {
        throw new Error('No se pudo obtener información del archivo');
    }

    const filePath = fileInfo.result.file_path;

    // 2. Descargar el archivo
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
    const fileResponse = await fetch(fileUrl);
    const arrayBuffer = await fileResponse.arrayBuffer();

    return Buffer.from(arrayBuffer);
}

/**
 * Sube una imagen a Cloudinary
 */
async function uploadToCloudinary(imageBuffer: Buffer, userId: string): Promise<string> {
    const cloudinary = require('cloudinary').v2;

    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
    });

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `torre-el/payments/${userId}`,
                resource_type: 'image',
                format: 'jpg'
            },
            (error: any, result: any) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        );

        uploadStream.end(imageBuffer);
    });
}

/**
 * Verifica un comprobante de pago usando OpenAI Vision
 */
async function verifyPaymentWithAI(
    imageUrl: string,
    expectedAmount: number
): Promise<PaymentVerificationResult> {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
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
            const errorData = await response.json();
            console.error('Error de OpenAI:', errorData);
            return {
                success: false,
                confidence: 0,
                error: `Error de API: ${errorData.error?.message || 'Error desconocido'}`
            };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return {
                success: false,
                confidence: 0,
                error: 'No se recibió respuesta de la IA'
            };
        }

        // Parsear respuesta JSON
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
    } catch (error: any) {
        console.error('Error al verificar comprobante:', error);
        return {
            success: false,
            confidence: 0,
            error: error.message || 'Error al procesar el comprobante'
        };
    }
}

/**
 * Envía un mensaje de Telegram
 */
async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    try {
        await fetch(url, {
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
    } catch (error) {
        console.error('Error sending Telegram message:', error);
    }
}

/**
 * Procesa una foto de comprobante de pago
 */
export async function processPaymentPhoto(
    chatId: number,
    photos: TelegramPhoto[],
    userId: string
): Promise<void> {
    try {
        // 1. Notificar que se está procesando
        await sendTelegramMessage(
            chatId,
            '📸 <b>Comprobante recibido</b>\n\n' +
            'Estoy procesando tu comprobante de pago, esto puede tardar unos segundos...'
        );

        // 2. Obtener la foto de mejor calidad (última en el array)
        const bestPhoto = photos[photos.length - 1];

        // 3. Descargar la foto
        const photoBuffer = await downloadTelegramPhoto(bestPhoto.file_id);

        // 4. Subir a Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(photoBuffer, userId);

        // 5. Obtener datos del usuario
        const db = admin.firestore();
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (!userData) {
            await sendTelegramMessage(
                chatId,
                '❌ <b>Error</b>\n\n' +
                'No se encontró tu información de usuario. Por favor contacta al administrador.'
            );
            return;
        }

        const expectedAmount = userData.amount || 0;

        // 6. Verificar con OpenAI
        const verification = await verifyPaymentWithAI(cloudinaryUrl, expectedAmount);

        // 7. Guardar el pago en Firebase (con estado pendiente de aprobación admin)
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

        // 8. Enviar respuesta al usuario
        if (verification.success && verification.amount) {
            const formatCurrency = (n: number) =>
                new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

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
                    '⏳ Tu pago ha sido recibido y está <b>pendiente de aprobación</b> por el administrador.\n\n' +
                    'Te notificaremos una vez que sea aprobado. ¡Gracias!'
                );
            } else if (!amountMatches) {
                await sendTelegramMessage(
                    chatId,
                    '⚠️ <b>Monto Diferente Detectado</b>\n\n' +
                    `💰 Monto detectado: ${formatCurrency(verification.amount)}\n` +
                    `💵 Monto esperado: ${formatCurrency(expectedAmount)}\n` +
                    `🔍 Confianza: ${verification.confidence}%\n\n` +
                    'Tu comprobante ha sido enviado al administrador para revisión manual.\n\n' +
                    'Te notificaremos del resultado.'
                );
            } else {
                await sendTelegramMessage(
                    chatId,
                    '⚠️ <b>Verificación con Baja Confianza</b>\n\n' +
                    `💰 Monto detectado: ${formatCurrency(verification.amount)}\n` +
                    `🔍 Confianza: ${verification.confidence}%\n\n` +
                    'Tu comprobante ha sido enviado al administrador para revisión manual.\n\n' +
                    'Te notificaremos del resultado.'
                );
            }
        } else {
            await sendTelegramMessage(
                chatId,
                '❌ <b>No se pudo verificar automáticamente</b>\n\n' +
                'Tu comprobante ha sido recibido y enviado al administrador para revisión manual.\n\n' +
                'Posibles razones:\n' +
                '• La imagen está borrosa o poco clara\n' +
                '• El formato del comprobante no es reconocido\n' +
                '• Falta información en el comprobante\n\n' +
                'Te notificaremos una vez que sea revisado.'
            );
        }

        // 9. Notificar al administrador (opcional)
        // Aquí podrías enviar una notificación push, email, etc.
        console.log(`Nuevo pago recibido de ${userData.fullname} - Verificación: ${verification.success ? 'Exitosa' : 'Fallida'}`);

    } catch (error: any) {
        console.error('Error procesando pago:', error);
        await sendTelegramMessage(
            chatId,
            '❌ <b>Error al procesar comprobante</b>\n\n' +
            'Hubo un error al procesar tu comprobante. Por favor:\n\n' +
            '1. Asegúrate de que la imagen sea clara y legible\n' +
            '2. Intenta enviarla nuevamente\n' +
            '3. Si el problema persiste, contacta al administrador\n\n' +
            `Error: ${error.message}`
        );
    }
}

/**
 * Obtiene el userId a partir del chatId
 */
export async function getUserIdFromChatId(chatId: number): Promise<string | null> {
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
