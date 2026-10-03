'use client';

import React from 'react';
import Image from 'next/image';
import { useProductImage } from '@/services/productImageService';

interface LazyProductImageProps {
  productId: string;
  alt: string;
  src?: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
}

export const LazyProductImage: React.FC<LazyProductImageProps> = ({
  productId,
  alt,
  src,
  className,
  fill = true,
  width,
  height,
  sizes,
  style,
  fallbackSrc = '/images/meals/chicken-ptitim.webp',
}) => {
  const { imageSrc, isLoading } = useProductImage(productId, fallbackSrc, src);

  const isDataUrl = imageSrc.startsWith('data:') || imageSrc.startsWith('http');

  return (
    <div
      style={{
        position: fill ? 'absolute' : 'relative',
        top: fill ? 0 : undefined,
        left: fill ? 0 : undefined,
        right: fill ? 0 : undefined,
        bottom: fill ? 0 : undefined,
        width: fill ? '100%' : width,
        height: fill ? '100%' : height,
        overflow: 'hidden',
        background: '#181B22',
        ...style,
      }}
    >
      <Image
        src={imageSrc}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        sizes={sizes || '200px'}
        className={className}
        unoptimized={isDataUrl}
        style={{
          objectFit: 'cover',
          transition: 'opacity 0.25s ease-in-out',
          opacity: isLoading ? 0.7 : 1,
        }}
      />
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '4px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#10B981',
            opacity: 0.8,
            boxShadow: '0 0 6px #10B981',
          }}
          title="Загрузка фото..."
        />
      )}
    </div>
  );
};
