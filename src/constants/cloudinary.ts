export interface CloudinaryConfig {
    cloudName: string;
    uploadPreset: string;
}

// NOTA: apiKey y apiSecret NO deben estar en el frontend
// Las operaciones firmadas deben hacerse desde Firebase Functions
const cloudinaryConfig: CloudinaryConfig = {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ""
};

export default cloudinaryConfig;
