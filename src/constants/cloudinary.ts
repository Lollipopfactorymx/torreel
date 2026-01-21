export interface CloudinaryConfig {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    uploadPreset: string;
}

const cloudinaryConfig: CloudinaryConfig = {
    cloudName: "torre-el", // Necesitarás tu cloud name de Cloudinary
    apiKey: "119869186325156",
    apiSecret: "Npha0O1Ek88y9VwcgmxEHcUao4w",
    uploadPreset: "torre-el-uploads" // Crearás este preset en Cloudinary
};

export default cloudinaryConfig;
