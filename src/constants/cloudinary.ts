export interface CloudinaryConfig {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    uploadPreset: string;
}

const cloudinaryConfig: CloudinaryConfig = {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "torre-el",
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || "119869186325156",
    apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET || "Npha0O1Ek88y9VwcgmxEHcUao4w",
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "torre-el-uploads"
};

export default cloudinaryConfig;
