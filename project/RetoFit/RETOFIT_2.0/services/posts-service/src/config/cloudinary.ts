import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube una imagen a Cloudinary
 * @param filePath - Ruta local del archivo temporal
 * @param folder - Carpeta en Cloudinary (ej: 'retofit/posts')
 * @returns URL pública de la imagen en Cloudinary
 */
export async function uploadToCloudinary(
  filePath: string,
  folder: string = 'retofit/posts'
): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' }, // Max 1200x1200
        { quality: 'auto' }, // Optimización automática
        { fetch_format: 'auto' } // Formato óptimo (webp si el navegador lo soporta)
      ]
    });

    // Eliminar archivo temporal local
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result.secure_url; // URL pública HTTPS
  } catch (error) {
    // Limpiar archivo temporal en caso de error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
}

/**
 * Elimina una imagen de Cloudinary
 * @param imageUrl - URL de la imagen en Cloudinary
 */
export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
  try {
    // Extraer public_id de la URL
    // ej: https://res.cloudinary.com/demo/image/upload/v1234567/retofit/posts/abc123.jpg
    // public_id = retofit/posts/abc123
    const matches = imageUrl.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)$/);
    if (matches && matches[1]) {
      const publicId = matches[1];
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    // No lanzar error para no bloquear eliminación del post
  }
}

export default cloudinary;
