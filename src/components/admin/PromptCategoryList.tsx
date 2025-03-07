
import React from 'react';
import { Button } from '@/components/ui/button';
import { PromptCategory } from '@/types/prompts';
import { Edit, MoreVertical, Plus, Trash } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PromptCategoryListProps {
  categories: PromptCategory[];
  onAddCategory: () => void;
  onEditCategory: (category: PromptCategory) => void;
  onDeleteCategory: (category: PromptCategory) => void;
}

export function PromptCategoryList({ 
  categories, 
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: PromptCategoryListProps) {
  return (
    <>
      {categories.length > 0 ? (
        <div className="divide-y">
          {categories.map((category) => (
            <div key={category.id} className="py-3 flex justify-between items-center">
              <div>
                <h3 className="font-medium">{category.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(category.created_at).toLocaleDateString()}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditCategory(category)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDeleteCategory(category)}
                  >
                    <Trash className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground">No categories found</p>
          <Button onClick={onAddCategory} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </div>
      )}
    </>
  );
}
