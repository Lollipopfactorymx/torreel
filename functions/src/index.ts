import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

const db = admin.firestore();

// Configuración del transportador de email
// Las credenciales se configuran en el archivo .env
const getTransporter = () => {
    const gmailEmail = process.env.GMAIL_EMAIL;
    const gmailPassword = process.env.GMAIL_PASSWORD;

    if (!gmailEmail || !gmailPassword) {
        throw new Error('Gmail credentials not configured. Create a .env file with GMAIL_EMAIL and GMAIL_PASSWORD');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: gmailEmail,
            pass: gmailPassword
        }
    });
};

// Función para formatear moneda
const formatCurrency = (amount: string | number): string => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(amount) || 0);
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

// Generar HTML del contrato para el email
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
            .section { margin-bottom: 25px; }
            .section h3 { color: #b8860b; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .info-row { display: flex; margin-bottom: 10px; }
            .info-label { font-weight: bold; min-width: 200px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
            .signature-box { text-align: center; width: 30%; }
            .signature-line { border-top: 2px solid #333; margin-top: 80px; padding-top: 10px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
            .status-signed { background-color: #d4edda; color: #155724; }
            .status-pending { background-color: #fff3cd; color: #856404; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>CONTRATO DE ARRENDAMIENTO</h1>
            <p>Torre El - Departamentos en Renta</p>
            <span class="status-badge ${contract.status === 'signed' ? 'status-signed' : 'status-pending'}">
                ${contract.status === 'signed' ? '✓ FIRMADO' : '⏳ PENDIENTE'}
            </span>
        </div>

        <div class="section">
            <h3>Datos del Arrendador</h3>
            <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span>JOSE LUIS PALILLERO HUERTA</span>
            </div>
            <div class="info-row">
                <span class="info-label">Dirección:</span>
                <span>Calle Ciencias de la Salud número 16, Sección Tercera Guardia, Zacatelco, Tlaxcala</span>
            </div>
        </div>

        <div class="section">
            <h3>Datos del Arrendatario</h3>
            <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span>${profile.fullname || '---'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span>${profile.email || '---'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">INE:</span>
                <span>${data.tenantId || '---'}</span>
            </div>
        </div>

        <div class="section">
            <h3>Datos del Inmueble</h3>
            <div class="info-row">
                <span class="info-label">Departamento:</span>
                <span>${data.department || '---'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Renta Mensual:</span>
                <span>${formatCurrency(data.monthlyRent)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Depósito:</span>
                <span>${formatCurrency(data.deposit)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Fecha de Inicio:</span>
                <span>${formatDate(data.startDate)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Duración:</span>
                <span>${data.duration || '12 meses'}</span>
            </div>
        </div>

        <div class="section">
            <h3>Datos del Fiador</h3>
            <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span>${data.guarantorName || '---'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Dirección:</span>
                <span>${data.guarantorAddress || '---'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Teléfono:</span>
                <span>${data.guarantorPhone || '---'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">INE:</span>
                <span>${data.guarantorId || '---'}</span>
            </div>
        </div>

        ${contract.status === 'signed' ? `
        <div class="section">
            <h3>Información de Firma</h3>
            <div class="info-row">
                <span class="info-label">Fecha de Firma:</span>
                <span>${formatDate(contract.signedAt)}</span>
            </div>
        </div>

        <div class="signatures">
            <div class="signature-box">
                <div class="signature-line">EL ARRENDADOR</div>
                <p>Jose Luis Palillero Huerta</p>
            </div>
            <div class="signature-box">
                <div class="signature-line">LA ARRENDATARIA</div>
                <p>${profile.fullname || '---'}</p>
            </div>
            <div class="signature-box">
                <div class="signature-line">EL FIADOR</div>
                <p>${data.guarantorName || '---'}</p>
            </div>
        </div>
        ` : ''}

        <div class="footer">
            <p>Este documento fue generado automáticamente por el sistema Torre El.</p>
            <p>Para ver el contrato completo con todas las cláusulas y firmas digitales, ingresa a tu cuenta en la aplicación.</p>
            <p>Fecha de generación: ${formatDate(new Date().toISOString())}</p>
        </div>
    </body>
    </html>
    `;
};

// Cloud Function que escucha nuevos documentos en emailRequests
export const sendContractEmail = functions.firestore
    .document('emailRequests/{requestId}')
    .onCreate(async (snap, context) => {
        const requestData = snap.data();
        const requestId = context.params.requestId;

        console.log(`Processing email request: ${requestId}`);

        try {
            // Obtener datos del contrato
            const contractDoc = await db.collection('contracts').doc(requestData.contractId).get();

            if (!contractDoc.exists) {
                throw new Error(`Contract not found: ${requestData.contractId}`);
            }

            const contract = { id: contractDoc.id, ...contractDoc.data() } as any;

            // Generar HTML del contrato
            const contractHTML = generateContractHTML(contract);

            // Configurar el transportador
            const transporter = getTransporter();

            // Configurar el email
            const mailOptions = {
                from: `"Torre El - Contratos" <${process.env.GMAIL_EMAIL}>`,
                to: requestData.recipientEmail,
                subject: `Contrato de Arrendamiento - Depto ${contract.data?.department || ''}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #b8860b;">Torre El - Contrato de Arrendamiento</h2>
                        <p>Hola,</p>
                        <p>Adjunto encontrarás el resumen de tu contrato de arrendamiento.</p>
                        <p>Para ver el contrato completo con todas las cláusulas legales y las firmas digitales,
                        ingresa a tu cuenta en la aplicación de Torre El.</p>
                        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">
                            Este es un correo automático, por favor no responder a esta dirección.
                        </p>
                    </div>
                `,
                attachments: [
                    {
                        filename: `Contrato_${contract.profile?.fullname || 'Arrendamiento'}.html`,
                        content: contractHTML,
                        contentType: 'text/html'
                    }
                ]
            };

            // Enviar el email
            await transporter.sendMail(mailOptions);

            console.log(`Email sent successfully to: ${requestData.recipientEmail}`);

            // Actualizar el estado de la solicitud
            await snap.ref.update({
                status: 'sent',
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                error: null
            });

            return { success: true };

        } catch (error: any) {
            console.error('Error sending email:', error);

            // Actualizar el estado con el error
            await snap.ref.update({
                status: 'error',
                error: error.message,
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
