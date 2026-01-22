import React, { useState, useEffect } from 'react';
import CloudinaryService from '../../services/CloudinaryService';
import {
    TenantDocument,
    DocumentType,
    EmergencyContact,
    TenantDocumentation,
    DOCUMENT_CHECKLIST
} from '../../types';

interface DocumentChecklistProps {
    firebase: any;
    contractId: string;
    tenantId: string;
    tenantName: string;
    onComplete?: () => void;
}

const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
    firebase,
    contractId,
    tenantId,
    tenantName,
    onComplete
}) => {
    const [documentation, setDocumentation] = useState<TenantDocumentation | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<DocumentType | null>(null);
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
        { name: '', phone: '', relationship: '' },
        { name: '', phone: '', relationship: '' }
    ]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cloudinaryService = new CloudinaryService();

    // Cargar documentación existente
    useEffect(() => {
        loadDocumentation();
    }, [contractId]);

    const loadDocumentation = async () => {
        try {
            const docRef = firebase.db.collection('tenantDocumentation').doc(contractId);
            const doc = await docRef.get();

            if (doc.exists) {
                const data = doc.data() as TenantDocumentation;
                setDocumentation(data);
                if (data.emergencyContacts && data.emergencyContacts.length > 0) {
                    setEmergencyContacts(data.emergencyContacts);
                }
            } else {
                // Crear documento inicial
                const initialDoc: TenantDocumentation = {
                    tenantId,
                    contractId,
                    documents: [],
                    emergencyContacts: [],
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                await docRef.set(initialDoc);
                setDocumentation(initialDoc);
            }
        } catch (err) {
            console.error('Error loading documentation:', err);
            setError('Error al cargar la documentación');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: DocumentType) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            setError('Solo se permiten imágenes (JPG, PNG) o PDF');
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('El archivo no debe superar los 5MB');
            return;
        }

        setUploading(docType);
        setError(null);

        try {
            // Crear carpeta organizada: tenants/{tenantId}/documents/{docType}
            const folder = `tenants/${tenantId}/documents`;

            const response = await cloudinaryService.uploadFile(file, folder);

            const newDoc: TenantDocument = {
                type: docType,
                url: response.secure_url,
                publicId: response.public_id,
                uploadedAt: new Date().toISOString(),
                verified: false,
                verificationStatus: 'pending'
            };

            // Actualizar documentación
            const updatedDocs = documentation?.documents.filter(d => d.type !== docType) || [];
            updatedDocs.push(newDoc);

            const newStatus = calculateStatus(updatedDocs, emergencyContacts);

            await firebase.db.collection('tenantDocumentation').doc(contractId).update({
                documents: updatedDocs,
                status: newStatus,
                updatedAt: new Date().toISOString()
            });

            setDocumentation(prev => prev ? {
                ...prev,
                documents: updatedDocs,
                status: newStatus,
                updatedAt: new Date().toISOString()
            } : null);

            // Verificar si está completo
            if (newStatus === 'complete' && onComplete) {
                onComplete();
            }

        } catch (err) {
            console.error('Error uploading file:', err);
            setError('Error al subir el archivo. Intenta de nuevo.');
        } finally {
            setUploading(null);
        }
    };

    const calculateStatus = (docs: TenantDocument[], contacts: EmergencyContact[]): 'pending' | 'partial' | 'complete' => {
        const requiredDocs = DOCUMENT_CHECKLIST.filter(d => d.required);
        const uploadedTypes = docs.map(d => d.type);
        const allDocsUploaded = requiredDocs.every(req => uploadedTypes.includes(req.type));

        const validContacts = contacts.filter(c => c.name && c.phone);
        const hasContacts = validContacts.length >= 2;

        if (allDocsUploaded && hasContacts) return 'complete';
        if (docs.length > 0 || validContacts.length > 0) return 'partial';
        return 'pending';
    };

    const handleContactChange = (index: number, field: keyof EmergencyContact, value: string) => {
        const updated = [...emergencyContacts];
        updated[index] = { ...updated[index], [field]: value };
        setEmergencyContacts(updated);
    };

    const saveEmergencyContacts = async () => {
        // Validar que ambos contactos tengan nombre y teléfono
        const validContacts = emergencyContacts.filter(c => c.name && c.phone);
        if (validContacts.length < 2) {
            setError('Debes proporcionar al menos 2 contactos de emergencia con nombre y teléfono');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const newStatus = calculateStatus(documentation?.documents || [], emergencyContacts);

            await firebase.db.collection('tenantDocumentation').doc(contractId).update({
                emergencyContacts,
                status: newStatus,
                updatedAt: new Date().toISOString()
            });

            setDocumentation(prev => prev ? {
                ...prev,
                emergencyContacts,
                status: newStatus,
                updatedAt: new Date().toISOString()
            } : null);

            if (newStatus === 'complete' && onComplete) {
                onComplete();
            }

            alert('Contactos de emergencia guardados correctamente');
        } catch (err) {
            console.error('Error saving contacts:', err);
            setError('Error al guardar los contactos');
        } finally {
            setSaving(false);
        }
    };

    const finalizeDocumentation = async () => {
        if (documentation?.status !== 'complete') {
            setError('Debes completar todos los documentos y contactos antes de finalizar');
            return;
        }

        setSaving(true);
        try {
            await firebase.db.collection('tenantDocumentation').doc(contractId).update({
                completedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // Actualizar contrato con referencia a documentación
            await firebase.db.collection('contracts').doc(contractId).update({
                documentationComplete: true,
                documentationCompletedAt: new Date().toISOString()
            });

            setDocumentation(prev => prev ? {
                ...prev,
                completedAt: new Date().toISOString()
            } : null);

            alert('¡Documentación finalizada correctamente!');

            if (onComplete) {
                onComplete();
            }
        } catch (err) {
            console.error('Error finalizing documentation:', err);
            setError('Error al finalizar la documentación');
        } finally {
            setSaving(false);
        }
    };

    const getDocumentByType = (type: DocumentType): TenantDocument | undefined => {
        return documentation?.documents.find(d => d.type === type);
    };

    const getStatusBadge = () => {
        switch (documentation?.status) {
            case 'complete':
                return <span className="label label-success">Completo</span>;
            case 'partial':
                return <span className="label label-warning">Parcial</span>;
            default:
                return <span className="label label-default">Pendiente</span>;
        }
    };

    if (loading) {
        return (
            <div className="text-center" style={{ padding: '40px' }}>
                <i className="fa fa-spinner fa-spin fa-3x"></i>
                <p>Cargando documentación...</p>
            </div>
        );
    }

    return (
        <div className="document-checklist" style={{ marginTop: '30px' }}>
            <div className="panel panel-info">
                <div className="panel-heading">
                    <h3 className="panel-title">
                        <i className="fa fa-folder-open"></i> Documentación del Inquilino
                        <span style={{ float: 'right' }}>{getStatusBadge()}</span>
                    </h3>
                </div>
                <div className="panel-body">
                    {error && (
                        <div className="alert alert-danger">
                            <i className="fa fa-exclamation-circle"></i> {error}
                            <button type="button" className="close" onClick={() => setError(null)}>
                                <span>&times;</span>
                            </button>
                        </div>
                    )}

                    <p className="text-muted">
                        <i className="fa fa-info-circle"></i> Por favor sube los siguientes documentos para completar tu expediente.
                        Los archivos se guardarán de forma segura.
                    </p>

                    {/* Lista de documentos */}
                    <div className="document-list" style={{ marginTop: '20px' }}>
                        {DOCUMENT_CHECKLIST.map((item, index) => {
                            const uploadedDoc = getDocumentByType(item.type);
                            const isUploading = uploading === item.type;

                            return (
                                <div
                                    key={item.type}
                                    className="document-item"
                                    style={{
                                        padding: '15px',
                                        marginBottom: '10px',
                                        backgroundColor: uploadedDoc?.verificationStatus === 'approved' ? '#e8f5e9' :
                                                        uploadedDoc?.verificationStatus === 'rejected' ? '#ffebee' :
                                                        uploadedDoc ? '#fff8e1' : '#f5f5f5',
                                        borderRadius: '8px',
                                        border: `1px solid ${uploadedDoc?.verificationStatus === 'approved' ? '#4caf50' :
                                                              uploadedDoc?.verificationStatus === 'rejected' ? '#f44336' :
                                                              uploadedDoc ? '#ffc107' : '#ddd'}`
                                    }}
                                >
                                    <div className="row">
                                        <div className="col-md-6">
                                            <h5 style={{ margin: '0 0 5px 0' }}>
                                                {uploadedDoc?.verificationStatus === 'approved' ? (
                                                    <i className="fa fa-check-circle text-success"></i>
                                                ) : uploadedDoc?.verificationStatus === 'rejected' ? (
                                                    <i className="fa fa-times-circle text-danger"></i>
                                                ) : uploadedDoc ? (
                                                    <i className="fa fa-clock-o text-warning"></i>
                                                ) : (
                                                    <i className="fa fa-circle-o text-muted"></i>
                                                )}
                                                {' '}{index + 1}. {item.label}
                                                {item.required && <span className="text-danger">*</span>}
                                            </h5>
                                            <p className="text-muted" style={{ marginBottom: '10px', fontSize: '12px' }}>
                                                {item.description}
                                            </p>
                                            {/* Estado de verificación */}
                                            {uploadedDoc && (
                                                <div style={{ marginTop: '5px' }}>
                                                    {uploadedDoc.verificationStatus === 'approved' && (
                                                        <span className="label label-success">
                                                            <i className="fa fa-check"></i> Aprobado
                                                        </span>
                                                    )}
                                                    {uploadedDoc.verificationStatus === 'pending' && (
                                                        <span className="label label-warning">
                                                            <i className="fa fa-clock-o"></i> En revisión
                                                        </span>
                                                    )}
                                                    {uploadedDoc.verificationStatus === 'rejected' && (
                                                        <span className="label label-danger">
                                                            <i className="fa fa-times"></i> Rechazado
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-md-6 text-right">
                                            {uploadedDoc ? (
                                                <div>
                                                    <a
                                                        href={uploadedDoc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-sm btn-info"
                                                    >
                                                        <i className="fa fa-eye"></i> Ver documento
                                                    </a>
                                                    {uploadedDoc.verificationStatus !== 'approved' && (
                                                        <label className="btn btn-sm btn-warning" style={{ marginLeft: '5px' }}>
                                                            <i className="fa fa-refresh"></i> Reemplazar
                                                            <input
                                                                type="file"
                                                                accept="image/*,.pdf"
                                                                onChange={(e) => handleFileUpload(e, item.type)}
                                                                style={{ display: 'none' }}
                                                            />
                                                        </label>
                                                    )}
                                                    <p className="text-muted" style={{ fontSize: '10px', marginTop: '5px' }}>
                                                        Subido: {new Date(uploadedDoc.uploadedAt).toLocaleDateString('es-MX')}
                                                    </p>
                                                </div>
                                            ) : (
                                                <label className={`btn btn-primary ${isUploading ? 'disabled' : ''}`}>
                                                    {isUploading ? (
                                                        <><i className="fa fa-spinner fa-spin"></i> Subiendo...</>
                                                    ) : (
                                                        <><i className="fa fa-upload"></i> Subir archivo</>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        onChange={(e) => handleFileUpload(e, item.type)}
                                                        style={{ display: 'none' }}
                                                        disabled={isUploading}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* Alerta de rechazo */}
                                    {uploadedDoc?.verificationStatus === 'rejected' && uploadedDoc.rejectionReason && (
                                        <div className="alert alert-danger" style={{ marginTop: '10px', marginBottom: 0 }}>
                                            <strong><i className="fa fa-exclamation-triangle"></i> Motivo del rechazo:</strong>
                                            <p style={{ marginBottom: 0, marginTop: '5px' }}>{uploadedDoc.rejectionReason}</p>
                                            <p style={{ marginBottom: 0, marginTop: '10px', fontSize: '12px' }}>
                                                <i className="fa fa-info-circle"></i> Por favor, sube un nuevo documento que cumpla con los requisitos.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Contactos de emergencia */}
                    <div className="emergency-contacts" style={{ marginTop: '30px' }}>
                        <h4>
                            <i className="fa fa-phone"></i> Contactos de Emergencia
                            <span className="text-danger">*</span>
                        </h4>
                        <p className="text-muted">
                            Proporciona al menos 2 contactos de emergencia que podamos localizar en caso necesario.
                        </p>

                        {emergencyContacts.map((contact, index) => (
                            <div
                                key={index}
                                className="contact-form"
                                style={{
                                    padding: '15px',
                                    marginBottom: '15px',
                                    backgroundColor: '#f9f9f9',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd'
                                }}
                            >
                                <h5>Contacto {index + 1}</h5>
                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label>Nombre completo</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={contact.name}
                                                onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                                                placeholder="Nombre del contacto"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label>Teléfono</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                value={contact.phone}
                                                onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                                placeholder="10 dígitos"
                                                maxLength={10}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label>Parentesco/Relación</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={contact.relationship}
                                                onChange={(e) => handleContactChange(index, 'relationship', e.target.value)}
                                                placeholder="Ej: Padre, Hermano, Amigo"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={saveEmergencyContacts}
                            className="btn btn-info"
                            disabled={saving}
                        >
                            {saving ? (
                                <><i className="fa fa-spinner fa-spin"></i> Guardando...</>
                            ) : (
                                <><i className="fa fa-save"></i> Guardar Contactos</>
                            )}
                        </button>
                    </div>

                    {/* Botón de finalizar */}
                    {documentation?.status === 'complete' && !documentation.completedAt && (
                        <div className="text-center" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
                            <h4><i className="fa fa-check-circle text-success"></i> ¡Documentación Completa!</h4>
                            <p>Has subido todos los documentos requeridos y proporcionado los contactos de emergencia.</p>
                            <button
                                onClick={finalizeDocumentation}
                                className="btn btn-success btn-lg"
                                disabled={saving}
                            >
                                {saving ? (
                                    <><i className="fa fa-spinner fa-spin"></i> Finalizando...</>
                                ) : (
                                    <><i className="fa fa-check"></i> Finalizar Documentación</>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Mensaje de documentación ya finalizada */}
                    {documentation?.completedAt && (
                        <div className="alert alert-success text-center" style={{ marginTop: '20px' }}>
                            <h4><i className="fa fa-check-circle"></i> Documentación Finalizada</h4>
                            <p>
                                Tu expediente fue completado el{' '}
                                {new Date(documentation.completedAt).toLocaleDateString('es-MX', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentChecklist;
