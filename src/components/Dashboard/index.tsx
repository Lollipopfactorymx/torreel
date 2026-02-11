import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router-dom';
import HeaderTE from '../HeaderTE';
import SideBarAdmin from '../Admin/SidebarAdmin';
import { AuthUserContext } from '../Session';
import { withFirebase } from '../Firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import * as ROUTES from '../../constants/routes';
import * as ROLES from '../../constants/roles';
import { TenantDocumentation, DOCUMENT_CHECKLIST } from '../../types';

import vectoresFondoImg from '../../assets/images/vectores-fondo.png';
import contractIcon from '../../assets/images/contract-icon.png';
import moneyIcon from '../../assets/images/money-icon.png';
import userIcon from '../../assets/images/user-icon.png';
import chartIcon from '../../assets/images/chart-icon.png';

interface DashboardProps {
    firebase: any;
    history: any;
}

const Dashboard: React.FC<DashboardProps> = ({ firebase, history }) => {
    const authUser = useContext(AuthUserContext) as any;
    const [stats, setStats] = useState({
        totalTenants: 0,
        pendingPayments: 0,
        activeContracts: 0,
        pendingContracts: 0
    });
    const [userContract, setUserContract] = useState<any>(null);
    const [pendingPayments, setPendingPayments] = useState(0);
    const [documentation, setDocumentation] = useState<TenantDocumentation | null>(null);
    const [loading, setLoading] = useState(true);

    const isAdmin = authUser?.roles?.[ROLES.ADMIN];

    useEffect(() => {
        if (!authUser) {
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                if (isAdmin) {
                    // Cargar estadísticas para admin
                    const contractsRef = collection(firebase.db, 'contracts');
                    const pendingPaymentsQuery = query(collection(firebase.db, 'payments'), where('status', '==', 'pending'));
                    const [tenantsSnap, contractsSnap, paymentsSnap] = await Promise.all([
                        firebase.users().get(),
                        getDocs(contractsRef),
                        getDocs(pendingPaymentsQuery)
                    ]);

                    const tenantCount = tenantsSnap.docs.filter((doc: any) => !doc.data().roles?.[ROLES.ADMIN]).length;
                    const activeContracts = contractsSnap.docs.filter((doc: any) => doc.data().status === 'signed').length;
                    const pendingContracts = contractsSnap.docs.filter((doc: any) => doc.data().status === 'pending').length;

                    setStats({
                        totalTenants: tenantCount,
                        pendingPayments: paymentsSnap.size,
                        activeContracts,
                        pendingContracts
                    });
                } else {
                    // Cargar datos para inquilino
                    const contractsQuery = query(collection(firebase.db, 'contracts'), where('tenantId', '==', authUser.uid));
                    const paymentsQuery = query(collection(firebase.db, 'payments'), where('tenantId', '==', authUser.uid), where('status', '==', 'pending'));
                    const docsQuery = query(collection(firebase.db, 'tenantDocumentation'), where('tenantId', '==', authUser.uid));
                    const [contractSnap, paymentsSnap, docsSnap] = await Promise.all([
                        getDocs(contractsQuery),
                        getDocs(paymentsQuery),
                        getDocs(docsQuery)
                    ]);

                    if (!contractSnap.empty) {
                        const contractData: any = { id: contractSnap.docs[0].id, ...contractSnap.docs[0].data() };
                        setUserContract(contractData);

                        // Si el contrato tiene documentación embebida, usarla
                        if (contractData.documentation) {
                            setDocumentation(contractData.documentation);
                        }
                    }

                    // Si hay documentación en la colección separada, usarla
                    if (!docsSnap.empty) {
                        setDocumentation({ id: docsSnap.docs[0].id, ...docsSnap.docs[0].data() } as any);
                    }

                    setPendingPayments(paymentsSnap.size);
                }
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [authUser, firebase, isAdmin]);

    if (!authUser) {
        return (
            <div>
                <HeaderTE small="true" />
                <div className="container text-center" style={{ marginTop: '100px' }}>
                    <div className="alert alert-warning">
                        <h3>No has iniciado sesion</h3>
                        <p>Por favor <Link to={ROUTES.SIGN_IN}>inicia sesion</Link> para continuar.</p>
                    </div>
                </div>
            </div>
        );
    }

    const renderAdminDashboard = () => (
        <>
            <div className="row">
                {/* Tarjeta de Inquilinos */}
                <div className="col-md-3 col-sm-6">
                    <div className="panel panel-primary" style={{ borderColor: '#3498db' }}>
                        <div className="panel-heading" style={{ backgroundColor: '#3498db', borderColor: '#3498db' }}>
                            <div className="row">
                                <div className="col-xs-3">
                                    <img src={userIcon} alt="" style={{ width: '50px', filter: 'brightness(0) invert(1)' }} />
                                </div>
                                <div className="col-xs-9 text-right">
                                    <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.totalTenants}</div>
                                    <div>Inquilinos</div>
                                </div>
                            </div>
                        </div>
                        <Link to={ROUTES.TENANT} style={{ textDecoration: 'none' }}>
                            <div className="panel-footer" style={{ backgroundColor: '#2980b9', color: 'white', textAlign: 'center' }}>
                                Ver Inquilinos <i className="fa fa-arrow-circle-right"></i>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Tarjeta de Pagos Pendientes */}
                <div className="col-md-3 col-sm-6">
                    <div className="panel panel-warning" style={{ borderColor: '#f39c12' }}>
                        <div className="panel-heading" style={{ backgroundColor: '#f39c12', borderColor: '#f39c12' }}>
                            <div className="row">
                                <div className="col-xs-3">
                                    <img src={moneyIcon} alt="" style={{ width: '50px', filter: 'brightness(0) invert(1)' }} />
                                </div>
                                <div className="col-xs-9 text-right">
                                    <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.pendingPayments}</div>
                                    <div>Pagos Pendientes</div>
                                </div>
                            </div>
                        </div>
                        <Link to={ROUTES.PAYMENT} style={{ textDecoration: 'none' }}>
                            <div className="panel-footer" style={{ backgroundColor: '#d68910', color: 'white', textAlign: 'center' }}>
                                Ver Pagos <i className="fa fa-arrow-circle-right"></i>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Tarjeta de Contratos Activos */}
                <div className="col-md-3 col-sm-6">
                    <div className="panel panel-success" style={{ borderColor: '#27ae60' }}>
                        <div className="panel-heading" style={{ backgroundColor: '#27ae60', borderColor: '#27ae60' }}>
                            <div className="row">
                                <div className="col-xs-3">
                                    <img src={contractIcon} alt="" style={{ width: '50px', filter: 'brightness(0) invert(1)' }} />
                                </div>
                                <div className="col-xs-9 text-right">
                                    <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.activeContracts}</div>
                                    <div>Contratos Activos</div>
                                </div>
                            </div>
                        </div>
                        <Link to={ROUTES.CONTRACTS} style={{ textDecoration: 'none' }}>
                            <div className="panel-footer" style={{ backgroundColor: '#1e8449', color: 'white', textAlign: 'center' }}>
                                Ver Contratos <i className="fa fa-arrow-circle-right"></i>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Tarjeta de Contratos Pendientes */}
                <div className="col-md-3 col-sm-6">
                    <div className="panel panel-danger" style={{ borderColor: '#e74c3c' }}>
                        <div className="panel-heading" style={{ backgroundColor: '#e74c3c', borderColor: '#e74c3c' }}>
                            <div className="row">
                                <div className="col-xs-3">
                                    <img src={chartIcon} alt="" style={{ width: '50px', filter: 'brightness(0) invert(1)' }} />
                                </div>
                                <div className="col-xs-9 text-right">
                                    <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{stats.pendingContracts}</div>
                                    <div>Por Firmar</div>
                                </div>
                            </div>
                        </div>
                        <Link to={ROUTES.CONTRACTS} style={{ textDecoration: 'none' }}>
                            <div className="panel-footer" style={{ backgroundColor: '#c0392b', color: 'white', textAlign: 'center' }}>
                                Ver Pendientes <i className="fa fa-arrow-circle-right"></i>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Acciones Rapidas */}
            <div className="row" style={{ marginTop: '30px' }}>
                <div className="col-md-12">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <h4><i className="fa fa-bolt"></i> Acciones Rapidas</h4>
                        </div>
                        <div className="panel-body">
                            <div className="row">
                                <div className="col-md-3 col-sm-6 text-center" style={{ marginBottom: '15px' }}>
                                    <Link to={ROUTES.ADD_TENANT} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                                        <i className="fa fa-user-plus"></i><br />Agregar Inquilino
                                    </Link>
                                </div>
                                <div className="col-md-3 col-sm-6 text-center" style={{ marginBottom: '15px' }}>
                                    <Link to={ROUTES.PAYMENT} className="btn btn-warning btn-lg" style={{ width: '100%' }}>
                                        <i className="fa fa-money"></i><br />Verificar Pagos
                                    </Link>
                                </div>
                                <div className="col-md-3 col-sm-6 text-center" style={{ marginBottom: '15px' }}>
                                    <Link to={ROUTES.CONTRACTS} className="btn btn-success btn-lg" style={{ width: '100%' }}>
                                        <i className="fa fa-file-text"></i><br />Ver Contratos
                                    </Link>
                                </div>
                                <div className="col-md-3 col-sm-6 text-center" style={{ marginBottom: '15px' }}>
                                    <Link to={ROUTES.TENANT} className="btn btn-info btn-lg" style={{ width: '100%' }}>
                                        <i className="fa fa-users"></i><br />Gestionar Inquilinos
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    const renderTenantDashboard = () => (
        <>
            {/* Bienvenida */}
            <div className="alert alert-info" style={{ fontSize: '16px' }}>
                <h4><i className="fa fa-home"></i> Bienvenido, {authUser?.fullname}!</h4>
                <p>Desde aqui puedes gestionar tu contrato y pagos de renta.</p>
            </div>

            <div className="row">
                {/* Estado del Contrato */}
                <div className="col-md-6">
                    <div className="panel panel-default">
                        <div className="panel-heading" style={{ backgroundColor: userContract?.status === 'signed' ? '#27ae60' : '#f39c12', color: 'white' }}>
                            <h4><i className="fa fa-file-text"></i> Mi Contrato</h4>
                        </div>
                        <div className="panel-body text-center">
                            {userContract ? (
                                <>
                                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                                        {userContract.status === 'signed' ? (
                                            <i className="fa fa-check-circle" style={{ color: '#27ae60' }}></i>
                                        ) : (
                                            <i className="fa fa-clock-o" style={{ color: '#f39c12' }}></i>
                                        )}
                                    </div>
                                    <h4>{userContract.status === 'signed' ? 'Contrato Firmado' : 'Pendiente de Firma'}</h4>
                                    <p>Departamento: <strong>{userContract.data?.department}</strong></p>
                                    <p>Renta: <strong>${userContract.data?.monthlyRent} MXN/mes</strong></p>
                                    <Link
                                        to={userContract.status === 'signed' ? `/contract/${userContract.id}` : ROUTES.MY_CONTRACT}
                                        className={`btn btn-lg ${userContract.status === 'signed' ? 'btn-success' : 'btn-warning'}`}
                                    >
                                        {userContract.status === 'signed' ? 'Ver Contrato' : 'Completar y Firmar'}
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                                        <i className="fa fa-file-o" style={{ color: '#95a5a6' }}></i>
                                    </div>
                                    <h4>Sin Contrato</h4>
                                    <p>Aun no tienes un contrato registrado.</p>
                                    <Link to={ROUTES.MY_CONTRACT} className="btn btn-primary btn-lg">
                                        Crear Mi Contrato
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Estado de Pagos */}
                <div className="col-md-6">
                    <div className="panel panel-default">
                        <div className="panel-heading" style={{ backgroundColor: pendingPayments > 0 ? '#e74c3c' : '#27ae60', color: 'white' }}>
                            <h4><i className="fa fa-money"></i> Mis Pagos</h4>
                        </div>
                        <div className="panel-body text-center">
                            <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                                {pendingPayments > 0 ? (
                                    <i className="fa fa-exclamation-circle" style={{ color: '#e74c3c' }}></i>
                                ) : (
                                    <i className="fa fa-check-circle" style={{ color: '#27ae60' }}></i>
                                )}
                            </div>
                            {pendingPayments > 0 ? (
                                <>
                                    <h4 style={{ color: '#e74c3c' }}>{pendingPayments} Pago(s) Pendiente(s)</h4>
                                    <p>Tienes pagos por verificar</p>
                                </>
                            ) : (
                                <>
                                    <h4 style={{ color: '#27ae60' }}>Al Corriente</h4>
                                    <p>No tienes pagos pendientes</p>
                                </>
                            )}
                            <Link to={ROUTES.MYPAYMENTS} className="btn btn-primary btn-lg">
                                Ver Mis Pagos
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estado de Documentacion - Solo mostrar si el contrato está firmado */}
            {userContract?.status === 'signed' && (
                <div className="row" style={{ marginTop: '20px' }}>
                    <div className="col-md-12">
                        <div className="panel panel-default">
                            <div className="panel-heading" style={{
                                backgroundColor: documentation?.status === 'complete' ? '#27ae60' :
                                               documentation?.status === 'partial' ? '#f39c12' : '#e74c3c',
                                color: 'white'
                            }}>
                                <h4><i className="fa fa-folder-open"></i> Mi Documentacion</h4>
                            </div>
                            <div className="panel-body">
                                {!documentation || documentation.status === 'pending' ? (
                                    <div className="alert alert-warning">
                                        <h4><i className="fa fa-exclamation-triangle"></i> Documentacion Pendiente</h4>
                                        <p>Para completar tu expediente, necesitas subir los siguientes documentos:</p>
                                        <ul style={{ marginTop: '15px' }}>
                                            {DOCUMENT_CHECKLIST.map((doc) => (
                                                <li key={doc.type}><strong>{doc.label}</strong> - {doc.description}</li>
                                            ))}
                                            <li><strong>2 Contactos de Emergencia</strong> - Nombre, teléfono y relación</li>
                                        </ul>
                                        <Link to={`/contract/${userContract.id}`} className="btn btn-danger btn-lg" style={{ marginTop: '15px' }}>
                                            <i className="fa fa-upload"></i> Subir Documentos Ahora
                                        </Link>
                                    </div>
                                ) : documentation.status === 'partial' ? (
                                    <>
                                        <div className="alert alert-warning">
                                            <h4><i className="fa fa-clock-o"></i> Documentacion Parcial</h4>
                                            <p>Has subido algunos documentos, pero aun faltan:</p>
                                        </div>
                                        <div className="row">
                                            {DOCUMENT_CHECKLIST.map((doc) => {
                                                const uploaded = documentation.documents?.some(d => d.type === doc.type);
                                                return (
                                                    <div key={doc.type} className="col-md-6" style={{ marginBottom: '10px' }}>
                                                        <div style={{ padding: '10px', backgroundColor: uploaded ? '#dff0d8' : '#fcf8e3', borderRadius: '4px' }}>
                                                            {uploaded ? (
                                                                <><i className="fa fa-check-circle text-success"></i> <strong>{doc.label}</strong></>
                                                            ) : (
                                                                <><i className="fa fa-times-circle text-warning"></i> <strong>{doc.label}</strong> - Pendiente</>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="col-md-6" style={{ marginBottom: '10px' }}>
                                                <div style={{ padding: '10px', backgroundColor: documentation.emergencyContacts?.length >= 2 ? '#dff0d8' : '#fcf8e3', borderRadius: '4px' }}>
                                                    {documentation.emergencyContacts?.length >= 2 ? (
                                                        <><i className="fa fa-check-circle text-success"></i> <strong>Contactos de Emergencia</strong></>
                                                    ) : (
                                                        <><i className="fa fa-times-circle text-warning"></i> <strong>Contactos de Emergencia</strong> - Faltan {2 - (documentation.emergencyContacts?.length || 0)}</>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Link to={`/contract/${userContract.id}`} className="btn btn-warning btn-lg" style={{ marginTop: '15px' }}>
                                            <i className="fa fa-upload"></i> Completar Documentacion
                                        </Link>
                                    </>
                                ) : (
                                    <div className="alert alert-success">
                                        <h4><i className="fa fa-check-circle"></i> Documentacion Completa</h4>
                                        <p>Has completado tu expediente correctamente. Todos los documentos han sido recibidos.</p>
                                        <div className="row" style={{ marginTop: '15px' }}>
                                            {DOCUMENT_CHECKLIST.map((doc) => (
                                                <div key={doc.type} className="col-md-6" style={{ marginBottom: '10px' }}>
                                                    <div style={{ padding: '10px', backgroundColor: '#dff0d8', borderRadius: '4px' }}>
                                                        <i className="fa fa-check-circle text-success"></i> <strong>{doc.label}</strong>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="col-md-6" style={{ marginBottom: '10px' }}>
                                                <div style={{ padding: '10px', backgroundColor: '#dff0d8', borderRadius: '4px' }}>
                                                    <i className="fa fa-check-circle text-success"></i> <strong>Contactos de Emergencia ({documentation.emergencyContacts?.length})</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Acciones Rapidas para Inquilino */}
            <div className="row" style={{ marginTop: '20px' }}>
                <div className="col-md-12">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <h4><i className="fa fa-bolt"></i> Acciones Rapidas</h4>
                        </div>
                        <div className="panel-body">
                            <div className="row">
                                <div className="col-md-4 col-sm-6 text-center" style={{ marginBottom: '15px' }}>
                                    <Link to={ROUTES.MY_CONTRACT} className="btn btn-info btn-lg" style={{ width: '100%' }}>
                                        <i className="fa fa-file-text"></i><br />Mi Contrato
                                    </Link>
                                </div>
                                <div className="col-md-4 col-sm-6 text-center" style={{ marginBottom: '15px' }}>
                                    <Link to={ROUTES.MYPAYMENTS} className="btn btn-success btn-lg" style={{ width: '100%' }}>
                                        <i className="fa fa-credit-card"></i><br />Registrar Pago
                                    </Link>
                                </div>
                                <div className="col-md-4 col-sm-6 text-center" style={{ marginBottom: '15px' }}>
                                    <Link to={ROUTES.ACCOUNT} className="btn btn-warning btn-lg" style={{ width: '100%' }}>
                                        <i className="fa fa-user"></i><br />Mi Perfil
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

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
                                <h1>{isAdmin ? 'Panel de Administracion' : 'Mi Dashboard'}</h1>

                                <div id="dashboard-content" className="panel panel-default">
                                    <div className="panel-body" style={{ padding: '30px' }}>
                                        {loading ? (
                                            <div className="text-center">
                                                <h3>Cargando...</h3>
                                            </div>
                                        ) : (
                                            isAdmin ? renderAdminDashboard() : renderTenantDashboard()
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
        </div>
    );
};

export default withRouter(withFirebase(Dashboard));
