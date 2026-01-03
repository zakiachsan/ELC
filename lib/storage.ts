import { supabase } from './supabase';

const BUCKET_NAME = 'materials';

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param folder - Optional folder path within the bucket
 * @returns The public URL of the uploaded file
 */
export const uploadFile = async (
  file: File,
  folder?: string
): Promise<UploadResult> => {
  // Generate unique filename to avoid collisions
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${timestamp}_${sanitizedName}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    fileName: file.name,
  };
};

/**
 * Upload multiple files to Supabase Storage
 * @param files - Array of files to upload
 * @param folder - Optional folder path within the bucket
 * @returns Array of upload results
 */
export const uploadMultipleFiles = async (
  files: File[],
  folder?: string
): Promise<UploadResult[]> => {
  const results = await Promise.all(
    files.map(file => uploadFile(file, folder))
  );
  return results;
};

/**
 * Delete a file from Supabase Storage
 * @param path - The path of the file to delete
 */
export const deleteFile = async (path: string): Promise<void> => {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Check if file is an allowed type for materials
 */
export const isAllowedFileType = (file: File): boolean => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];
  return allowedTypes.includes(file.type);
};

/**
 * Format file size to human readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
