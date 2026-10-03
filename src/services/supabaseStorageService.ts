import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { productImageService } from '@/services/productImageService';

export const PRODUCT_STORAGE_BUCKET = 'product-images';

/**
 * Client-side image compression utility.
 * Resizes images to max 1200x1200 and converts them to optimized WebP (or JPEG fallback).
 */
export async function compressImageToBlob(
  fileOrBlob: Blob,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.85
): Promise<{ blob: Blob; mimeType: string; extension: string }> {
  // If running in SSR environment, return as is
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { blob: fileOrBlob, mimeType: fileOrBlob.type || 'image/webp', extension: 'webp' };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          maxHeight = height;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({ blob: fileOrBlob, mimeType: fileOrBlob.type || 'image/jpeg', extension: 'jpg' });
        return;
      }

      // Draw with smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Try WebP first, fallback to JPEG
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, mimeType: 'image/webp', extension: 'webp' });
          } else {
            canvas.toBlob(
              (jpgBlob) => {
                if (jpgBlob) {
                  resolve({ blob: jpgBlob, mimeType: 'image/jpeg', extension: 'jpg' });
                } else {
                  resolve({ blob: fileOrBlob, mimeType: fileOrBlob.type || 'image/jpeg', extension: 'jpg' });
                }
              },
              'image/jpeg',
              quality
            );
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ blob: fileOrBlob, mimeType: fileOrBlob.type || 'image/jpeg', extension: 'jpg' });
    };

    img.src = objectUrl;
  });
}

/**
 * Convert Base64 Data URL string to a binary Blob
 */
export function base64ToBlob(base64Data: string): { blob: Blob; mimeType: string } {
  const arr = base64Data.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1] || arr[0]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return { blob: new Blob([u8arr], { type: mimeType }), mimeType };
}

export const supabaseStorageService = {
  /**
   * Check if Supabase storage bucket is configured and accessible
   */
  async checkBucketStatus(bucketName = PRODUCT_STORAGE_BUCKET): Promise<{
    exists: boolean;
    canUpload: boolean;
    bucketName: string;
    error?: string;
  }> {
    if (!isSupabaseConfigured) {
      return { exists: false, canUpload: false, bucketName, error: 'Supabase is not configured' };
    }

    try {
      const { data, error } = await supabase.storage.getBucket(bucketName);
      if (error || !data) {
        return { exists: false, canUpload: false, bucketName, error: error?.message || 'Bucket not found' };
      }
      return { exists: true, canUpload: true, bucketName };
    } catch (e: any) {
      return { exists: false, canUpload: false, bucketName, error: e?.message || 'Bucket not found' };
    }
  },

  /**
   * Upload an image File or Blob to Supabase Storage.
   * Automatically compresses the image to high-quality WebP.
   */
  async uploadProductImage(
    fileOrBlob: File | Blob,
    fileNamePrefix: string = 'dish',
    bucketName = PRODUCT_STORAGE_BUCKET
  ): Promise<{ publicUrl: string; path: string; error?: string } | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase is not configured for storage upload');
      return null;
    }

    try {
      // 1. Compress image
      const { blob, mimeType, extension } = await compressImageToBlob(fileOrBlob);

      // 2. Generate clean unique filename
      const cleanPrefix = fileNamePrefix.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 30);
      const timestamp = Date.now().toString(36);
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const filePath = `${cleanPrefix}-${timestamp}-${randomSuffix}.${extension}`;

      // 3. Upload to bucket
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, blob, {
          contentType: mimeType,
          cacheControl: '31536000', // 1 year cache
          upsert: true,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return { publicUrl: '', path: '', error: uploadError.message };
      }

      // 4. Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl || '';
      return { publicUrl, path: filePath };
    } catch (err: any) {
      console.error('Failed to upload product image to Supabase Storage:', err);
      return { publicUrl: '', path: '', error: err?.message || 'Upload failed' };
    }
  },

  /**
   * Upload a Base64 image string to Supabase Storage
   */
  async uploadBase64Image(
    base64Data: string,
    fileNamePrefix: string = 'dish',
    bucketName = PRODUCT_STORAGE_BUCKET
  ): Promise<{ publicUrl: string; path: string; error?: string } | null> {
    try {
      const { blob } = base64ToBlob(base64Data);
      return this.uploadProductImage(blob, fileNamePrefix, bucketName);
    } catch (err: any) {
      console.error('Failed to parse base64 for storage upload:', err);
      return { publicUrl: '', path: '', error: err?.message || 'Invalid base64 string' };
    }
  },

  /**
   * Migrate all heavy Base64 product images in partner_products to Supabase Storage URLs.
   * This clears megabytes of BLOBs from the SQL database and stores fast public URLs instead.
   */
  async migrateAllBase64ImagesToStorage(
    onProgress?: (progress: { current: number; total: number; dishName: string; status: string }) => void
  ): Promise<{ total: number; migrated: number; skipped: number; errors: string[] }> {
    if (!isSupabaseConfigured) {
      return { total: 0, migrated: 0, skipped: 0, errors: ['Supabase is not configured'] };
    }

    try {
      // 1. Fetch all products
      const { data: products, error: fetchErr } = await supabase
        .from('partner_products')
        .select('id, name, image');

      if (fetchErr || !products) {
        return { total: 0, migrated: 0, skipped: 0, errors: [fetchErr?.message || 'Could not fetch products'] };
      }

      // 2. Filter products with Base64 BLOB images
      const base64Products = products.filter(p => p.image && typeof p.image === 'string' && p.image.startsWith('data:image/'));
      const total = base64Products.length;

      if (total === 0) {
        return { total: products.length, migrated: 0, skipped: products.length, errors: [] };
      }

      let migrated = 0;
      const errors: string[] = [];

      for (let i = 0; i < base64Products.length; i++) {
        const prod = base64Products[i];
        const dishName = typeof prod.name === 'object' ? (prod.name.ka || prod.name.ru || prod.name.en || prod.id) : String(prod.name || prod.id);

        if (onProgress) {
          onProgress({ current: i + 1, total, dishName, status: 'uploading' });
        }

        try {
          const uploadRes = await this.uploadBase64Image(prod.image, `dish-${prod.id}`);
          if (uploadRes && uploadRes.publicUrl) {
            // Update database row with clean public URL
            const { error: updateErr } = await supabase
              .from('partner_products')
              .update({
                image: uploadRes.publicUrl,
                updated_at: new Date().toISOString()
              })
              .eq('id', prod.id);

            if (updateErr) {
              errors.push(`Dish ${prod.id} DB update failed: ${updateErr.message}`);
            } else {
              migrated++;
              // Update local memory cache as well
              productImageService.invalidateImage(prod.id);
            }
          } else {
            errors.push(`Dish ${prod.id} upload failed: ${uploadRes?.error || 'Unknown upload error'}`);
          }
        } catch (e: any) {
          errors.push(`Dish ${prod.id} exception: ${e?.message}`);
        }
      }

      return { total, migrated, skipped: products.length - total, errors };
    } catch (err: any) {
      return { total: 0, migrated: 0, skipped: 0, errors: [err?.message || 'Migration failed'] };
    }
  }
};
