import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';

// Global in-memory cache for base64 / URL images across page transitions
const imageMemoryCache = new Map<string, string>();
const pendingPromises = new Map<string, Promise<string | null>>();

export const productImageService = {
  // Check if image is already cached
  getCachedImage(productId: string): string | null {
    return imageMemoryCache.get(productId) || null;
  },

  // Set image directly in cache
  setCachedImage(productId: string, imageUrl: string) {
    if (productId && imageUrl) {
      imageMemoryCache.set(productId, imageUrl);
    }
  },

  // Fetch image separately for a specific product
  async fetchProductImage(productId: string): Promise<string | null> {
    if (!productId) return null;

    // 1. Check in-memory cache
    if (imageMemoryCache.has(productId)) {
      return imageMemoryCache.get(productId)!;
    }

    // 2. Prevent duplicate in-flight requests for the same product
    if (pendingPromises.has(productId)) {
      return pendingPromises.get(productId)!;
    }

    if (!isSupabaseConfigured) return null;

    const requestPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('partner_products')
          .select('id, image')
          .eq('id', productId)
          .single();

        if (error || !data || !data.image) {
          return null;
        }

        const img = String(data.image);
        imageMemoryCache.set(productId, img);
        return img;
      } catch (err) {
        console.warn(`Failed to lazy load image for ${productId}:`, err);
        return null;
      } finally {
        pendingPromises.delete(productId);
      }
    })();

    pendingPromises.set(productId, requestPromise);
    return requestPromise;
  },

  // Pre-load images in background without blocking main thread
  preloadImages(productIds: string[]) {
    productIds.forEach(id => {
      if (!imageMemoryCache.has(id)) {
        this.fetchProductImage(id);
      }
    });
  },

  // Clear cache if needed (e.g. on dish update)
  invalidateImage(productId: string) {
    imageMemoryCache.delete(productId);
    pendingPromises.delete(productId);
  },
};

// React Hook for lazy loading single product image
export function useProductImage(
  productId: string,
  defaultPlaceholder: string = '/images/meals/chicken-ptitim.webp',
  initialSrc?: string
) {
  const [imageSrc, setImageSrc] = useState<string>(() => {
    if (initialSrc && (initialSrc.startsWith('http') || initialSrc.startsWith('/images/'))) {
      return initialSrc;
    }
    return productImageService.getCachedImage(productId) || initialSrc || defaultPlaceholder;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (initialSrc && (initialSrc.startsWith('http') || initialSrc.startsWith('/images/'))) {
      return false;
    }
    return !productImageService.getCachedImage(productId) && !initialSrc;
  });

  useEffect(() => {
    if (initialSrc && (initialSrc.startsWith('http') || initialSrc.startsWith('/images/'))) {
      setImageSrc(initialSrc);
      productImageService.setCachedImage(productId, initialSrc);
      setIsLoading(false);
      return;
    }

    if (!productId) {
      setImageSrc(initialSrc || defaultPlaceholder);
      setIsLoading(false);
      return;
    }

    const cached = productImageService.getCachedImage(productId);
    if (cached) {
      setImageSrc(cached);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    productImageService.fetchProductImage(productId).then(img => {
      if (isMounted) {
        if (img) {
          setImageSrc(img);
        } else {
          setImageSrc(initialSrc || defaultPlaceholder);
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [productId, defaultPlaceholder, initialSrc]);

  return { imageSrc, isLoading };
}
