/**
 * Servicio para verificar comprobantes de pago usando Firebase Functions
 *
 * SEGURIDAD: La API key de OpenAI NUNCA debe estar en el frontend.
 * Las verificaciones se realizan a través de Firebase Functions que tienen
 * acceso seguro a la API key via Secret Manager.
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
    private functionsUrl: string;
    private getAuthToken: (() => Promise<string | null>) | null = null;

    constructor() {
        // URL de Firebase Functions
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
     * Analiza un comprobante de pago y extrae la información via Firebase Functions
     */
    async verifyReceipt(request: VerificationRequest): Promise<PaymentVerificationResult> {
        if (!this.isConfigured()) {
            return {
                success: false,
                confidence: 0,
                error: 'Firebase no está configurado. Contacta al administrador.'
            };
        }

        // Obtener token de autenticación
        const token = this.getAuthToken ? await this.getAuthToken() : null;
        if (!token) {
            return {
                success: false,
                confidence: 0,
                error: 'Usuario no autenticado.'
            };
        }

        try {
            const response = await fetch(`${this.functionsUrl}/verifyPaymentReceipt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    receiptUrl: request.receiptUrl,
                    expectedAmount: request.expectedAmount
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error de verificación:', errorData);
                return {
                    success: false,
                    confidence: 0,
                    error: errorData.error || 'Error al verificar el comprobante'
                };
            }

            const data = await response.json();

            return {
                success: data.success,
                amount: data.amount,
                date: data.date,
                reference: data.reference,
                bank: data.bank,
                confidence: data.confidence || 0,
                error: data.error
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
