
import React from 'react';
import { Button } from '@/components/ui/button';

interface FormActionsProps {
  isSubmitting: boolean;
  isValid: boolean;
  isEditMode: boolean;
  onCancel: () => void;
}

export function FormActions({ isSubmitting, isValid, isEditMode, onCancel }: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting || !isValid}
      >
        {isSubmitting 
          ? 'Saving...' 
          : isEditMode 
            ? 'Update Prompt' 
            : 'Create Prompt'}
      </Button>
    </div>
  );
}
