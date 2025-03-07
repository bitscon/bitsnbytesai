
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PromptCategory } from '@/types/prompts';

interface CategorySelectorProps {
  categoryId: string;
  categories: PromptCategory[];
  onValueChange: (value: string) => void;
}

export function CategorySelector({ categoryId, categories, onValueChange }: CategorySelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="category">Category</Label>
      <Select 
        name="category_id"
        value={categoryId} 
        onValueChange={(value) => onValueChange(value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
