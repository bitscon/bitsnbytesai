
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminPrompts } from '@/hooks/use-admin-prompts';
import { PromptCategory } from '@/types/prompts';

interface CategoryFormProps {
  category?: PromptCategory;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCategory, updateCategory } = useAdminPrompts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let success = false;
      
      if (category) {
        // Update existing category
        success = await updateCategory(category.id, name.trim());
      } else {
        // Create new category
        const result = await createCategory(name.trim());
        success = !!result;
      }
      
      if (success) {
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category-name">Category Name</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter category name"
          required
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting 
            ? 'Saving...' 
            : category 
              ? 'Update Category' 
              : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
