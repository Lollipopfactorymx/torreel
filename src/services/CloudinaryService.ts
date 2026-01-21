import cloudinaryConfig from '../constants/cloudinary';

interface UploadResponse {
    secure_url: string;
    public_id: string;
    format: string;
    resource_type: string;
    created_at: string;
    bytes: number;
    width?: number;
    height?: number;
    url: string;
}

class CloudinaryService {
    private cloudName: string;
    private uploadPreset: string;

    constructor() {
        this.cloudName = cloudinaryConfig.cloudName;
        this.uploadPreset = cloudinaryConfig.uploadPreset;
    }

    /**
     * Upload a file to Cloudinary
     * @param file - File to upload
     * @param folder - Optional folder name in Cloudinary
     * @returns Promise with upload response
     */
    async uploadFile(file: File, folder?: string): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.uploadPreset);

        if (folder) {
            formData.append('folder', folder);
        }

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw error;
        }
    }

    /**
     * Upload an image to Cloudinary
     * @param file - Image file to upload
     * @param folder - Optional folder name in Cloudinary
     * @returns Promise with upload response
     */
    async uploadImage(file: File, folder?: string): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.uploadPreset);

        if (folder) {
            formData.append('folder', folder);
        }

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('Image upload failed');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error uploading image to Cloudinary:', error);
            throw error;
        }
    }

    /**
     * Upload a PDF or document to Cloudinary
     * @param file - Document file to upload
     * @param folder - Optional folder name in Cloudinary
     * @returns Promise with upload response
     */
    async uploadDocument(file: File, folder?: string): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.uploadPreset);

        if (folder) {
            formData.append('folder', folder);
        }

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${this.cloudName}/raw/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error('Document upload failed');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error uploading document to Cloudinary:', error);
            throw error;
        }
    }

    /**
     * Delete a file from Cloudinary
     * @param publicId - Public ID of the file to delete
     * @param resourceType - Type of resource (image, video, raw)
     */
    async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
        // Note: Deleting files requires server-side implementation with API secret
        // This is just a placeholder for the client-side service
        console.warn('Delete operation should be performed server-side for security');
        throw new Error('Delete operation must be performed server-side');
    }

    /**
     * Get optimized image URL
     * @param publicId - Public ID of the image
     * @param transformations - Cloudinary transformation options
     * @returns Optimized image URL
     */
    getOptimizedImageUrl(
        publicId: string,
        transformations?: {
            width?: number;
            height?: number;
            crop?: string;
            quality?: string | number;
            format?: string;
        }
    ): string {
        let transformString = '';

        if (transformations) {
            const parts: string[] = [];

            if (transformations.width) parts.push(`w_${transformations.width}`);
            if (transformations.height) parts.push(`h_${transformations.height}`);
            if (transformations.crop) parts.push(`c_${transformations.crop}`);
            if (transformations.quality) parts.push(`q_${transformations.quality}`);
            if (transformations.format) parts.push(`f_${transformations.format}`);

            transformString = parts.join(',') + '/';
        }

        return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformString}${publicId}`;
    }

    /**
     * Get thumbnail URL for an image
     * @param publicId - Public ID of the image
     * @param size - Thumbnail size (default: 200)
     * @returns Thumbnail URL
     */
    getThumbnailUrl(publicId: string, size: number = 200): string {
        return this.getOptimizedImageUrl(publicId, {
            width: size,
            height: size,
            crop: 'fill',
            quality: 'auto',
            format: 'auto'
        });
    }
}

export default CloudinaryService;
