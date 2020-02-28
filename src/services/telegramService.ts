/**
 * Servicio para enviar mensajes a través de Firebase Functions
 *
 * SEGURIDAD: El token de Telegram NUNCA debe estar en el frontend.
 * Los mensajes se envían a través de Firebase Functions que tienen
 * acceso seguro al token via Secret Manager.
 */

export interface TelegramMessage {
    chatId: string;
    text: string;
    parseMode?: 'Markdown' | 'HTML';
}

export interface TelegramResponse {
    sent: boolean;
    messageId?: number;
    error?: string;
}

class TelegramService {
    private functionsUrl: string;
    private getAuthToken: (() => Promise<string | null>) | null = null;

    constructor() {
        // URL de Firebase Functions (configurar en .env)
        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
        this.functionsUrl = `https://us-central1-${projectId}.cloudfunctions.net`;
    }

    /**
     * Configura la función para obtener el token de autenticación
     */
    setAuthTokenProvider(provider: () => Promise<string | null>): void {
        this.getAuthToken = provider;
    }

    /**
     * Verifica si el servicio está configurado correctamente
     */
    isConfigured(): boolean {
        return !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
    }

    /**
     * Envía un mensaje de texto a un chat de Telegram via Firebase Functions
     */
    async sendMessage(message: TelegramMessage): Promise<TelegramResponse> {
        if (!this.isConfigured()) {
            console.error('Firebase no está configurado');
            return {
                sent: false,
                error: 'Firebase no está configurado'
            };
        }

        if (!message.chatId) {
            return {
                sent: false,
                error: 'Chat ID no proporcionado'
            };
        }

        // Obtener token de autenticación
        const token = this.getAuthToken ? await this.getAuthToken() : null;
        if (!token) {
            return {
                sent: false,
                error: 'Usuario no autenticado'
            };
        }

        try {
            const response = await fetch(`${this.functionsUrl}/sendTelegramMessageFn`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    chatId: message.chatId,
                    text: message.text,
                    parseMode: message.parseMode || 'Markdown'
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error al enviar mensaje');
            }

            return {
                sent: true,
                messageId: data.messageId
            };
        } catch (error: any) {
            console.error('Error enviando mensaje de Telegram:', error);
            return {
                sent: false,
                error: error.message || 'Error desconocido al enviar mensaje'
            };
        }
    }

    /**
     * Envía un recordatorio de pago formateado
     */
    async sendPaymentReminder(
        chatId: string,
        tenantName: string,
        amount: number,
        dueDate: string,
        department: string
    ): Promise<TelegramResponse> {
        const formattedAmount = new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);

        const formattedDate = new Date(dueDate).toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const message = `
🏠 *Recordatorio de Pago - Torre El*

Hola ${tenantName},

Este es un recordatorio amable sobre tu pago de renta:

🏢 *Departamento:* ${department}
💰 *Monto:* ${formattedAmount}
📅 *Fecha de vencimiento:* ${formattedDate}

Por favor, realiza tu pago a tiempo y sube el comprobante en tu portal.

¡Gracias! 🙏
        `.trim();

        return this.sendMessage({
            chatId,
            text: message,
            parseMode: 'Markdown'
        });
    }

    /**
     * Formatea un mensaje para instrucciones de configuración
     */
    getSetupInstructions(botUsername: string): string {
        return `
Para recibir recordatorios por Telegram:

1. Busca @${botUsername} en Telegram
2. Inicia una conversación con /start
3. Copia el código que te envía el bot
4. Pégalo en tu perfil en Torre El
        `.trim();
    }
}

export default TelegramService;
