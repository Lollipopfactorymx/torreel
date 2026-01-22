import React, { useState, useEffect } from 'react';
import TelegramService from '../../services/telegramService';

interface PaymentVerificationResult {
    success: boolean;
    amount?: number;
    date?: string;
    reference?: string;
    bank?: string;
    confidence: number;
    error?: string;
}

interface TelegramPayment {
    id: string;
    userId: string;
    tenantName: string;
    department: string;
    receiptUrl: string;
    uploadedAt: string;
    verificationResult: PaymentVerificationResult;
    status: 'pending_approval' | 'needs_review' | 'approved' | 'rejected';
    submittedVia: string;
    chatId?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reviewNotes?: string;
}

interface TelegramPaymentsReviewProps {
    firebase: any;
}

const TelegramPaymentsReview: React.FC<TelegramPaymentsReviewProps> = ({ firebase }) => {
    const [payments, setPayments] = useState<TelegramPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('pending');
    const [selectedPayment, setSelectedPayment] = useState<TelegramPayment | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const telegramService = new TelegramService();

    useEffect(() => {
        loadPayments();
    }, [filter]);

    const loadPayments = async () => {
        setLoading(true);
        try {
            let query = firebase.db.collection('payments')
                .where('submittedVia', '==', 'telegram');

            if (filter === 'pending') {
                query = query.where('status', 'in', ['pending_approval', 'needs_review']);
            } else if (filter !== 'all') {
                query = query.where('status', '==', filter);
            }

            const snapshot = await query.orderBy('uploadedAt', 'desc').limit(50).get();

            const paymentsData: TelegramPayment[] = [];
            snapshot.forEach((doc) => {
                paymentsData.push({
                    id: doc.id,
                    ...doc.data()
                } as TelegramPayment);
            });

            setPayments(paymentsData);
        } catch (error) {
            console.error('Error cargando pagos:', error);
            alert('Error al cargar los pagos');
        } finally {
            setLoading(false);
        }
    };

    const openReviewModal = (payment: TelegramPayment) => {
        setSelectedPayment(payment);
        setReviewNotes('');
        setShowModal(true);
    };

    const handleApprove = async () => {
        if (!selectedPayment) return;

        setProcessing(true);
        try {
            // Actualizar estado en Firebase
            await firebase.db.collection('payments').doc(selectedPayment.id).update({
                status: 'approved',
                reviewedAt: new Date().toISOString(),
                reviewedBy: firebase.auth.currentUser?.email || 'admin',
                reviewNotes: reviewNotes || 'Pago aprobado'
            });

            // Notificar al inquilino por Telegram
            if (selectedPayment.chatId) {
                const amount = selectedPayment.verificationResult.amount || 0;
                const formatCurrency = (n: number) =>
                    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

                await telegramService.sendMessage({
                    chatId: selectedPayment.chatId,
                    text: `✅ *Pago Aprobado*\n\n` +
                        `Hola ${selectedPayment.tenantName},\n\n` +
                        `Tu pago de *${formatCurrency(amount)}* ha sido *aprobado* por el administrador.\n\n` +
                        `Fecha de pago: ${selectedPayment.verificationResult.date || 'N/A'}\n` +
                        `Referencia: ${selectedPayment.verificationResult.reference || 'N/A'}\n\n` +
                        `¡Gracias por tu puntualidad! 🙏`,
                    parseMode: 'Markdown'
                });
            }

            alert('Pago aprobado correctamente');
            setShowModal(false);
            setSelectedPayment(null);
            loadPayments();
        } catch (error) {
            console.error('Error aprobando pago:', error);
            alert('Error al aprobar el pago');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedPayment) return;

        if (!reviewNotes.trim()) {
            alert('Por favor, proporciona una razón para el rechazo');
            return;
        }

        setProcessing(true);
        try {
            // Actualizar estado en Firebase
            await firebase.db.collection('payments').doc(selectedPayment.id).update({
                status: 'rejected',
                reviewedAt: new Date().toISOString(),
                reviewedBy: firebase.auth.currentUser?.email || 'admin',
                reviewNotes: reviewNotes
            });

            // Notificar al inquilino por Telegram
            if (selectedPayment.chatId) {
                await telegramService.sendMessage({
                    chatId: selectedPayment.chatId,
                    text: `❌ *Pago Rechazado*\n\n` +
                        `Hola ${selectedPayment.tenantName},\n\n` +
                        `Tu comprobante de pago ha sido *rechazado*.\n\n` +
                        `*Motivo:* ${reviewNotes}\n\n` +
                        `Por favor, envía un nuevo comprobante que cumpla con los requisitos.\n\n` +
                        `Si tienes dudas, contacta al administrador.`,
                    parseMode: 'Markdown'
                });
            }

            alert('Pago rechazado. Se notificó al inquilino.');
            setShowModal(false);
            setSelectedPayment(null);
            loadPayments();
        } catch (error) {
            console.error('Error rechazando pago:', error);
            alert('Error al rechazar el pago');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending_approval':
                return <span className="label label-warning">Pendiente de Aprobación</span>;
            case 'needs_review':
                return <span className="label label-danger">Requiere Revisión</span>;
            case 'approved':
                return <span className="label label-success">Aprobado</span>;
            case 'rejected':
                return <span className="label label-default">Rechazado</span>;
            default:
                return <span className="label label-info">{status}</span>;
        }
    };

    const formatCurrency = (amount: number | undefined) => {
        if (!amount) return 'N/A';
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="panel panel-primary">
            <div className="panel-heading">
                <h4><i className="fa fa-telegram"></i> Pagos Recibidos por Telegram</h4>
            </div>
            <div className="panel-body">
                <div className="alert alert-info">
                    <i className="fa fa-info-circle"></i> Los inquilinos pueden enviar sus comprobantes de pago directamente por Telegram.
                    El sistema usa inteligencia artificial para verificarlos automáticamente.
                </div>

                {/* Filtros */}
                <div className="btn-group" style={{ marginBottom: '20px' }}>
                    <button
                        className={`btn ${filter === 'pending' ? 'btn-warning' : 'btn-default'}`}
                        onClick={() => setFilter('pending')}
                    >
                        <i className="fa fa-clock-o"></i> Pendientes
                    </button>
                    <button
                        className={`btn ${filter === 'approved' ? 'btn-success' : 'btn-default'}`}
                        onClick={() => setFilter('approved')}
                    >
                        <i className="fa fa-check"></i> Aprobados
                    </button>
                    <button
                        className={`btn ${filter === 'rejected' ? 'btn-danger' : 'btn-default'}`}
                        onClick={() => setFilter('rejected')}
                    >
                        <i className="fa fa-times"></i> Rechazados
                    </button>
                    <button
                        className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-default'}`}
                        onClick={() => setFilter('all')}
                    >
                        <i className="fa fa-list"></i> Todos
                    </button>
                </div>

                {loading ? (
                    <div className="text-center">
                        <i className="fa fa-spinner fa-spin fa-2x"></i>
                        <p>Cargando pagos...</p>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="alert alert-warning">
                        <i className="fa fa-exclamation-triangle"></i> No hay pagos en esta categoría.
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Inquilino</th>
                                    <th>Depto</th>
                                    <th>Monto</th>
                                    <th>Fecha Pago</th>
                                    <th>Confianza IA</th>
                                    <th>Estado</th>
                                    <th>Recibido</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td><strong>{payment.tenantName}</strong></td>
                                        <td>{payment.department}</td>
                                        <td>
                                            {formatCurrency(payment.verificationResult.amount)}
                                            {payment.verificationResult.bank && (
                                                <div style={{ fontSize: '11px', color: '#666' }}>
                                                    {payment.verificationResult.bank}
                                                </div>
                                            )}
                                        </td>
                                        <td>{payment.verificationResult.date || 'N/A'}</td>
                                        <td>
                                            <span className={`label ${
                                                payment.verificationResult.confidence >= 80 ? 'label-success' :
                                                payment.verificationResult.confidence >= 50 ? 'label-warning' :
                                                'label-danger'
                                            }`}>
                                                {payment.verificationResult.confidence}%
                                            </span>
                                        </td>
                                        <td>{getStatusBadge(payment.status)}</td>
                                        <td style={{ fontSize: '11px' }}>
                                            {formatDate(payment.uploadedAt)}
                                        </td>
                                        <td>
                                            <a
                                                href={payment.receiptUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-xs btn-info"
                                                style={{ marginRight: '5px' }}
                                            >
                                                <i className="fa fa-eye"></i> Ver
                                            </a>
                                            {(payment.status === 'pending_approval' || payment.status === 'needs_review') && (
                                                <button
                                                    onClick={() => openReviewModal(payment)}
                                                    className="btn btn-xs btn-primary"
                                                >
                                                    <i className="fa fa-check-square-o"></i> Revisar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Revisión */}
            {showModal && selectedPayment && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" onClick={() => setShowModal(false)}>
                                    <span>&times;</span>
                                </button>
                                <h4 className="modal-title">Revisar Pago de {selectedPayment.tenantName}</h4>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h5>Comprobante</h5>
                                        <img
                                            src={selectedPayment.receiptUrl}
                                            alt="Comprobante"
                                            style={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <h5>Información Extraída por IA</h5>
                                        <table className="table table-bordered">
                                            <tbody>
                                                <tr>
                                                    <th>Inquilino:</th>
                                                    <td>{selectedPayment.tenantName}</td>
                                                </tr>
                                                <tr>
                                                    <th>Departamento:</th>
                                                    <td>{selectedPayment.department}</td>
                                                </tr>
                                                <tr>
                                                    <th>Monto:</th>
                                                    <td><strong>{formatCurrency(selectedPayment.verificationResult.amount)}</strong></td>
                                                </tr>
                                                <tr>
                                                    <th>Fecha de pago:</th>
                                                    <td>{selectedPayment.verificationResult.date || 'No detectada'}</td>
                                                </tr>
                                                <tr>
                                                    <th>Banco:</th>
                                                    <td>{selectedPayment.verificationResult.bank || 'No detectado'}</td>
                                                </tr>
                                                <tr>
                                                    <th>Referencia:</th>
                                                    <td>{selectedPayment.verificationResult.reference || 'No detectada'}</td>
                                                </tr>
                                                <tr>
                                                    <th>Confianza IA:</th>
                                                    <td>
                                                        <span className={`label ${
                                                            selectedPayment.verificationResult.confidence >= 80 ? 'label-success' :
                                                            selectedPayment.verificationResult.confidence >= 50 ? 'label-warning' :
                                                            'label-danger'
                                                        }`}>
                                                            {selectedPayment.verificationResult.confidence}%
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <th>Recibido:</th>
                                                    <td>{formatDate(selectedPayment.uploadedAt)}</td>
                                                </tr>
                                            </tbody>
                                        </table>

                                        <div className="form-group">
                                            <label>Notas de Revisión:</label>
                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                value={reviewNotes}
                                                onChange={(e) => setReviewNotes(e.target.value)}
                                                placeholder="Agrega notas sobre esta revisión (opcional para aprobación, obligatorio para rechazo)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={handleReject}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <><i className="fa fa-spinner fa-spin"></i> Procesando...</>
                                    ) : (
                                        <><i className="fa fa-times"></i> Rechazar</>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleApprove}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <><i className="fa fa-spinner fa-spin"></i> Procesando...</>
                                    ) : (
                                        <><i className="fa fa-check"></i> Aprobar</>
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

export default TelegramPaymentsReview;
