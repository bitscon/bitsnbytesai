
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { PromptForm } from '@/components/admin/PromptForm';
import { Prompt, PromptCategory } from '@/types/prompts';

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dialogType: 'category-add' | 'category-edit' | 'prompt-add' | 'prompt-edit';
  selectedCategory: PromptCategory | null;
  selectedPrompt: Prompt | null;
  categories: PromptCategory[];
  onDialogClose: () => void;
}

export function PromptDialog({
  open,
  onOpenChange,
  dialogType,
  selectedCategory,
  selectedPrompt,
  categories,
  onDialogClose,
}: PromptDialogProps) {
  const getTitle = () => {
    switch (dialogType) {
      case 'category-add': return 'Add Category';
      case 'category-edit': return 'Edit Category';
      case 'prompt-add': return 'Add Prompt';
      case 'prompt-edit': return 'Edit Prompt';
      default: return '';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        {dialogType.startsWith('category') ? (
          <CategoryForm
            category={selectedCategory || undefined}
            onSuccess={onDialogClose}
            onCancel={onDialogClose}
          />
        ) : (
          <PromptForm
            prompt={selectedPrompt || undefined}
            categories={categories}
            onSuccess={onDialogClose}
            onCancel={onDialogClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
