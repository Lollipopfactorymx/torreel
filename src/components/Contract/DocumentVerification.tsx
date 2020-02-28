import React, { useState } from 'react';
import { TenantDocument, DOCUMENT_CHECKLIST, EmergencyContact } from '../../types';

interface DocumentVerificationProps {
    firebase: any;
    contractId: string;
    tenantId: string;
    documents: TenantDocument[];
    emergencyContacts: EmergencyContact[];
    onUpdate: () => void;
}

const DocumentVerification: React.FC<DocumentVerificationProps> = ({
    firebase,
    contractId,
    tenantId,
    documents,
    emergencyContacts,
    onUpdate
}) => {
    const [verifying, setVerifying] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<TenantDocument | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const getDocumentByType = (type: string): TenantDocument | undefined => {
        return documents.find(doc => doc.type === type);
    };

    const handleApprove = async (doc: TenantDocument) => {
        setVerifying(true);
        try {
            // Actualizar documento en Firebase
            const docsSnapshot = await firebase.db
                .collection('tenantDocumentation')
                .where('tenantId', '==', tenantId)
                .where('contractId', '==', contractId)
                .limit(1)
                .get();

            if (!docsSnapshot.empty) {
                const docRef = docsSnapshot.docs[0].ref;
                const currentData = docsSnapshot.docs[0].data();

                // Actualizar el documento específico
                const updatedDocuments = currentData.documents.map((d: TenantDocument) => {
                    if (d.type === doc.type) {
                        return {
                            ...d,
                            verified: true,
                            verificationStatus: 'approved',
                            verifiedAt: new Date().toISOString()
                        };
                    }
                    return d;
                });

                await docRef.update({
                    documents: updatedDocuments,
                    updatedAt: new Date().toISOString()
                });

                alert('Documento aprobado correctamente');
                onUpdate();
            }
        } catch (error) {
            console.error('Error aprobando documento:', error);
            alert('Error al aprobar el documento');
        } finally {
            setVerifying(false);
        }
    };

    const handleReject = async () => {
        if (!selectedDocument || !rejectionReason.trim()) {
            alert('Por favor, proporciona una razón para el rechazo');
            return;
        }

        setVerifying(true);
        try {
            const docsSnapshot = await firebase.db
                .collection('tenantDocumentation')
                .where('tenantId', '==', tenantId)
                .where('contractId', '==', contractId)
                .limit(1)
                .get();

            if (!docsSnapshot.empty) {
                const docRef = docsSnapshot.docs[0].ref;
                const currentData = docsSnapshot.docs[0].data();

                // Actualizar el documento específico
                const updatedDocuments = currentData.documents.map((d: TenantDocument) => {
                    if (d.type === selectedDocument.type) {
                        return {
                            ...d,
                            verified: false,
                            verificationStatus: 'rejected',
                            rejectionReason: rejectionReason,
                            verifiedAt: new Date().toISOString()
                        };
                    }
                    return d;
                });

                await docRef.update({
                    documents: updatedDocuments,
                    status: 'partial', // Volver a estado parcial si se rechaza un documento
                    updatedAt: new Date().toISOString()
                });

                alert('Documento rechazado. El inquilino podrá volver a subirlo.');
                setShowRejectModal(false);
                setSelectedDocument(null);
                setRejectionReason('');
                onUpdate();
            }
        } catch (error) {
            console.error('Error rechazando documento:', error);
            alert('Error al rechazar el documento');
        } finally {
            setVerifying(false);
        }
    };

    const openRejectModal = (doc: TenantDocument) => {
        setSelectedDocument(doc);
        setShowRejectModal(true);
        setRejectionReason('');
    };

    const getStatusBadge = (doc?: TenantDocument) => {
        if (!doc) {
            return <span className="label label-warning">No subido</span>;
        }

        switch (doc.verificationStatus) {
            case 'approved':
                return <span className="label label-success"><i className="fa fa-check-circle"></i> Aprobado</span>;
            case 'rejected':
                return <span className="label label-danger"><i className="fa fa-times-circle"></i> Rechazado</span>;
            case 'pending':
            default:
                return <span className="label label-warning"><i className="fa fa-clock-o"></i> Pendiente</span>;
        }
    };

    return (
        <div className="panel panel-info" style={{ marginTop: '30px' }}>
            <div className="panel-heading">
                <h4><i className="fa fa-check-square-o"></i> Verificación de Documentación</h4>
            </div>
            <div className="panel-body">
                <div className="alert alert-info">
                    <i className="fa fa-info-circle"></i> Como administrador, revisa y aprueba los documentos del inquilino. Si encuentras algún problema, rechaza el documento con una explicación para que el inquilino lo vuelva a subir.
                </div>

                <div className="table-responsive">
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Documento</th>
                                <th style={{ width: '15%' }}>Estado</th>
                                <th style={{ width: '25%' }}>Acciones</th>
                                <th style={{ width: '30%' }}>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {DOCUMENT_CHECKLIST.map((docType) => {
                                const doc = getDocumentByType(docType.type);
                                return (
                                    <tr key={docType.type}>
                                        <td>
                                            <strong>{docType.label}</strong>
                                            <br />
                                            <small className="text-muted">{docType.description}</small>
                                        </td>
                                        <td>
                                            {getStatusBadge(doc)}
                                            {doc && doc.uploadedAt && (
                                                <div style={{ marginTop: '5px', fontSize: '11px', color: '#777' }}>
                                                    Subido: {new Date(doc.uploadedAt).toLocaleDateString('es-MX')}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {doc ? (
                                                <>
                                                    <a
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-xs btn-info"
                                                        style={{ marginRight: '5px', marginBottom: '5px' }}
                                                    >
                                                        <i className="fa fa-eye"></i> Ver
                                                    </a>
                                                    {doc.verificationStatus !== 'approved' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(doc)}
                                                                disabled={verifying}
                                                                className="btn btn-xs btn-success"
                                                                style={{ marginRight: '5px', marginBottom: '5px' }}
                                                            >
                                                                <i className="fa fa-check"></i> Aprobar
                                                            </button>
                                                            <button
                                                                onClick={() => openRejectModal(doc)}
                                                                disabled={verifying}
                                                                className="btn btn-xs btn-danger"
                                                                style={{ marginBottom: '5px' }}
                                                            >
                                                                <i className="fa fa-times"></i> Rechazar
                                                            </button>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-muted">Pendiente de subir</span>
                                            )}
                                        </td>
                                        <td>
                                            {doc?.verificationStatus === 'rejected' && doc.rejectionReason && (
                                                <div className="alert alert-danger" style={{ marginBottom: 0, padding: '5px' }}>
                                                    <small><strong>Motivo de rechazo:</strong> {doc.rejectionReason}</small>
                                                </div>
                                            )}
                                            {doc?.verificationStatus === 'approved' && doc.verifiedAt && (
                                                <small className="text-success">
                                                    <i className="fa fa-check"></i> Aprobado el {new Date(doc.verifiedAt).toLocaleDateString('es-MX')}
                                                </small>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Contactos de Emergencia */}
                <div style={{ marginTop: '30px' }}>
                    <h5><i className="fa fa-phone"></i> Contactos de Emergencia</h5>
                    {emergencyContacts && emergencyContacts.length > 0 ? (
                        <table className="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Teléfono</th>
                                    <th>Relación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {emergencyContacts.map((contact, index) => (
                                    <tr key={index}>
                                        <td>{contact.name}</td>
                                        <td>{contact.phone}</td>
                                        <td>{contact.relationship}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="alert alert-warning">
                            <i className="fa fa-exclamation-triangle"></i> No hay contactos de emergencia registrados.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Rechazo */}
            {showRejectModal && (
                <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" onClick={() => setShowRejectModal(false)}>
                                    <span>&times;</span>
                                </button>
                                <h4 className="modal-title">Rechazar Documento</h4>
                            </div>
                            <div className="modal-body">
                                <p><strong>Documento:</strong> {DOCUMENT_CHECKLIST.find(d => d.type === selectedDocument?.type)?.label}</p>

                                <div className="form-group">
                                    <label>Motivo del rechazo <span className="text-danger">*</span></label>
                                    <textarea
                                        className="form-control"
                                        rows={4}
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Explica por qué se rechaza este documento para que el inquilino pueda corregirlo..."
                                    />
                                </div>

                                <div className="alert alert-info">
                                    <i className="fa fa-info-circle"></i> El inquilino verá este mensaje y podrá volver a subir el documento.
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" onClick={() => setShowRejectModal(false)}>
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={handleReject}
                                    disabled={verifying || !rejectionReason.trim()}
                                >
                                    {verifying ? (
                                        <><i className="fa fa-spinner fa-spin"></i> Rechazando...</>
                                    ) : (
                                        <><i className="fa fa-times"></i> Rechazar Documento</>
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

export default DocumentVerification;
