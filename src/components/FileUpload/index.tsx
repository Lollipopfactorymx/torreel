import React, { useState, useRef } from 'react';
import CloudinaryService from '../../services/CloudinaryService';

interface FileUploadProps {
    onUploadSuccess?: (url: string, publicId: string) => void;
    onUploadError?: (error: Error) => void;
    folder?: string;
    acceptedFileTypes?: string;
    maxSizeMB?: number;
    buttonText?: string;
    buttonClassName?: string;
    uploadType?: 'image' | 'document' | 'auto';
}

const FileUpload: React.FC<FileUploadProps> = ({
    onUploadSuccess,
    onUploadError,
    folder,
    acceptedFileTypes = 'image/*,application/pdf,.doc,.docx',
    maxSizeMB = 10,
    buttonText = 'Subir Archivo',
    buttonClassName = 'btn btn-primary',
    uploadType = 'auto'
}) => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cloudinaryService = new CloudinaryService();

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            const error = new Error(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`);
            if (onUploadError) {
                onUploadError(error);
            } else {
                alert(error.message);
            }
            return;
        }

        setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert('Por favor selecciona un archivo primero');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            let response;

            // Simulate progress (Cloudinary doesn't provide real-time progress in browser)
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            // Upload based on type
            if (uploadType === 'image') {
                response = await cloudinaryService.uploadImage(selectedFile, folder);
            } else if (uploadType === 'document') {
                response = await cloudinaryService.uploadDocument(selectedFile, folder);
            } else {
                // Auto-detect based on file type
                if (selectedFile.type.startsWith('image/')) {
                    response = await cloudinaryService.uploadImage(selectedFile, folder);
                } else {
                    response = await cloudinaryService.uploadDocument(selectedFile, folder);
                }
            }

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (onUploadSuccess) {
                onUploadSuccess(response.secure_url, response.public_id);
            }

            // Reset after successful upload
            setTimeout(() => {
                setSelectedFile(null);
                setUploadProgress(0);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }, 1000);

        } catch (error) {
            console.error('Upload error:', error);
            if (onUploadError) {
                onUploadError(error as Error);
            } else {
                alert('Error al subir el archivo. Por favor intenta de nuevo.');
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="file-upload-component">
            <div className="form-group">
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept={acceptedFileTypes}
                    className="form-control"
                    disabled={uploading}
                />
            </div>

            {selectedFile && (
                <div className="selected-file-info" style={{ marginTop: '10px', marginBottom: '10px' }}>
                    <strong>Archivo seleccionado:</strong> {selectedFile.name}
                    ({(selectedFile.size / 1024).toFixed(2)} KB)
                </div>
            )}

            {uploading && (
                <div className="progress" style={{ marginTop: '10px', marginBottom: '10px' }}>
                    <div
                        className="progress-bar progress-bar-striped active"
                        role="progressbar"
                        style={{ width: `${uploadProgress}%` }}
                    >
                        {uploadProgress}%
                    </div>
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className={buttonClassName}
            >
                {uploading ? 'Subiendo...' : buttonText}
            </button>
        </div>
    );
};

export default FileUpload;
