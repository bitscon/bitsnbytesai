
import React from 'react';
import { Prompt, PromptCategory } from '@/types/prompts';
import { usePromptForm } from '@/hooks/use-prompt-form';
import { CategorySelector } from '@/components/admin/prompt-form/CategorySelector';
import { DifficultySelector } from '@/components/admin/prompt-form/DifficultySelector';
import { PromptTextArea } from '@/components/admin/prompt-form/PromptTextArea';
import { ExplanationToggle } from '@/components/admin/prompt-form/ExplanationToggle';
import { FormActions } from '@/components/admin/prompt-form/FormActions';
import { ImageUrlInput } from '@/components/admin/prompt-form/ImageUrlInput';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PromptFormProps {
  prompt?: Prompt;
  categories: PromptCategory[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function PromptForm({ prompt, categories, onSuccess, onCancel }: PromptFormProps) {
  const { 
    formData, 
    isSubmitting, 
    handleChange, 
    handleSubmit,
    isValid
  } = usePromptForm({ prompt, onSuccess });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CategorySelector 
        categoryId={formData.category_id} 
        categories={categories} 
        onValueChange={(value) => handleChange({ name: 'category_id', value })}
      />
      
      <DifficultySelector 
        difficulty={formData.difficulty_level} 
        onValueChange={(value) => handleChange({ name: 'difficulty_level', value })}
      />

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          placeholder="Enter a concise title for the prompt"
          required
          onChange={handleChange}
        />
      </div>
      
      <PromptTextArea
        id="prompt_text"
        label="Prompt Text"
        name="prompt_text"
        value={formData.prompt_text}
        placeholder="Enter the prompt text"
        rows={5}
        required
        onChange={handleChange}
      />
      
      <PromptTextArea
        id="short_description"
        label="Summary"
        name="short_description"
        value={formData.short_description}
        placeholder="Enter a brief summary (displayed on the prompt card)"
        description="This summary will be displayed on the prompt card. Keep it concise (1-2 sentences)."
        rows={2}
        onChange={handleChange}
      />
      
      <PromptTextArea
        id="explanation"
        label="Explanation"
        name="explanation"
        value={formData.explanation}
        placeholder="Enter a beginner-friendly explanation of how this prompt works"
        rows={3}
        onChange={handleChange}
      />
      
      <ExplanationToggle 
        isEnabled={formData.explanation_enabled}
        onToggle={(checked) => handleChange({ name: 'explanation_enabled', value: checked })}
      />
      
      <PromptTextArea
        id="why_it_works"
        label="Why This Works"
        name="why_it_works"
        value={formData.why_it_works}
        placeholder="Explain why this prompt works well"
        rows={3}
        required
        onChange={handleChange}
      />
      
      <ImageUrlInput
        imageUrl={formData.image_url}
        onChange={(value) => handleChange({ name: 'image_url', value })}
      />
      
      <FormActions 
        isSubmitting={isSubmitting}
        isValid={isValid}
        isEditMode={!!prompt}
        onCancel={onCancel}
      />
    </form>
  );
}
