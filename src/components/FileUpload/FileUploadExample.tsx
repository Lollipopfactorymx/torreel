import React, { useState } from 'react';
import FileUpload from '../FileUpload';
import CloudinaryService from '../../services/CloudinaryService';

const FileUploadExample: React.FC = () => {
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
    const [uploadedDocUrl, setUploadedDocUrl] = useState<string>('');
    const cloudinaryService = new CloudinaryService();

    const handleImageUploadSuccess = (url: string, publicId: string) => {
        console.log('Image uploaded:', url, publicId);
        setUploadedImageUrl(url);
        alert('Imagen subida exitosamente!');
    };

    const handleDocUploadSuccess = (url: string, publicId: string) => {
        console.log('Document uploaded:', url, publicId);
        setUploadedDocUrl(url);
        alert('Documento subido exitosamente!');
    };

    const handleUploadError = (error: Error) => {
        console.error('Upload error:', error);
        alert(`Error: ${error.message}`);
    };

    return (
        <div className="container" style={{ marginTop: '100px' }}>
            <h2>Ejemplos de Subida de Archivos a Cloudinary</h2>

            <div className="row" style={{ marginTop: '30px' }}>
                <div className="col-md-6">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <h3>Subir Imagen</h3>
                        </div>
                        <div className="panel-body">
                            <FileUpload
                                onUploadSuccess={handleImageUploadSuccess}
                                onUploadError={handleUploadError}
                                folder="tenant-images"
                                acceptedFileTypes="image/*"
                                maxSizeMB={5}
                                buttonText="Subir Imagen"
                                uploadType="image"
                            />

                            {uploadedImageUrl && (
                                <div style={{ marginTop: '20px' }}>
                                    <h4>Imagen Subida:</h4>
                                    <img
                                        src={cloudinaryService.getOptimizedImageUrl(
                                            uploadedImageUrl.split('/').pop() || '',
                                            { width: 400, quality: 'auto', format: 'auto' }
                                        )}
                                        alt="Uploaded"
                                        style={{ maxWidth: '100%', border: '1px solid #ddd' }}
                                    />
                                    <p style={{ marginTop: '10px', wordBreak: 'break-all' }}>
                                        <strong>URL:</strong> {uploadedImageUrl}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="panel panel-default">
                        <div className="panel-heading">
                            <h3>Subir Documento</h3>
                        </div>
                        <div className="panel-body">
                            <FileUpload
                                onUploadSuccess={handleDocUploadSuccess}
                                onUploadError={handleUploadError}
                                folder="tenant-documents"
                                acceptedFileTypes=".pdf,.doc,.docx"
                                maxSizeMB={10}
                                buttonText="Subir Documento"
                                uploadType="document"
                            />

                            {uploadedDocUrl && (
                                <div style={{ marginTop: '20px' }}>
                                    <h4>Documento Subido:</h4>
                                    <p style={{ wordBreak: 'break-all' }}>
                                        <strong>URL:</strong> {uploadedDocUrl}
                                    </p>
                                    <a
                                        href={uploadedDocUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-info"
                                    >
                                        Ver Documento
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row" style={{ marginTop: '30px' }}>
                <div className="col-md-12">
                    <div className="panel panel-info">
                        <div className="panel-heading">
                            <h3>Instrucciones de Configuración</h3>
                        </div>
                        <div className="panel-body">
                            <h4>Pasos para configurar Cloudinary:</h4>
                            <ol>
                                <li>Ve a <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer">cloudinary.com</a></li>
                                <li>Inicia sesión en tu cuenta</li>
                                <li>Ve a Settings → Upload</li>
                                <li>Crea un nuevo "Upload Preset":
                                    <ul>
                                        <li>Nombre: <code>torre-el-uploads</code></li>
                                        <li>Signing Mode: <strong>Unsigned</strong></li>
                                        <li>Folder: Puedes dejarlo vacío o especificar una carpeta base</li>
                                    </ul>
                                </li>
                                <li>Guarda el preset</li>
                                <li>Actualiza el archivo <code>src/constants/cloudinary.ts</code> con tu Cloud Name</li>
                            </ol>

                            <h4 style={{ marginTop: '20px' }}>Información de tu cuenta:</h4>
                            <ul>
                                <li><strong>API Key:</strong> 119869186325156</li>
                                <li><strong>Cloud Name:</strong> (Necesitas obtenerlo de tu dashboard de Cloudinary)</li>
                            </ul>

                            <div className="alert alert-warning" style={{ marginTop: '20px' }}>
                                <strong>Nota de Seguridad:</strong> El API Secret NO debe usarse en el frontend.
                                Solo se usa en operaciones del servidor (como eliminar archivos).
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileUploadExample;
