import React from 'react';
import HeaderTE from '../HeaderTE';
import { withFirebase } from '../Firebase';
import SideBarAdmin from '../Admin/SidebarAdmin';
import { AuthUserContext, withAuthorization } from '../Session';

import * as ROLES from '../../constants/roles';

import vectoresFondoImg from '../../assets/images/vectores-fondo.png';

interface PaymentItem {
    id?: string;
    amount: number;
    date: string;
    concept: string;
    status: string;
    receiptUrl?: string;
}

interface UserWithPayments {
    uid: string;
    fullname: string;
    email: string;
    department: string;
    payments: PaymentItem[];
}

interface PaymentState {
    loading: boolean;
    users: UserWithPayments[];
    selectedReceipt: string | null;
    verifying: string | null;
    filter: 'all' | 'pending' | 'paid';
}

class Payment extends React.Component<any, PaymentState> {
    constructor(props: any) {
        super(props);
        this.state = {
            loading: false,
            users: [],
            selectedReceipt: null,
            verifying: null,
            filter: 'pending'
        };
    }

    componentDidMount() {
        this.loadPayments();
    }

    loadPayments = () => {
        this.setState({ loading: true });
        this.props.firebase.users().get()
            .then((querySnapshot: any) => {
                const usersList: UserWithPayments[] = [];
                querySnapshot.forEach((doc: any) => {
                    const userData = doc.data();
                    // Solo incluir usuarios con pagos
                    if (userData.payments && userData.payments.length > 0) {
                        usersList.push({
                            uid: doc.id,
                            fullname: userData.fullname || 'Sin nombre',
                            email: userData.email || '',
                            department: userData.department || 'N/A',
                            payments: userData.payments || []
                        });
                    }
                });

                this.setState({
                    users: usersList,
                    loading: false,
                });
            })
            .catch((error: any) => {
                console.error('Error loading payments:', error);
                this.setState({ loading: false });
            });
    }

    verifyPayment = async (userId: string, paymentId: string) => {
        this.setState({ verifying: `${userId}-${paymentId}` });

        try {
            const user = this.state.users.find(u => u.uid === userId);
            if (!user) return;

            const updatedPayments = user.payments.map(p => {
                if (p.id === paymentId) {
                    return { ...p, status: 'paid' };
                }
                return p;
            });

            await this.props.firebase.users().doc(userId).update({
                payments: updatedPayments
            });

            // Actualizar estado local
            this.setState(prevState => ({
                users: prevState.users.map(u => {
                    if (u.uid === userId) {
                        return { ...u, payments: updatedPayments };
                    }
                    return u;
                }),
                verifying: null
            }));

        } catch (error) {
            console.error('Error verifying payment:', error);
            alert('Error al verificar el pago');
            this.setState({ verifying: null });
        }
    }

    rejectPayment = async (userId: string, paymentId: string) => {
        if (!window.confirm('¿Estás seguro de rechazar este pago?')) return;

        this.setState({ verifying: `${userId}-${paymentId}` });

        try {
            const user = this.state.users.find(u => u.uid === userId);
            if (!user) return;

            const updatedPayments = user.payments.map(p => {
                if (p.id === paymentId) {
                    return { ...p, status: 'rejected' };
                }
                return p;
            });

            await this.props.firebase.users().doc(userId).update({
                payments: updatedPayments
            });

            this.setState(prevState => ({
                users: prevState.users.map(u => {
                    if (u.uid === userId) {
                        return { ...u, payments: updatedPayments };
                    }
                    return u;
                }),
                verifying: null
            }));

        } catch (error) {
            console.error('Error rejecting payment:', error);
            this.setState({ verifying: null });
        }
    }

    getAllPayments = () => {
        const allPayments: Array<PaymentItem & { userId: string; userName: string; userDepartment: string }> = [];

        this.state.users.forEach(user => {
            user.payments.forEach(payment => {
                allPayments.push({
                    ...payment,
                    userId: user.uid,
                    userName: user.fullname,
                    userDepartment: user.department
                });
            });
        });

        // Filtrar según el filtro seleccionado
        if (this.state.filter === 'pending') {
            return allPayments.filter(p => p.status === 'pending');
        } else if (this.state.filter === 'paid') {
            return allPayments.filter(p => p.status === 'paid');
        }

        return allPayments;
    }

    render() {
        const { loading, selectedReceipt, verifying, filter } = this.state;
        const allPayments = this.getAllPayments();

        const pendingCount = this.state.users.reduce((sum, u) =>
            sum + u.payments.filter(p => p.status === 'pending').length, 0);
        const verifiedCount = this.state.users.reduce((sum, u) =>
            sum + u.payments.filter(p => p.status === 'paid').length, 0);
        const totalAmount = this.state.users.reduce((sum, u) =>
            sum + u.payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0), 0);

        return (
            <AuthUserContext.Consumer>
                {(authUser: any) => (
                    <div>
                        <HeaderTE small='true' />
                        <div className='fondo-rayas container-fluid'>
                            <div className='row'>
                                <SideBarAdmin email={authUser?.email} />

                                <div className='col-xs-10 col-sm-9 col-md-10'>
                                    <img src={vectoresFondoImg} className='img-responsive imgfondoadmin' alt='' />
                                    <div className='bubble-wrapper row text-center'>
                                        <div className='col-xs-1'>
                                            <div className='bubble-triangle'></div>
                                        </div>
                                        <div className='bubble col-xs-11 col-xs-offset-1 col-md-10 col-md-offset-0 col-lg-9'>
                                            <h1>·Gestión de Pagos·</h1>

                                            <div id='pagos-admin' className='panel panel-default'>
                                                <div className='panel-body'>
                                                    {/* Resumen */}
                                                    <div className='row'>
                                                        <div className='col-md-4'>
                                                            <div className='well text-center'>
                                                                <h4>Pagos Pendientes</h4>
                                                                <h2 className='text-warning'>{pendingCount}</h2>
                                                            </div>
                                                        </div>
                                                        <div className='col-md-4'>
                                                            <div className='well text-center'>
                                                                <h4>Pagos Verificados</h4>
                                                                <h2 className='text-success'>{verifiedCount}</h2>
                                                            </div>
                                                        </div>
                                                        <div className='col-md-4'>
                                                            <div className='well text-center'>
                                                                <h4>Total Recaudado</h4>
                                                                <h2 className='text-primary'>${totalAmount.toLocaleString()}</h2>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Filtros */}
                                                    <div className='row' style={{ marginTop: '20px', marginBottom: '20px' }}>
                                                        <div className='col-xs-12'>
                                                            <div className='btn-group'>
                                                                <button
                                                                    className={`btn ${filter === 'pending' ? 'btn-warning' : 'btn-default'}`}
                                                                    onClick={() => this.setState({ filter: 'pending' })}
                                                                >
                                                                    Pendientes ({pendingCount})
                                                                </button>
                                                                <button
                                                                    className={`btn ${filter === 'paid' ? 'btn-success' : 'btn-default'}`}
                                                                    onClick={() => this.setState({ filter: 'paid' })}
                                                                >
                                                                    Verificados ({verifiedCount})
                                                                </button>
                                                                <button
                                                                    className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-default'}`}
                                                                    onClick={() => this.setState({ filter: 'all' })}
                                                                >
                                                                    Todos
                                                                </button>
                                                            </div>
                                                            <button
                                                                className='btn btn-info pull-right'
                                                                onClick={this.loadPayments}
                                                            >
                                                                <i className='fa fa-refresh'></i> Actualizar
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Tabla de pagos */}
                                                    <div className='row'>
                                                        <div className='col-xs-12'>
                                                            {loading ? (
                                                                <div className='text-center'>
                                                                    <h3>Cargando pagos...</h3>
                                                                </div>
                                                            ) : allPayments.length === 0 ? (
                                                                <div className='alert alert-info'>
                                                                    No hay pagos {filter === 'pending' ? 'pendientes' : filter === 'paid' ? 'verificados' : ''} para mostrar.
                                                                </div>
                                                            ) : (
                                                                <table className='table table-bordered table-striped'>
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Inquilino</th>
                                                                            <th>Depto.</th>
                                                                            <th>Fecha</th>
                                                                            <th>Concepto</th>
                                                                            <th>Monto</th>
                                                                            <th>Estado</th>
                                                                            <th>Comprobante</th>
                                                                            <th>Acciones</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {allPayments.map((payment, index) => (
                                                                            <tr key={`${payment.userId}-${payment.id || index}`}>
                                                                                <td>{payment.userName}</td>
                                                                                <td>{payment.userDepartment}</td>
                                                                                <td>{payment.date}</td>
                                                                                <td>{payment.concept}</td>
                                                                                <td>${payment.amount?.toLocaleString()} MXN</td>
                                                                                <td>
                                                                                    {payment.status === 'paid' ? (
                                                                                        <span className='label label-success'>Verificado</span>
                                                                                    ) : payment.status === 'rejected' ? (
                                                                                        <span className='label label-danger'>Rechazado</span>
                                                                                    ) : (
                                                                                        <span className='label label-warning'>Pendiente</span>
                                                                                    )}
                                                                                </td>
                                                                                <td>
                                                                                    {payment.receiptUrl ? (
                                                                                        <button
                                                                                            className='btn btn-xs btn-info'
                                                                                            onClick={() => this.setState({ selectedReceipt: payment.receiptUrl || null })}
                                                                                        >
                                                                                            <i className='fa fa-eye'></i> Ver
                                                                                        </button>
                                                                                    ) : (
                                                                                        <span className='text-muted'>-</span>
                                                                                    )}
                                                                                </td>
                                                                                <td>
                                                                                    {payment.status === 'pending' && (
                                                                                        <>
                                                                                            <button
                                                                                                className='btn btn-xs btn-success'
                                                                                                onClick={() => this.verifyPayment(payment.userId, payment.id || '')}
                                                                                                disabled={verifying === `${payment.userId}-${payment.id}`}
                                                                                            >
                                                                                                {verifying === `${payment.userId}-${payment.id}` ? '...' : (
                                                                                                    <><i className='fa fa-check'></i> Verificar</>
                                                                                                )}
                                                                                            </button>
                                                                                            {' '}
                                                                                            <button
                                                                                                className='btn btn-xs btn-danger'
                                                                                                onClick={() => this.rejectPayment(payment.userId, payment.id || '')}
                                                                                                disabled={verifying === `${payment.userId}-${payment.id}`}
                                                                                            >
                                                                                                <i className='fa fa-times'></i>
                                                                                            </button>
                                                                                        </>
                                                                                    )}
                                                                                    {payment.status === 'paid' && (
                                                                                        <span className='text-success'>
                                                                                            <i className='fa fa-check-circle'></i>
                                                                                        </span>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className='gradient-padding'>
                                                        <div className='gradient'></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal para ver comprobante */}
                        {selectedReceipt && (
                            <div className='modal' style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.7)' }}>
                                <div className='modal-dialog modal-lg'>
                                    <div className='modal-content'>
                                        <div className='modal-header'>
                                            <button
                                                type='button'
                                                className='close'
                                                onClick={() => this.setState({ selectedReceipt: null })}
                                            >
                                                <span>&times;</span>
                                            </button>
                                            <h4 className='modal-title'>Comprobante de Pago</h4>
                                        </div>
                                        <div className='modal-body text-center'>
                                            <img
                                                src={selectedReceipt}
                                                alt='Comprobante'
                                                style={{ maxWidth: '100%', maxHeight: '70vh' }}
                                            />
                                        </div>
                                        <div className='modal-footer'>
                                            <a
                                                href={selectedReceipt}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className='btn btn-primary'
                                            >
                                                <i className='fa fa-external-link'></i> Abrir en nueva pestaña
                                            </a>
                                            <button
                                                type='button'
                                                className='btn btn-default'
                                                onClick={() => this.setState({ selectedReceipt: null })}
                                            >
                                                Cerrar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </AuthUserContext.Consumer>
        );
    }
}

const condition = (authUser: any) => authUser && authUser.roles && authUser.roles[ROLES.ADMIN];

export default withAuthorization(condition)(withFirebase(Payment));
