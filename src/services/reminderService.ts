/**
 * Servicio para enviar recordatorios de pago por Telegram y Email
 *
 * Para Telegram: Los mensajes se envían via Firebase Functions (token seguro en Secret Manager)
 * Para Email: Ya está configurado con EmailJS (PALX)
 */

import emailjs from '@emailjs/browser';
import TelegramService from './telegramService';

export interface ReminderData {
    tenantName: string;
    tenantEmail: string;
    tenantPhone?: string;
    telegramChatId?: string;
    amount: number;
    dueDate: string;
    department: string;
    isOverdue: boolean;
}

export interface ReminderResult {
    telegram: { sent: boolean; error?: string };
    email: { sent: boolean; error?: string };
}

class ReminderService {
    private telegramService: TelegramService;

    // EmailJS config (ya configurado)
    private emailjsServiceId = 'PALX';
    private emailjsPublicKey = 'ufwam3jbHzFn9WANh';
    private emailjsTemplateReminder = 'template_reminder'; // Template para recordatorios

    constructor() {
        // Inicializar Telegram Service
        this.telegramService = new TelegramService();

        // Inicializar EmailJS
        emailjs.init(this.emailjsPublicKey);
    }

    /**
     * Verifica si Telegram está configurado
     */
    isTelegramConfigured(): boolean {
        return this.telegramService.isConfigured();
    }

    /**
     * Formatea el monto como moneda mexicana
     */
    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    }

    /**
     * Envía un recordatorio por Email usando EmailJS
     */
    async sendEmailReminder(data: ReminderData): Promise<{ sent: boolean; error?: string }> {
        const formattedAmount = this.formatCurrency(data.amount);

        const subject = data.isOverdue
            ? `⚠️ PAGO VENCIDO - Departamento ${data.department}`
            : `📅 Recordatorio de Pago - Departamento ${data.department}`;

        const templateParams = {
            to_email: data.tenantEmail,
            to_name: data.tenantName,
            subject,
            amount: formattedAmount,
            due_date: data.dueDate,
            department: data.department,
            is_overdue: data.isOverdue ? 'Sí' : 'No',
            message: data.isOverdue
                ? `Tu pago de renta está VENCIDO desde el ${data.dueDate}. Por favor realiza tu pago lo antes posible para evitar recargos adicionales.`
                : `Te recordamos que tu pago de renta vence el ${data.dueDate}. Realiza tu pago a tiempo para evitar recargos.`,
            status_color: data.isOverdue ? '#dc3545' : '#ffc107',
            status_text: data.isOverdue ? 'VENCIDO' : 'PRÓXIMO A VENCER'
        };

        try {
            await emailjs.send(
                this.emailjsServiceId,
                this.emailjsTemplateReminder,
                templateParams
            );

            return { sent: true };
        } catch (error: any) {
            console.error('Error al enviar email:', error);

            // Si el template no existe, intentar con el template de contrato
            try {
                await emailjs.send(
                    this.emailjsServiceId,
                    'template_qzt1jbq', // Template existente
                    {
                        to_email: data.tenantEmail,
                        tenant_name: data.tenantName,
                        pdf_link: '', // No aplica para recordatorio
                        department: data.department,
                        message: templateParams.message
                    }
                );
                return { sent: true };
            } catch (fallbackError: any) {
                return { sent: false, error: fallbackError.message || 'Error al enviar email' };
            }
        }
    }

    /**
     * Envía un recordatorio por Telegram usando Telegram Bot API
     */
    async sendTelegramReminder(data: ReminderData): Promise<{ sent: boolean; error?: string }> {
        if (!this.isTelegramConfigured()) {
            return { sent: false, error: 'Telegram no está configurado' };
        }

        if (!data.telegramChatId) {
            return { sent: false, error: 'No hay chat ID de Telegram configurado' };
        }

        try {
            const result = await this.telegramService.sendPaymentReminder(
                data.telegramChatId,
                data.tenantName,
                data.amount,
                data.dueDate,
                data.department
            );

            return result;
        } catch (error: any) {
            console.error('Error al enviar recordatorio por Telegram:', error);
            return { sent: false, error: error.message };
        }
    }

    /**
     * Envía recordatorios por los canales seleccionados (Telegram y/o Email)
     */
    async sendReminder(data: ReminderData, channels: { telegram: boolean; email: boolean }): Promise<ReminderResult> {
        const result: ReminderResult = {
            telegram: { sent: false },
            email: { sent: false }
        };

        if (channels.telegram && data.telegramChatId) {
            result.telegram = await this.sendTelegramReminder(data);
        }

        if (channels.email && data.tenantEmail) {
            result.email = await this.sendEmailReminder(data);
        }

        return result;
    }

    /**
     * Genera el texto del mensaje de recordatorio (para vista previa)
     */
    getPreviewMessage(data: ReminderData, format: 'telegram' | 'email'): string {
        const formattedAmount = this.formatCurrency(data.amount);

        if (format === 'telegram') {
            if (data.isOverdue) {
                return `🔴 RECORDATORIO DE PAGO VENCIDO\n\n` +
                    `Hola ${data.tenantName},\n\n` +
                    `Tu pago de renta del departamento ${data.department} está VENCIDO.\n\n` +
                    `💰 Monto: ${formattedAmount}\n` +
                    `📅 Fecha de vencimiento: ${data.dueDate}\n\n` +
                    `Por favor realiza tu pago lo antes posible.`;
            } else {
                return `🔔 RECORDATORIO DE PAGO\n\n` +
                    `Hola ${data.tenantName},\n\n` +
                    `Tu pago de renta del departamento ${data.department} vence pronto.\n\n` +
                    `💰 Monto: ${formattedAmount}\n` +
                    `📅 Fecha de vencimiento: ${data.dueDate}`;
            }
        } else {
            return data.isOverdue
                ? `Estimado/a ${data.tenantName}, tu pago de renta del departamento ${data.department} ` +
                  `por ${formattedAmount} está VENCIDO desde el ${data.dueDate}.`
                : `Estimado/a ${data.tenantName}, te recordamos que tu pago de renta del departamento ${data.department} ` +
                  `por ${formattedAmount} vence el ${data.dueDate}.`;
        }
    }
}

export default ReminderService;
