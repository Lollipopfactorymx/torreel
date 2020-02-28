import React, { useState, useEffect } from 'react';
import CloudinaryService from '../../services/CloudinaryService';
import PaymentVerificationService from '../../services/paymentVerificationService';
import ReminderService, { ReminderData } from '../../services/reminderService';
import { Payment } from '../../types';

interface PaymentManagerProps {
    firebase: any;
    contractId: string;
    tenantId: string;
    monthlyRent: number;
    startDate: string;
    duration: string;
    tenantName?: string;
    tenantEmail?: string;
    tenantPhone?: string;
    telegramChatId?: string;
    department?: string;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({
    firebase,
    contractId,
    tenantId,
    monthlyRent,
    startDate,
    duration,
    tenantName = 'Inquilino',
    tenantEmail = '',
    tenantPhone = '',
    telegramChatId = '',
    department = ''
}) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [uploading, setUploading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<string | null>(null);
    const [sendingReminder, setSendingReminder] = useState(false);
    const [newPayment, setNewPayment] = useState({
        amount: monthlyRent || 0,
        concept: 'Renta mensual',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    const cloudinaryService = new CloudinaryService();
    const verificationService = new PaymentVerificationService();
    const reminderService = new ReminderService();

    useEffect(() => {
        loadPayments();
        generatePaymentSchedule();
    }, [contractId]);

    const loadPayments = async () => {
        try {
            const snapshot = await firebase.db
                .collection('payments')
                .where('contractId', '==', contractId)
                .orderBy('dueDate', 'desc')
                .get();

            const paymentList: Payment[] = [];
            snapshot.forEach((doc: any) => {
                paymentList.push({ id: doc.id, ...doc.data() });
            });

            setPayments(paymentList);
        } catch (error) {
            console.error('Error loading payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const generatePaymentSchedule = async () => {
        if (!startDate || !duration) return;

        try {
            const existingSnapshot = await firebase.db
                .collection('payments')
                .where('contractId', '==', contractId)
                .limit(1)
                .get();

            if (!existingSnapshot.empty) return;

            const months = parseInt(duration) || 12;
            const start = new Date(startDate);
            const batch = firebase.db.batch();

            for (let i = 0; i < months; i++) {
                const dueDate = new Date(start);
                dueDate.setMonth(dueDate.getMonth() + i);

                const paymentRef = firebase.db.collection('payments').doc();
                const payment: Omit<Payment, 'id'> = {
                    tenantId,
                    contractId,
                    amount: monthlyRent,
                    concept: `Renta - ${dueDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}`,
                    paymentDate: '',
                    dueDate: dueDate.toISOString(),
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                batch.set(paymentRef, payment);
            }

            await batch.commit();
            loadPayments();
        } catch (error) {
            console.error('Error generating payment schedule:', error);
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            let receiptUrl = '';
            let receiptPublicId = '';

            if (receiptFile) {
                const folder = cloudinaryService.getTenantPaymentsFolder(tenantId);
                const response = await cloudinaryService.uploadFile(receiptFile, folder);
                receiptUrl = response.secure_url;
                receiptPublicId = response.public_id;
            }

            const payment: Omit<Payment, 'id'> = {
                tenantId,
                contractId,
                amount: newPayment.amount,
                concept: newPayment.concept,
                paymentDate: newPayment.paymentDate,
                dueDate: newPayment.paymentDate,
                status: 'paid',
                receiptUrl,
                receiptPublicId,
                notes: newPayment.notes,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await firebase.db.collection('payments').add(payment);

            setNewPayment({
                amount: monthlyRent || 0,
                concept: 'Renta mensual',
                paymentDate: new Date().toISOString().split('T')[0],
                notes: ''
            });
            setReceiptFile(null);
            setShowAddModal(false);

            loadPayments();
            alert('Pago registrado correctamente');
        } catch (error) {
            console.error('Error adding payment:', error);
            alert('Error al registrar el pago');
        } finally {
            setUploading(false);
        }
    };

    const markAsPaid = async (paymentId: string) => {
        try {
            await firebase.db.collection('payments').doc(paymentId).update({
                status: 'paid',
                paymentDate: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            loadPayments();
            alert('Pago marcado como pagado');
        } catch (error) {
            console.error('Error marking payment as paid:', error);
            alert('Error al actualizar el pago');
        }
    };

    // Subir comprobante Y verificar con IA
    const uploadAndVerifyReceipt = async (paymentId: string, file: File, expectedAmount: number) => {
        setVerifying(true);
        setVerificationResult(null);

        try {
            // 1. Subir comprobante a Cloudinary
            const folder = cloudinaryService.getTenantPaymentsFolder(tenantId);
            const response = await cloudinaryService.uploadFile(file, folder);

            await firebase.db.collection('payments').doc(paymentId).update({
                receiptUrl: response.secure_url,
                receiptPublicId: response.public_id,
                updatedAt: new Date().toISOString()
            });

            // 2. Verificar con IA si está configurado
            if (verificationService.isConfigured()) {
                const result = await verificationService.verifyReceipt({
                    receiptUrl: response.secure_url,
                    expectedAmount
                });

                const message = verificationService.getVerificationMessage(result, expectedAmount);
                setVerificationResult(message);

                if (result.success && result.amount && verificationService.amountMatches(result.amount, expectedAmount)) {
                    // Pago verificado automáticamente
                    await firebase.db.collection('payments').doc(paymentId).update({
                        status: 'paid',
                        paymentDate: result.date || new Date().toISOString(),
                        verifiedAmount: result.amount,
                        verificationMethod: 'ai_auto',
                        aiConfidence: result.confidence,
                        bankReference: result.reference || null,
                        bank: result.bank || null,
                        updatedAt: new Date().toISOString()
                    });

                    alert('✅ Pago verificado y registrado automáticamente');
                } else if (result.success && result.amount) {
                    // Monto no coincide - requiere revisión
                    await firebase.db.collection('payments').doc(paymentId).update({
                        status: 'pending_review',
                        aiDetectedAmount: result.amount,
                        aiConfidence: result.confidence,
                        reviewReason: 'amount_mismatch',
                        updatedAt: new Date().toISOString()
                    });

                    alert(`⚠️ El monto detectado ($${result.amount}) no coincide con el esperado ($${expectedAmount}). Requiere revisión manual.`);
                } else {
                    // No se pudo verificar
                    await firebase.db.collection('payments').doc(paymentId).update({
                        status: 'pending_review',
                        reviewReason: 'ai_unable_to_verify',
                        updatedAt: new Date().toISOString()
                    });

                    alert('⚠️ No se pudo verificar automáticamente. Comprobante subido para revisión manual.');
                }
            } else {
                // IA no configurada - solo subir comprobante
                alert('Comprobante subido correctamente. Verificación automática no disponible.');
            }

            loadPayments();
        } catch (error) {
            console.error('Error uploading/verifying receipt:', error);
            alert('Error al procesar el comprobante');
        } finally {
            setVerifying(false);
        }
    };

    // Enviar recordatorio de pago
    const sendPaymentReminder = async (payment: Payment, channels: { telegram: boolean; email: boolean }) => {
        setSendingReminder(true);

        const dueDate = new Date(payment.dueDate).toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const isOverdue = new Date(payment.dueDate) < new Date();

        const reminderData: ReminderData = {
            tenantName,
            tenantEmail,
            tenantPhone,
            telegramChatId,
            amount: payment.amount,
            dueDate,
            department,
            isOverdue
        };

        try {
            const result = await reminderService.sendReminder(reminderData, channels);

            let message = 'Recordatorio enviado:\n';
            if (channels.telegram) {
                message += result.telegram.sent
                    ? '✅ Telegram enviado\n'
                    : `❌ Telegram: ${result.telegram.error}\n`;
            }
            if (channels.email) {
                message += result.email.sent
                    ? '✅ Email enviado'
                    : `❌ Email: ${result.email.error}`;
            }

            alert(message);
            setShowReminderModal(false);

            // Registrar log
            await firebase.db.collection('reminderLogs').add({
                paymentId: payment.id,
                tenantId,
                type: isOverdue ? 'overdue' : 'upcoming',
                channels: result,
                sentAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error sending reminder:', error);
            alert('Error al enviar el recordatorio');
        } finally {
            setSendingReminder(false);
        }
    };

    const openReminderModal = (payment: Payment) => {
        setSelectedPayment(payment);
        setShowReminderModal(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <span className="label label-success">Pagado</span>;
            case 'overdue':
                return <span className="label label-danger">Vencido</span>;
            case 'pending_review':
                return <span className="label label-info">En Revisión</span>;
            default:
                return <span className="label label-warning">Pendiente</span>;
        }
    };

    const checkOverdue = (payment: Payment) => {
        if (payment.status === 'paid' || payment.status === 'pending_review') return payment;
        const dueDate = new Date(payment.dueDate);
        const today = new Date();
        if (dueDate < today) {
            return { ...payment, status: 'overdue' as const };
        }
        return payment;
    };

    if (loading) {
        return (
            <div className="text-center" style={{ padding: '20px' }}>
                <i className="fa fa-spinner fa-spin fa-2x"></i>
                <p>Cargando pagos...</p>
            </div>
        );
    }

    const processedPayments = payments.map(checkOverdue);
    const pendingPayments = processedPayments.filter(p => p.status !== 'paid');
    const paidPayments = processedPayments.filter(p => p.status === 'paid');
    const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="payment-manager" style={{ marginTop: '30px' }}>
            <div className="panel panel-primary">
                <div className="panel-heading">
                    <h3 className="panel-title">
                        <i className="fa fa-money"></i> Registro de Pagos
                        <button
                            className="btn btn-success btn-sm pull-right"
                            onClick={() => setShowAddModal(true)}
                            style={{ marginTop: '-5px' }}
                        >
                            <i className="fa fa-plus"></i> Registrar Pago
                        </button>
                    </h3>
                </div>
                <div className="panel-body">
                    {/* Indicador de IA */}
                    {verificationService.isConfigured() && (
                        <div className="alert alert-info" style={{ padding: '8px 12px', marginBottom: '15px' }}>
                            <i className="fa fa-magic"></i> <strong>Verificación con IA activada:</strong> Los comprobantes se verificarán automáticamente.
                        </div>
                    )}

                    {/* Resultado de verificación */}
                    {verificationResult && (
                        <div className="alert alert-warning" style={{ marginBottom: '15px' }}>
                            {verificationResult}
                            <button type="button" className="close" onClick={() => setVerificationResult(null)}>
                                <span>&times;</span>
                            </button>
                        </div>
                    )}

                    {/* Resumen */}
                    <div className="row" style={{ marginBottom: '20px' }}>
                        <div className="col-md-4">
                            <div className="well well-sm text-center">
                                <h4 className="text-success">{formatCurrency(totalPaid)}</h4>
                                <small>Total Pagado</small>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="well well-sm text-center">
                                <h4 className="text-warning">{formatCurrency(totalPending)}</h4>
                                <small>Pendiente</small>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="well well-sm text-center">
                                <h4>{paidPayments.length} / {processedPayments.length}</h4>
                                <small>Pagos Realizados</small>
                            </div>
                        </div>
                    </div>

                    {/* Lista de pagos */}
                    {processedPayments.length === 0 ? (
                        <div className="alert alert-info text-center">
                            <i className="fa fa-info-circle"></i> No hay pagos registrados aún.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Concepto</th>
                                        <th>Fecha Vencimiento</th>
                                        <th>Monto</th>
                                        <th>Estado</th>
                                        <th>Comprobante</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedPayments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>{payment.concept}</td>
                                            <td>
                                                {new Date(payment.dueDate).toLocaleDateString('es-MX')}
                                                {payment.paymentDate && payment.status === 'paid' && (
                                                    <small className="text-muted">
                                                        <br />Pagado: {new Date(payment.paymentDate).toLocaleDateString('es-MX')}
                                                    </small>
                                                )}
                                            </td>
                                            <td>
                                                {formatCurrency(payment.amount)}
                                                {(payment as any).verifiedAmount && (
                                                    <small className="text-success">
                                                        <br /><i className="fa fa-check"></i> Verificado
                                                    </small>
                                                )}
                                            </td>
                                            <td>{getStatusBadge(payment.status)}</td>
                                            <td>
                                                {payment.receiptUrl ? (
                                                    <a
                                                        href={payment.receiptUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-xs btn-info"
                                                    >
                                                        <i className="fa fa-file"></i> Ver
                                                    </a>
                                                ) : (
                                                    <label className={`btn btn-xs btn-default ${verifying ? 'disabled' : ''}`}>
                                                        {verifying ? (
                                                            <><i className="fa fa-spinner fa-spin"></i> Verificando...</>
                                                        ) : (
                                                            <><i className="fa fa-upload"></i> Subir</>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*,.pdf"
                                                            style={{ display: 'none' }}
                                                            disabled={verifying}
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file && payment.id) {
                                                                    uploadAndVerifyReceipt(payment.id, file, payment.amount);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </td>
                                            <td>
                                                {payment.status !== 'paid' && (
                                                    <>
                                                        <button
                                                            className="btn btn-xs btn-success"
                                                            onClick={() => payment.id && markAsPaid(payment.id)}
                                                            style={{ marginRight: '5px' }}
                                                        >
                                                            <i className="fa fa-check"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-xs btn-warning"
                                                            onClick={() => openReminderModal(payment)}
                                                            title="Enviar recordatorio"
                                                        >
                                                            <i className="fa fa-bell"></i>
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para agregar pago */}
            {showAddModal && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
                    <div className="modal-dialog" style={{ marginTop: '100px' }}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" onClick={() => setShowAddModal(false)}>
                                    <span>&times;</span>
                                </button>
                                <h4 className="modal-title">Registrar Nuevo Pago</h4>
                            </div>
                            <form onSubmit={handleAddPayment}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Concepto</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newPayment.concept}
                                            onChange={(e) => setNewPayment({ ...newPayment, concept: e.target.value })}
                                            placeholder="Ej: Renta mensual, Depósito, etc."
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Monto</label>
                                        <div className="input-group">
                                            <span className="input-group-addon">$</span>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={newPayment.amount}
                                                onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) })}
                                                min="0"
                                                step="0.01"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha de Pago</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={newPayment.paymentDate}
                                            onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Comprobante (opcional)</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*,.pdf"
                                            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Notas (opcional)</label>
                                        <textarea
                                            className="form-control"
                                            value={newPayment.notes}
                                            onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                                            rows={2}
                                            placeholder="Observaciones adicionales..."
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-default" onClick={() => setShowAddModal(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-success" disabled={uploading}>
                                        {uploading ? (
                                            <><i className="fa fa-spinner fa-spin"></i> Guardando...</>
                                        ) : (
                                            <><i className="fa fa-save"></i> Guardar Pago</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para enviar recordatorio */}
            {showReminderModal && selectedPayment && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
                    <div className="modal-dialog" style={{ marginTop: '100px' }}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" onClick={() => setShowReminderModal(false)}>
                                    <span>&times;</span>
                                </button>
                                <h4 className="modal-title"><i className="fa fa-bell"></i> Enviar Recordatorio</h4>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info">
                                    <strong>Pago:</strong> {selectedPayment.concept}<br />
                                    <strong>Monto:</strong> {formatCurrency(selectedPayment.amount)}<br />
                                    <strong>Vencimiento:</strong> {new Date(selectedPayment.dueDate).toLocaleDateString('es-MX')}
                                </div>

                                <p><strong>Enviar recordatorio por:</strong></p>

                                <div className="well">
                                    <div className="checkbox">
                                        <label>
                                            <input type="checkbox" id="reminderTelegram" defaultChecked={!!telegramChatId} disabled={!telegramChatId} />
                                            <i className="fa fa-telegram" style={{ color: '#0088cc' }}></i> Telegram
                                            {telegramChatId ? ' (Configurado)' : ' - No configurado'}
                                        </label>
                                    </div>
                                    <div className="checkbox">
                                        <label>
                                            <input type="checkbox" id="reminderEmail" defaultChecked={!!tenantEmail} disabled={!tenantEmail} />
                                            <i className="fa fa-envelope text-primary"></i> Email
                                            {tenantEmail ? ` (${tenantEmail})` : ' - No hay email registrado'}
                                        </label>
                                    </div>
                                </div>

                                {!telegramChatId && (
                                    <div className="alert alert-info" style={{ fontSize: '12px' }}>
                                        <i className="fa fa-info-circle"></i> Para usar Telegram, el inquilino debe configurar su chat ID.
                                    </div>
                                )}

                                {/* Vista previa del mensaje */}
                                <details style={{ marginTop: '15px' }}>
                                    <summary style={{ cursor: 'pointer', color: '#337ab7' }}>
                                        <i className="fa fa-eye"></i> Vista previa del mensaje
                                    </summary>
                                    <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', marginTop: '10px', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                                        {reminderService.getPreviewMessage({
                                            tenantName,
                                            tenantEmail,
                                            tenantPhone,
                                            telegramChatId,
                                            amount: selectedPayment.amount,
                                            dueDate: new Date(selectedPayment.dueDate).toLocaleDateString('es-MX'),
                                            department,
                                            isOverdue: new Date(selectedPayment.dueDate) < new Date()
                                        }, 'telegram')}
                                    </pre>
                                </details>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" onClick={() => setShowReminderModal(false)}>
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-warning"
                                    disabled={sendingReminder}
                                    onClick={() => {
                                        const telegram = (document.getElementById('reminderTelegram') as HTMLInputElement)?.checked;
                                        const email = (document.getElementById('reminderEmail') as HTMLInputElement)?.checked;
                                        if (!telegram && !email) {
                                            alert('Selecciona al menos un canal de envío');
                                            return;
                                        }
                                        sendPaymentReminder(selectedPayment, { telegram, email });
                                    }}
                                >
                                    {sendingReminder ? (
                                        <><i className="fa fa-spinner fa-spin"></i> Enviando...</>
                                    ) : (
                                        <><i className="fa fa-paper-plane"></i> Enviar Recordatorio</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentManager;
