import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp();

const db = admin.firestore();

// Obtener API Key de Brevo desde variables de entorno
// Asegúrate de configurar: firebase functions:config:set brevo.key="TU_API_KEY"
// O usar un archivo .env si usas dotenv
const getBrevoApiKey = () => {
    return process.env.BREVO_API_KEY || functions.config().brevo?.key;
};



// Función para formatear fecha
const formatDate = (dateStr: string): string => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Generar HTML del contrato para email (Solo usado si no hay PDF URL)
const generateContractHTML = (contract: any): string => {
    const data = contract.data || {};
    const profile = contract.profile || {};

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 3px solid #b8860b; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #333; letter-spacing: 2px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>CONTRATO DE ARRENDAMIENTO</h1>
            <p>Torre El - Depto ${data.department || '---'}</p>
        </div>
        <p>Arrendatario: ${profile.fullname || '---'}</p>
        <p>Fecha Inicio: ${formatDate(data.startDate)}</p>
        <p>Este es un resumen. El documento oficial debe ser generado en PDF.</p>
    </body>
    </html>
    `;
};

export const sendContractEmail = functions.firestore
    .document('emailRequests/{requestId}')
    .onCreate(async (snap, context) => {
        const requestData = snap.data();
        const requestId = context.params.requestId;
        const apiKey = getBrevoApiKey();

        if (!apiKey) {
            console.error('Brevo API Key not configured');
            await snap.ref.update({ status: 'error', error: 'Server configuration error (Missing API Key)' });
            return { success: false, error: 'Missing API Key' };
        }

        console.log(`Processing email request: ${requestId}`);

        try {
            // Obtener datos del contrato
            const contractDoc = await db.collection('contracts').doc(requestData.contractId).get();

            if (!contractDoc.exists) {
                throw new Error(`Contract not found: ${requestData.contractId}`);
            }

            const contract = { id: contractDoc.id, ...contractDoc.data() } as any;
            const pdfUrl = requestData.pdfUrl || contract.pdfUrl;

            // Preparar adjuntos
            const attachment = [];

            if (pdfUrl) {
                // Opción 1: Enviar URL (Brevo lo descarga y adjunta)
                attachment.push({
                    url: pdfUrl,
                    name: `Contrato_TorreEl_${contract.data?.department || 'Depto'}.pdf`
                });
            } else {
                // Fallback: Generar HTML simple y enviar como base64 (simplificado aquí)
                // Para simplificar, si no hay PDF, enviamos el HTML
                const htmlContent = generateContractHTML(contract);
                const buffer = Buffer.from(htmlContent);
                attachment.push({
                    content: buffer.toString('base64'),
                    name: `Resumen_Contrato.html`
                });
            }

            // Configurar payload para Brevo
            const emailData = {
                sender: { name: "Torre El Contratos", email: "no-reply@torre-el.com" }, // Cambia esto por un remitente verificado en Brevo
                to: [{ email: requestData.recipientEmail }],
                subject: `Contrato de Arrendamiento - Depto ${contract.data?.department || ''}`,
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        <h2 style="color: #b8860b;">Torre El - Tu Contrato</h2>
                        <p>Hola,</p>
                        <p>Adjunto encontrarás tu contrato de arrendamiento oficial.</p>
                        ${pdfUrl ? '<p><strong>Hemos adjuntado el PDF oficial firmado.</strong></p>' : '<p>Te enviamos un resumen en HTML.</p>'}
                        <p>Para cualquier duda, contacta a la administración.</p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px;">Departamento: ${contract.data?.department || 'N/A'}</p>
                    </div>
                `,
                attachment: attachment
            };

            // Enviar petición a Brevo
            const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
                headers: {
                    'api-key': apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log(`Email sent via Brevo. MessageId: ${response.data.messageId}`);

            // Actualizar el estado de la solicitud
            await snap.ref.update({
                status: 'sent',
                provider: 'brevo',
                messageId: response.data.messageId,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                error: null
            });

            return { success: true };

        } catch (error: any) {
            console.error('Error sending email with Brevo:', error.response?.data || error.message);

            // Actualizar el estado con el error
            await snap.ref.update({
                status: 'error',
                error: JSON.stringify(error.response?.data || error.message),
                errorAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return { success: false, error: error.message };
        }
    });

// Cloud Function HTTP para reenviar un email (útil para reintentos)
export const resendContractEmail = functions.https.onRequest(async (req, res) => {
    // Verificar método
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }

    const { requestId } = req.body;

    if (!requestId) {
        res.status(400).send('requestId is required');
        return;
    }

    try {
        const requestDoc = await db.collection('emailRequests').doc(requestId).get();

        if (!requestDoc.exists) {
            res.status(404).send('Email request not found');
            return;
        }

        // Actualizar estado a pending para que se procese de nuevo
        await requestDoc.ref.update({
            status: 'pending',
            retryAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Crear una nueva solicitud que trigger la función
        const originalData = requestDoc.data();
        await db.collection('emailRequests').add({
            ...originalData,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isRetry: true,
            originalRequestId: requestId
        });

        res.status(200).json({ success: true, message: 'Email queued for resend' });

    } catch (error: any) {
        console.error('Error resending email:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
