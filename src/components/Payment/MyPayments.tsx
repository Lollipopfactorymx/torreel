import React, { useState, useEffect, useContext } from 'react';
import { withRouter } from 'react-router-dom';
import HeaderTE from '../HeaderTE';
import SideBarAdmin from '../Admin/SidebarAdmin';
import { withFirebase } from '../Firebase';
import { AuthUserContext } from '../Session';
import CloudinaryService from '../../services/CloudinaryService';

import vectoresFondoImg from '../../assets/images/vectores-fondo.png';

interface Payment {
    id?: string;
    amount: number;
    date: string;
    concept: string;
    status: string;
    receiptUrl?: string;
}

interface MyPaymentsProps {
    firebase: any;
    history: any;
}

const MyPaymentsBase: React.FC<MyPaymentsProps> = ({ firebase }) => {
    const authUser = useContext(AuthUserContext) as any;
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [newPayment, setNewPayment] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        concept: 'Renta mensual',
        receiptFile: null as File | null
    });

    const cloudinaryService = new CloudinaryService();

    useEffect(() => {
        if (!authUser) {
            setLoading(false);
            return;
        }

        firebase.users().doc(authUser.uid).get()
            .then((doc: any) => {
                if (doc.exists) {
                    const userData = doc.data();
                    setUserInfo(userData);
                    setPayments(userData.payments || []);
                }
                setLoading(false);
            })
            .catch((err: any) => {
                console.error('Error loading payments:', err);
                setError('Error al cargar pagos');
                setLoading(false);
            });
    }, [authUser, firebase]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewPayment({ ...newPayment, receiptFile: file });
        }
    };

    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        setError(null);

        try {
            let receiptUrl = '';

            // Subir comprobante a Cloudinary
            if (newPayment.receiptFile) {
                console.log('Subiendo comprobante...');
                const uploadResult = await cloudinaryService.uploadImage(
                    newPayment.receiptFile,
                    `pagos/${authUser.uid}`
                );
                receiptUrl = uploadResult.secure_url;
                console.log('Comprobante subido:', receiptUrl);
            }

            // Crear nuevo pago
            const payment: Payment = {
                id: Date.now().toString(),
                amount: parseFloat(newPayment.amount),
                date: newPayment.date,
                concept: newPayment.concept,
                status: 'pending', // Pendiente de verificación por admin
                receiptUrl
            };

            // Actualizar pagos del usuario
            const updatedPayments = [...payments, payment];
            await firebase.users().doc(authUser.uid).update({
                payments: updatedPayments
            });

            setPayments(updatedPayments);
            setSuccess('Pago registrado correctamente. Pendiente de verificación.');
            setShowModal(false);
            setNewPayment({
                amount: '',
                date: new Date().toISOString().split('T')[0],
                concept: 'Renta mensual',
                receiptFile: null
            });

        } catch (err: any) {
            console.error('Error al registrar pago:', err);
            setError(`Error al registrar pago: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const totalPaid = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingPayments = payments.filter(p => p.status === 'pending');

    if (!authUser) {
        return (
            <div>
                <HeaderTE small="true" />
                <div className="container text-center" style={{ marginTop: '100px' }}>
                    <div className="alert alert-warning">
                        <h3>No has iniciado sesión</h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <HeaderTE small="true" />
            <div className="fondo-rayas container-fluid">
                <div className="row">
                    <SideBarAdmin email={authUser?.email} />

                    <div className="col-xs-10 col-sm-9 col-md-10">
                        <img src={vectoresFondoImg} className="img-responsive imgfondoadmin" alt="" />
                        <div className="bubble-wrapper row text-center">
                            <div className="col-xs-1">
                                <div className="bubble-triangle"></div>
                            </div>
                            <div className="bubble col-xs-11 col-xs-offset-1 col-md-10 col-md-offset-0 col-lg-9">
                                <h1>·Mis Pagos·</h1>

                                <div id="pagos" className="panel panel-default">
                                    <div className="panel-body">
                                        {error && (
                                            <div className="alert alert-danger">
                                                <strong>Error:</strong> {error}
                                                <button type="button" className="close" onClick={() => setError(null)}>
                                                    <span>&times;</span>
                                                </button>
                                            </div>
                                        )}

                                        {success && (
                                            <div className="alert alert-success">
                                                <strong>Éxito:</strong> {success}
                                                <button type="button" className="close" onClick={() => setSuccess(null)}>
                                                    <span>&times;</span>
                                                </button>
                                            </div>
                                        )}

                                        {loading ? (
                                            <div className="text-center">
                                                <h3>Cargando pagos...</h3>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Resumen */}
                                                <div className="row text-left">
                                                    <div className="col-md-4">
                                                        <div className="well text-center">
                                                            <h4>Total Pagado</h4>
                                                            <h2 className="text-success">${totalPaid.toLocaleString()}</h2>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="well text-center">
                                                            <h4>Pendientes</h4>
                                                            <h2 className="text-warning">{pendingPayments.length}</h2>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="well text-center">
                                                            <h4>Renta Mensual</h4>
                                                            <h2>${userInfo?.amount || 0}</h2>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Botón para nuevo pago */}
                                                <div className="row" style={{ marginTop: '20px', marginBottom: '20px' }}>
                                                    <div className="col-xs-12 text-right">
                                                        <button
                                                            className="btn btn-success btn-lg"
                                                            onClick={() => setShowModal(true)}
                                                        >
                                                            <i className="fa fa-plus"></i> Registrar Nuevo Pago
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Historial de pagos */}
                                                <div className="row">
                                                    <div className="col-xs-12">
                                                        <h3>Historial de Pagos</h3>
                                                        {payments.length === 0 ? (
                                                            <div className="alert alert-info">
                                                                No tienes pagos registrados aún.
                                                            </div>
                                                        ) : (
                                                            <table className="table table-bordered table-striped">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Fecha</th>
                                                                        <th>Concepto</th>
                                                                        <th>Monto</th>
                                                                        <th>Estado</th>
                                                                        <th>Comprobante</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {payments.map((payment, index) => (
                                                                        <tr key={payment.id || index}>
                                                                            <td>{payment.date}</td>
                                                                            <td>{payment.concept}</td>
                                                                            <td>${payment.amount?.toLocaleString()} MXN</td>
                                                                            <td>
                                                                                {payment.status === 'paid' ? (
                                                                                    <span className="label label-success">Verificado</span>
                                                                                ) : (
                                                                                    <span className="label label-warning">Pendiente</span>
                                                                                )}
                                                                            </td>
                                                                            <td>
                                                                                {payment.receiptUrl ? (
                                                                                    <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-info">
                                                                                        Ver
                                                                                    </a>
                                                                                ) : (
                                                                                    <span className="text-muted">-</span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Información de pago */}
                                                <div className="row text-left" style={{ marginTop: '20px' }}>
                                                    <div className="col-xs-12">
                                                        <div className="well">
                                                            <h4>Datos para Transferencia</h4>
                                                            <p><strong>Banco:</strong> BBVA</p>
                                                            <p><strong>Cuenta:</strong> XXXX-XXXX-XXXX-XXXX</p>
                                                            <p><strong>CLABE:</strong> XXXXXXXXXXXXXXXXXXXX</p>
                                                            <p><strong>Beneficiario:</strong> José Luis Palillero Hernández</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div className="gradient-padding">
                                            <div className="gradient"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para nuevo pago */}
            {showModal && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" onClick={() => setShowModal(false)}>
                                    <span>&times;</span>
                                </button>
                                <h4 className="modal-title">Registrar Nuevo Pago</h4>
                            </div>
                            <form onSubmit={handleSubmitPayment}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label>Monto (MXN) *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={newPayment.amount}
                                            onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                                            placeholder="Ej: 3500"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Fecha de Pago *</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={newPayment.date}
                                            onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Concepto</label>
                                        <select
                                            className="form-control"
                                            value={newPayment.concept}
                                            onChange={(e) => setNewPayment({ ...newPayment, concept: e.target.value })}
                                        >
                                            <option value="Renta mensual">Renta mensual</option>
                                            <option value="Depósito">Depósito</option>
                                            <option value="Servicios">Servicios</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Comprobante de Pago *</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept="image/*,.pdf"
                                            onChange={handleFileChange}
                                            required
                                        />
                                        <small className="text-muted">Sube una imagen o PDF del comprobante</small>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-success" disabled={uploading}>
                                        {uploading ? 'Subiendo...' : 'Registrar Pago'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MyPayments = withRouter(withFirebase(MyPaymentsBase));

export default MyPayments;
