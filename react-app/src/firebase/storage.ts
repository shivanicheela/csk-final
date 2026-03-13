import { storage } from './config.ts';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';


export const uploadVideo = async (
  file: File,
  courseId: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `courses/${courseId}/videos/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
          console.log(`✅ Video upload: ${progress.toFixed(0)}%`);
        },
        (error) => {
          console.error('❌ Video upload failed:', error.message);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ Video uploaded successfully');
            resolve(downloadURL);
          } catch (err: any) {
            console.error('❌ Error getting download URL:', err.message);
            reject(err);
          }
        }
      );
    });
  } catch (error: any) {
    console.error('❌ Error uploading video:', error.message);
    throw error;
  }
};

// ============================================
// UPLOAD PDF FILE
// ============================================
export const uploadPDF = async (
  file: File,
  courseId: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `courses/${courseId}/pdfs/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
          console.log(`✅ PDF upload: ${progress.toFixed(0)}%`);
        },
        (error) => {
          console.error('❌ PDF upload failed:', error.message);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ PDF uploaded successfully');
            resolve(downloadURL);
          } catch (err: any) {
            console.error('❌ Error getting download URL:', err.message);
            reject(err);
          }
        }
      );
    });
  } catch (error: any) {
    console.error('❌ Error uploading PDF:', error.message);
    throw error;
  }
};

// ============================================
// UPLOAD THUMBNAIL IMAGE
// ============================================
export const uploadThumbnail = async (
  file: File,
  courseId: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `courses/${courseId}/thumbnail/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => {
          console.error('❌ Thumbnail upload failed:', error.message);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (err: any) {
            reject(err);
          }
        }
      );
    });
  } catch (error: any) {
    console.error('❌ Error uploading thumbnail:', error.message);
    throw error;
  }
};

// ============================================
// DELETE FILE FROM STORAGE
// ============================================
export const deleteFile = async (fileURL: string): Promise<void> => {
  try {
    // Extract path from download URL
    const decodedURL = decodeURIComponent(fileURL);
    const pathMatch = decodedURL.match(/\/o\/(.*?)\?/);
    
    if (!pathMatch) {
      throw new Error('Invalid file URL');
    }

    const filePath = pathMatch[1].replace(/%2F/g, '/');
    const fileRef = ref(storage, filePath);

    await deleteObject(fileRef);
    console.log('✅ File deleted successfully');
  } catch (error: any) {
    console.error('❌ Error deleting file:', error.message);
    throw error;
  }
};

// ============================================
// VALIDATE FILE TYPE & SIZE
// ============================================
export const validateFile = (
  file: File,
  type: 'video' | 'pdf' | 'image'
): { valid: boolean; error: string } => {
  const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
  const MAX_PDF_SIZE = 100 * 1024 * 1024; // 100MB
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

  const validTypes = {
    video: ['video/mp4', 'video/webm', 'video/quicktime'],
    pdf: ['application/pdf'],
    image: ['image/jpeg', 'image/png', 'image/webp'],
  };

  const maxSizes = {
    video: MAX_VIDEO_SIZE,
    pdf: MAX_PDF_SIZE,
    image: MAX_IMAGE_SIZE,
  };

  // Check file type
  if (!validTypes[type].includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${validTypes[type].join(', ')}`,
    };
  }

  // Check file size
  if (file.size > maxSizes[type]) {
    const maxSizeMB = maxSizes[type] / (1024 * 1024);
    return {
      valid: false,
      error: `File too large. Max size: ${maxSizeMB}MB`,
    };
  }

  return { valid: true, error: '' };
};
