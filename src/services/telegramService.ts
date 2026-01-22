/**
 * Servicio para enviar mensajes a través de Telegram Bot API
 *
 * Configuración requerida:
 * 1. Crear bot con @BotFather en Telegram
 * 2. Obtener el token del bot
 * 3. Agregar VITE_TELEGRAM_BOT_TOKEN al .env
 * 4. Los usuarios deben iniciar conversación con el bot y enviar /start
 * 5. Guardar su chat_id en su perfil
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
    private botToken: string;
    private apiUrl: string;

    constructor() {
        this.botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
        this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    /**
     * Verifica si el servicio está configurado correctamente
     */
    isConfigured(): boolean {
        return !!this.botToken && this.botToken.length > 0;
    }

    /**
     * Envía un mensaje de texto a un chat de Telegram
     */
    async sendMessage(message: TelegramMessage): Promise<TelegramResponse> {
        if (!this.isConfigured()) {
            console.error('Telegram Bot no está configurado. Agrega VITE_TELEGRAM_BOT_TOKEN al .env');
            return {
                sent: false,
                error: 'Telegram Bot no está configurado'
            };
        }

        if (!message.chatId) {
            return {
                sent: false,
                error: 'Chat ID no proporcionado'
            };
        }

        try {
            const response = await fetch(`${this.apiUrl}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: message.chatId,
                    text: message.text,
                    parse_mode: message.parseMode || 'Markdown'
                })
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.description || 'Error al enviar mensaje');
            }

            return {
                sent: true,
                messageId: data.result.message_id
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
     * Obtiene información del bot (útil para verificar configuración)
     */
    async getBotInfo(): Promise<any> {
        if (!this.isConfigured()) {
            throw new Error('Telegram Bot no está configurado');
        }

        try {
            const response = await fetch(`${this.apiUrl}/getMe`);
            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.description || 'Error al obtener info del bot');
            }

            return data.result;
        } catch (error) {
            console.error('Error obteniendo info del bot:', error);
            throw error;
        }
    }

    /**
     * Obtiene el chat_id de un usuario (útil para configuración inicial)
     * El usuario debe haber enviado un mensaje al bot primero
     */
    async getUpdates(offset?: number): Promise<any> {
        if (!this.isConfigured()) {
            throw new Error('Telegram Bot no está configurado');
        }

        try {
            const url = offset
                ? `${this.apiUrl}/getUpdates?offset=${offset}`
                : `${this.apiUrl}/getUpdates`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.description || 'Error al obtener actualizaciones');
            }

            return data.result;
        } catch (error) {
            console.error('Error obteniendo actualizaciones:', error);
            throw error;
        }
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
