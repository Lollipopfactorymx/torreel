import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeaderTE from '../HeaderTE';
import SideBarAdmin from '../Admin/SidebarAdmin';
import { AuthUserContext, withAuthorization } from '../Session';
import { withFirebase } from '../Firebase';
import * as ROUTES from '../../constants/routes';
import * as ROLES from '../../constants/roles';

interface ContractDashboardProps {
    firebase: any;
    history: any;
}

const ContractDashboard: React.FC<ContractDashboardProps> = ({ firebase }) => {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        firebase.db.collection('contracts')
            .orderBy('createdAt', 'desc')
            .get()
            .then((querySnapshot: any) => {
                const contractsList: any[] = [];
                querySnapshot.forEach((doc: any) => {
                    contractsList.push({ id: doc.id, ...doc.data() });
                });
                setContracts(contractsList);
                setLoading(false);
            })
            .catch((error: any) => {
                console.error('Error loading contracts:', error);
                setLoading(false);
            });
    }, [firebase]);

    const pendingContracts = contracts.filter(c => c.status === 'pending');
    const signedContracts = contracts.filter(c => c.status === 'signed');

    return (
        <AuthUserContext.Consumer>
            {(authUser: any) => (
                <div>
                    <HeaderTE small="true" />
                    <div className="fondo-rayas container-fluid">
                        <div className="row">
                            <SideBarAdmin email={authUser?.email} />

                            <div className="col-xs-10 col-sm-9 col-md-10">
                                <div className="bubble-wrapper row text-center">
                                    <div className="col-xs-1">
                                        <div className="bubble-triangle"></div>
                                    </div>
                                    <div className="bubble col-xs-11 col-xs-offset-1 col-md-10 col-md-offset-0 col-lg-9">
                                        <h1>·Contratos de Arrendamiento·</h1>

                                        <div className="panel panel-default">
                                            <div className="panel-body">
                                                <div className="row">
                                                    <div className="col-xs-12">
                                                        <h3>Contratos Pendientes de Firma ({pendingContracts.length})</h3>

                                                        {loading && <div>Cargando contratos...</div>}

                                                        {!loading && pendingContracts.length === 0 && (
                                                            <div className="alert alert-info">
                                                                No hay contratos pendientes de firma
                                                            </div>
                                                        )}

                                                        {!loading && pendingContracts.length > 0 && (
                                                            <table className="table table-bordered">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Inquilino</th>
                                                                        <th>Departamento</th>
                                                                        <th>Renta Mensual</th>
                                                                        <th>Fecha de Creación</th>
                                                                        <th>Acciones</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {pendingContracts.map((contract) => (
                                                                        <tr key={contract.id}>
                                                                            <td>{contract.profile?.fullname || 'N/A'}</td>
                                                                            <td>{contract.data?.department || contract.profile?.department || 'N/A'}</td>
                                                                            <td>${contract.data?.monthlyRent || contract.profile?.amount || 'N/A'}</td>
                                                                            <td>{contract.createdAt ? new Date(contract.createdAt).toLocaleDateString('es-MX') : 'N/A'}</td>
                                                                            <td>
                                                                                <Link
                                                                                    to={`/contract/${contract.id}`}
                                                                                    className="btn btn-primary btn-sm"
                                                                                >
                                                                                    Ver y Firmar
                                                                                </Link>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="row" style={{ marginTop: '40px' }}>
                                                    <div className="col-xs-12">
                                                        <h3>Contratos Firmados ({signedContracts.length})</h3>

                                                        {!loading && signedContracts.length === 0 && (
                                                            <div className="alert alert-info">
                                                                No hay contratos firmados aún
                                                            </div>
                                                        )}

                                                        {!loading && signedContracts.length > 0 && (
                                                            <table className="table table-bordered">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Inquilino</th>
                                                                        <th>Departamento</th>
                                                                        <th>Renta Mensual</th>
                                                                        <th>Fecha de Firma</th>
                                                                        <th>Acciones</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {signedContracts.map((contract) => (
                                                                        <tr key={contract.id}>
                                                                            <td>{contract.profile?.fullname || 'N/A'}</td>
                                                                            <td>{contract.data?.department || contract.profile?.department || 'N/A'}</td>
                                                                            <td>${contract.data?.monthlyRent || contract.profile?.amount || 'N/A'}</td>
                                                                            <td>{contract.signedAt ? new Date(contract.signedAt).toLocaleDateString('es-MX') : 'N/A'}</td>
                                                                            <td>
                                                                                <Link
                                                                                    to={`/contract/${contract.id}`}
                                                                                    className="btn btn-info btn-sm"
                                                                                >
                                                                                    Ver Contrato
                                                                                </Link>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthUserContext.Consumer>
    );
};

const condition = (authUser: any) => !!authUser && !!authUser.roles[ROLES.ADMIN];

export default withAuthorization(condition)(withFirebase(ContractDashboard));
