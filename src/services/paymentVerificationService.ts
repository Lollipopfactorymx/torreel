/**
 * Servicio para verificar comprobantes de pago usando OpenAI Vision API
 *
 * NOTA: Para mayor seguridad, considera usar un proxy/backend para las llamadas a OpenAI
 * Para usar este servicio, configura VITE_OPENAI_API_KEY en tu archivo .env
 */

export interface PaymentVerificationResult {
    success: boolean;
    amount?: number;
    date?: string;
    reference?: string;
    bank?: string;
    confidence: number;
    error?: string;
}

export interface VerificationRequest {
    receiptUrl: string;
    expectedAmount: number;
}

class PaymentVerificationService {
    private apiKey: string | undefined;
    private apiUrl = 'https://api.openai.com/v1/chat/completions';

    constructor() {
        // Obtener API key desde variables de entorno de Vite
        this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    }

    /**
     * Verifica si el servicio está configurado correctamente
     */
    isConfigured(): boolean {
        return !!this.apiKey;
    }

    /**
     * Analiza un comprobante de pago y extrae la información
     */
    async verifyReceipt(request: VerificationRequest): Promise<PaymentVerificationResult> {
        if (!this.apiKey) {
            return {
                success: false,
                confidence: 0,
                error: 'API de OpenAI no configurada. Contacta al administrador.'
            };
        }

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
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
                            El monto esperado es aproximadamente $${request.expectedAmount} MXN.`
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
                                        url: request.receiptUrl,
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
     * Verifica si el monto detectado coincide con el esperado
     * Permite una tolerancia del 1% para diferencias de redondeo
     */
    amountMatches(detected: number, expected: number, tolerancePercent: number = 1): boolean {
        const tolerance = expected * (tolerancePercent / 100);
        return Math.abs(detected - expected) <= tolerance;
    }

    /**
     * Genera un mensaje descriptivo del resultado de la verificación
     */
    getVerificationMessage(result: PaymentVerificationResult, expectedAmount: number): string {
        if (!result.success) {
            return result.error || 'No se pudo verificar el comprobante';
        }

        if (!result.amount) {
            return 'No se pudo detectar el monto en el comprobante';
        }

        const formatCurrency = (n: number) =>
            new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

        if (this.amountMatches(result.amount, expectedAmount)) {
            let message = `✅ Pago verificado: ${formatCurrency(result.amount)}`;
            if (result.bank) message += ` - ${result.bank}`;
            if (result.reference) message += ` - Ref: ${result.reference}`;
            message += ` (Confianza: ${result.confidence}%)`;
            return message;
        } else {
            return `⚠️ Monto diferente: Se esperaba ${formatCurrency(expectedAmount)}, ` +
                   `se detectó ${formatCurrency(result.amount)} (Confianza: ${result.confidence}%)`;
        }
    }
}

export default PaymentVerificationService;
