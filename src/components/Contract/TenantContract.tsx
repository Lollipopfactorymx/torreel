import React, { useState, useEffect, useContext } from 'react';
import { withRouter } from 'react-router-dom';
import HeaderTE from '../HeaderTE';
import SideBarAdmin from '../Admin/SidebarAdmin';
import { AuthUserContext } from '../Session';
import { withFirebase } from '../Firebase';

import vectoresFondoImg from '../../assets/images/vectores-fondo.png';
import contractIcon from '../../assets/images/contract-icon.png';

interface TenantContractProps {
    firebase: any;
    history: any;
    location: any;
}

const TenantContractBase: React.FC<TenantContractProps> = ({ firebase, history, location }) => {
    const authUser = useContext(AuthUserContext) as any;
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        department: '',
        monthlyRent: '',
        startDate: '',
        duration: '12 meses',
        deposit: '',
        tenantId: '',
        guarantorName: '',
        guarantorAddress: '',
        guarantorPhone: '',
        guarantorId: ''
    });

    // Check if we're in edit mode from URL query param
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const editMode = params.get('edit') === 'true';
        setIsEditMode(editMode);
    }, [location.search]);

    useEffect(() => {
        if (!authUser) {
            console.log('No hay usuario autenticado');
            setLoading(false);
            return;
        }

        console.log('Usuario autenticado:', authUser.uid, authUser.email);

        firebase.db.collection('contracts')
            .where('tenantId', '==', authUser.uid)
            .get()
            .then((querySnapshot: any) => {
                console.log('Contratos encontrados:', querySnapshot.size);
                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    const contractData = { id: doc.id, ...doc.data() };
                    console.log('Contrato cargado:', contractData);
                    setContract(contractData);

                    // If in edit mode, populate form with existing data
                    if (isEditMode && contractData.data) {
                        const data = contractData.data;
                        setFormData({
                            department: data.department || '',
                            monthlyRent: data.monthlyRent || '',
                            startDate: data.startDate || '',
                            duration: data.duration || '12 meses',
                            deposit: data.deposit || '',
                            tenantId: data.tenantId || '',
                            guarantorName: data.guarantorName || '',
                            guarantorAddress: data.guarantorAddress || '',
                            guarantorPhone: data.guarantorPhone || '',
                            guarantorId: data.guarantorId || ''
                        });
                    }
                } else {
                    console.log('No se encontró contrato para este usuario');
                }
                setLoading(false);
            })
            .catch((err: any) => {
                console.error('Error loading contract:', err);
                setError(`Error al cargar contrato: ${err.message}`);
                setLoading(false);
            });
    }, [authUser, firebase, isEditMode]);

    useEffect(() => {
        // Only redirect if not in edit mode and contract exists
        if (!loading && contract && !isEditMode) {
            console.log('Redirigiendo a contrato:', contract.id, 'status:', contract.status);
            history.push(`/contract/${contract.id}`);
        }
    }, [loading, contract, history, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleCreateContract = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError(null);

        console.log(isEditMode ? 'Actualizando contrato' : 'Creando contrato con datos:', formData);

        try {
            const contractDataToSave = {
                tenantId: authUser.uid,
                profile: {
                    fullname: authUser.fullname,
                    email: authUser.email,
                    department: formData.department,
                    amount: formData.monthlyRent
                },
                data: {
                    landlordName: 'José Luis Palillero Huerta',
                    address: 'Calle Ciencias de la Salud número 16, Sección Tercera Guardia, Zacatelco, Tlaxcala',
                    department: formData.department,
                    monthlyRent: formData.monthlyRent,
                    startDate: formData.startDate,
                    duration: formData.duration,
                    deposit: formData.deposit || (parseFloat(formData.monthlyRent) * 2).toString(),
                    tenantId: formData.tenantId,
                    guarantorName: formData.guarantorName,
                    guarantorAddress: formData.guarantorAddress,
                    guarantorPhone: formData.guarantorPhone,
                    guarantorId: formData.guarantorId
                },
                status: 'pending',
                updatedAt: new Date().toISOString()
            };

            let contractId: string;

            if (isEditMode && contract) {
                // Update existing contract
                console.log('Actualizando contrato existente:', contract.id);
                await firebase.db.collection('contracts').doc(contract.id).update(contractDataToSave);
                contractId = contract.id;
                console.log('Contrato actualizado correctamente');
            } else {
                // Create new contract
                const newContractData = {
                    ...contractDataToSave,
                    createdAt: new Date().toISOString()
                };
                console.log('Guardando contrato en Firestore:', newContractData);
                const docRef = await firebase.db.collection('contracts').add(newContractData);
                contractId = docRef.id;
                console.log('Contrato creado con ID:', contractId);
            }

            await firebase.users().doc(authUser.uid).update({
                contractId: contractId,
                department: formData.department,
                amount: formData.monthlyRent
            });
            console.log('Usuario actualizado correctamente');

            history.push(`/contract/${contractId}`);
        } catch (err: any) {
            console.error('Error saving contract:', err);
            setError(`Error al ${isEditMode ? 'actualizar' : 'crear'} el contrato: ${err.message}`);
        } finally {
            setCreating(false);
        }
    };

    if (!authUser) {
        return (
            <div>
                <HeaderTE small="true" />
                <div className="container text-center" style={{ marginTop: '100px' }}>
                    <div className="alert alert-warning">
                        <h3>No has iniciado sesión</h3>
                        <p>Por favor inicia sesión para ver tu contrato.</p>
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
                                <h1>·Mi Contrato·</h1>

                                <div id="contrato" className="panel panel-default">
                                    <div className="panel-body">
                                        {loading ? (
                                            <div className="text-center">
                                                <h3>Verificando tu contrato...</h3>
                                                <p>Por favor espera mientras revisamos el estado de tu contrato.</p>
                                            </div>
                                        ) : (
                                            <div className="row">
                                                <div className="col-xs-12">
                                                    {error && (
                                                        <div className="alert alert-danger">
                                                            <strong>Error:</strong> {error}
                                                        </div>
                                                    )}

                                                    <div className={`alert ${isEditMode ? 'alert-warning' : 'alert-info'}`}>
                                                        <img src={contractIcon} alt="" className="small-icon" style={{ width: '30px', marginRight: '10px' }} />
                                                        <strong>{isEditMode ? 'Modo Edición' : `Bienvenido, ${authUser?.fullname}!`}</strong>
                                                        <p>{isEditMode
                                                            ? 'Puedes modificar los datos de tu contrato. Una vez guardado, revisa que todo esté correcto.'
                                                            : 'Para continuar, necesitas completar tu contrato de arrendamiento.'}</p>
                                                    </div>

                                                    <form onSubmit={handleCreateContract} className="text-left">
                                                        <h4>Datos del Arrendatario</h4>
                                                        <div className="row">
                                                            <div className="col-md-6">
                                                                <div className="form-group">
                                                                    <label>Tu número de INE *</label>
                                                                    <input
                                                                        type="text"
                                                                        name="tenantId"
                                                                        className="form-control"
                                                                        value={formData.tenantId}
                                                                        onChange={handleChange}
                                                                        placeholder="Número de folio de tu credencial INE"
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <hr />
                                                        <h4>Datos del Departamento</h4>
                                                        <div className="row">
                                                            <div className="col-md-6">
                                                                <div className="form-group">
                                                                    <label>Número de Departamento *</label>
                                                                    <input
                                                                        type="text"
                                                                        name="department"
                                                                        className="form-control"
                                                                        value={formData.department}
                                                                        onChange={handleChange}
                                                                        placeholder="Ej: 101, 202, etc."
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <div className="form-group">
                                                                    <label>Renta Mensual (MXN) *</label>
                                                                    <input
                                                                        type="number"
                                                                        name="monthlyRent"
                                                                        className="form-control"
                                                                        value={formData.monthlyRent}
                                                                        onChange={handleChange}
                                                                        placeholder="Ej: 3500"
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="row">
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label>Fecha de Inicio *</label>
                                                                    <input
                                                                        type="date"
                                                                        name="startDate"
                                                                        className="form-control"
                                                                        value={formData.startDate}
                                                                        onChange={handleChange}
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label>Duración del Contrato</label>
                                                                    <select
                                                                        name="duration"
                                                                        className="form-control"
                                                                        value={formData.duration}
                                                                        onChange={handleChange}
                                                                    >
                                                                        <option value="6 meses">6 meses</option>
                                                                        <option value="12 meses">12 meses</option>
                                                                        <option value="18 meses">18 meses</option>
                                                                        <option value="24 meses">24 meses</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label>Depósito en Garantía (MXN)</label>
                                                                    <input
                                                                        type="number"
                                                                        name="deposit"
                                                                        className="form-control"
                                                                        value={formData.deposit}
                                                                        onChange={handleChange}
                                                                        placeholder="2 meses de renta"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <hr />
                                                        <h4>Datos del Aval</h4>

                                                        <div className="row">
                                                            <div className="col-md-6">
                                                                <div className="form-group">
                                                                    <label>Nombre Completo del Aval *</label>
                                                                    <input
                                                                        type="text"
                                                                        name="guarantorName"
                                                                        className="form-control"
                                                                        value={formData.guarantorName}
                                                                        onChange={handleChange}
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <div className="form-group">
                                                                    <label>Teléfono del Aval *</label>
                                                                    <input
                                                                        type="tel"
                                                                        name="guarantorPhone"
                                                                        className="form-control"
                                                                        value={formData.guarantorPhone}
                                                                        onChange={handleChange}
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="row">
                                                            <div className="col-md-8">
                                                                <div className="form-group">
                                                                    <label>Dirección del Aval *</label>
                                                                    <input
                                                                        type="text"
                                                                        name="guarantorAddress"
                                                                        className="form-control"
                                                                        value={formData.guarantorAddress}
                                                                        onChange={handleChange}
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="form-group">
                                                                    <label>INE del Aval *</label>
                                                                    <input
                                                                        type="text"
                                                                        name="guarantorId"
                                                                        className="form-control"
                                                                        value={formData.guarantorId}
                                                                        onChange={handleChange}
                                                                        placeholder="Número de INE"
                                                                        required
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="text-center" style={{ marginTop: '30px' }}>
                                                            {isEditMode && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-default btn-lg"
                                                                    onClick={() => history.push(`/contract/${contract?.id}`)}
                                                                    style={{ marginRight: '10px' }}
                                                                >
                                                                    Cancelar
                                                                </button>
                                                            )}
                                                            <button
                                                                type="submit"
                                                                className="btn btn-success btn-lg"
                                                                disabled={creating}
                                                            >
                                                                {creating
                                                                    ? (isEditMode ? 'Guardando cambios...' : 'Creando contrato...')
                                                                    : (isEditMode ? 'Guardar Cambios' : 'Crear y Revisar Contrato')}
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
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

const TenantContract = withRouter(withFirebase(TenantContractBase));

export default TenantContract;
