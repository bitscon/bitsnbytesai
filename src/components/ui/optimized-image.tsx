
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  aspectRatio?: '16/9' | '1/1' | '4/3' | '3/4' | '2/1';
  className?: string;
  overlayClassName?: string;
  containerClassName?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCBmaWxsPSIjZjFmMWYxIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+',
  aspectRatio = '16/9',
  className,
  overlayClassName,
  containerClassName,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(fallbackSrc);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reset states when src changes
    if (src) {
      setIsLoading(true);
      setError(false);
      setCurrentSrc(fallbackSrc);
      
      const img = new Image();
      img.src = src as string;
      
      img.onload = () => {
        setCurrentSrc(src as string);
        setIsLoading(false);
      };
      
      img.onerror = () => {
        setError(true);
        setIsLoading(false);
      };
    }
  }, [src, fallbackSrc]);

  const aspectRatioClasses = {
    '16/9': 'aspect-video',
    '1/1': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '3/4': 'aspect-[3/4]',
    '2/1': 'aspect-[2/1]',
  };

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-md bg-muted', 
        aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      <img
        src={currentSrc}
        alt={alt || 'Image'}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-300',
          className,
          {
            'scale-105 blur-sm': isLoading,
            'scale-100 blur-0': !isLoading
          }
        )}
        loading="lazy"
        {...props}
      />
      
      {isLoading && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm',
          overlayClassName
        )}>
          <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        </div>
      )}
      
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <p className="text-sm text-muted-foreground">Failed to load image</p>
        </div>
      )}
    </div>
  );
}
