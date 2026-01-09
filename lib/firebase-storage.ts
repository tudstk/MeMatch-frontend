import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Compress image before uploading
 */
export async function compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

/**
 * Upload image to Firebase Storage
 */
export async function uploadImage(
  file: File,
  path: string,
  compress: boolean = true
): Promise<string> {
  try {
    let fileToUpload = file;

    // Compress image if needed
    if (compress && file.type.startsWith('image/')) {
      fileToUpload = await compressImage(file);
    }

    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, fileToUpload);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(userId: number, file: File): Promise<string> {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  const path = `profiles/${userId}/${timestamp}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
  return uploadImage(file, path);
}

/**
 * Upload meme image
 */
export async function uploadMemeImage(userId: number, file: File): Promise<string> {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  const path = `memes/${userId}/${timestamp}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
  return uploadImage(file, path);
}

/**
 * Delete image from Firebase Storage
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract path from URL
    const url = new URL(imageUrl);
    const path = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');
    
    if (!path) {
      throw new Error('Invalid image URL');
    }

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete image');
  }
}
