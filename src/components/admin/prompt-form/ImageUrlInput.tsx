
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface ImageUrlInputProps {
  imageUrl?: string;
  onChange: (value: string) => void;
}

export function ImageUrlInput({ imageUrl = '', onChange }: ImageUrlInputProps) {
  const [showPreview, setShowPreview] = useState(false);
  
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };
  
  const isValidUrl = imageUrl && (
    imageUrl.startsWith('http://') || 
    imageUrl.startsWith('https://') || 
    imageUrl.startsWith('/') || 
    imageUrl.startsWith('./assets/')
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="image_url">Image URL (optional)</Label>
        {imageUrl && (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={togglePreview} 
            className="h-6 px-2"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-3.5 w-3.5 mr-1" />
                Hide preview
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 mr-1" />
                Show preview
              </>
            )}
          </Button>
        )}
      </div>
      <Input
        id="image_url"
        name="image_url"
        value={imageUrl}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://example.com/image.jpg"
      />
      
      {showPreview && isValidUrl && (
        <div className="mt-2 border rounded-md p-2">
          <OptimizedImage
            src={imageUrl}
            alt="Prompt image preview"
            aspectRatio="16/9"
            className="rounded-md"
            containerClassName="rounded-md border border-muted-foreground/10"
          />
        </div>
      )}
      
      {showPreview && !isValidUrl && (
        <div className="mt-2 text-sm text-destructive">
          Enter a valid URL starting with http://, https://, or / to see a preview
        </div>
      )}
    </div>
  );
}
