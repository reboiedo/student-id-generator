"use client";

import { useState } from "react";

interface OptimizedAvatarProps {
  src: string;
  alt: string;
  size?: number; // Size in pixels (will be used for both width and height)
  className?: string;
  quality?: number; // WebP quality (1-100)
}

export default function OptimizedAvatar({ 
  src, 
  alt, 
  size = 40, 
  className = "",
  quality = 80 
}: OptimizedAvatarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate optimized image URL using our proxy API with resizing
  const getOptimizedSrc = (originalSrc: string) => {
    if (!originalSrc || originalSrc.trim() === '' || originalSrc === '/test-photo.jpg') {
      return null;
    }
    
    // For retina displays, use 2x size
    const retinaSize = size * 2;
    
    return `/api/proxy-image?url=${encodeURIComponent(originalSrc)}&width=${retinaSize}&height=${retinaSize}&quality=${quality}`;
  };

  const optimizedSrc = getOptimizedSrc(src);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Placeholder/fallback avatar
  const PlaceholderAvatar = () => (
    <div 
      className={`bg-gray-200 flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg className="text-gray-400" width={size * 0.5} height={size * 0.5} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div 
      className={`bg-gray-200 animate-pulse flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );

  if (!optimizedSrc || hasError) {
    return <PlaceholderAvatar />;
  }

  return (
    <div className="relative">
      {isLoading && <LoadingSkeleton />}
      <img 
        src={optimizedSrc} 
        alt={alt}
        className={`object-cover flex-shrink-0 ${isLoading ? 'opacity-0 absolute inset-0' : 'opacity-100'} ${className}`}
        style={{ width: size, height: size }}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy" // Native lazy loading
      />
    </div>
  );
}