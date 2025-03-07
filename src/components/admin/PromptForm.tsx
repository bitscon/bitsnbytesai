
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAdminPrompts } from '@/hooks/use-admin-prompts';
import { Prompt, PromptCategory, DifficultyLevel } from '@/types/prompts';

interface PromptFormProps {
  prompt?: Prompt;
  categories: PromptCategory[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function PromptForm({ prompt, categories, onSuccess, onCancel }: PromptFormProps) {
  const [formData, setFormData] = useState({
    category_id: prompt?.category_id || '',
    difficulty_level: prompt?.difficulty_level || 'Beginner' as DifficultyLevel,
    prompt_text: prompt?.prompt_text || '',
    why_it_works: prompt?.why_it_works || '',
    explanation: prompt?.explanation || '',
    explanation_enabled: prompt?.explanation_enabled ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPrompt, updatePrompt } = useAdminPrompts();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | 
    { name: string; value: string | boolean }
  ) => {
    const { name, value } = 'target' in e ? e.target : e;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category_id || !formData.prompt_text || !formData.why_it_works) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let success = false;
      
      if (prompt) {
        success = await updatePrompt(prompt.id, formData);
      } else {
        const result = await createPrompt(formData);
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
        <Label htmlFor="category">Category</Label>
        <Select 
          name="category_id"
          value={formData.category_id} 
          onValueChange={(value) => handleChange({ name: 'category_id', value })}
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
      
      <div className="space-y-2">
        <Label htmlFor="difficulty">Difficulty Level</Label>
        <Select 
          name="difficulty_level"
          value={formData.difficulty_level} 
          onValueChange={(value) => handleChange({ name: 'difficulty_level', value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="prompt_text">Prompt Text</Label>
        <Textarea
          id="prompt_text"
          name="prompt_text"
          value={formData.prompt_text}
          onChange={handleChange}
          placeholder="Enter the prompt text"
          rows={5}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="explanation">Explanation</Label>
        <Textarea
          id="explanation"
          name="explanation"
          value={formData.explanation}
          onChange={handleChange}
          placeholder="Enter a beginner-friendly explanation of how this prompt works"
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="explanation_enabled"
          checked={formData.explanation_enabled}
          onCheckedChange={(checked) => 
            setFormData(prev => ({ ...prev, explanation_enabled: checked }))
          }
        />
        <Label htmlFor="explanation_enabled">Enable explanation for this prompt</Label>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="why_it_works">Why This Works</Label>
        <Textarea
          id="why_it_works"
          name="why_it_works"
          value={formData.why_it_works}
          onChange={handleChange}
          placeholder="Explain why this prompt works well"
          rows={3}
          required
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !formData.category_id || !formData.prompt_text || !formData.why_it_works}
        >
          {isSubmitting 
            ? 'Saving...' 
            : prompt 
              ? 'Update Prompt' 
              : 'Create Prompt'}
        </Button>
      </div>
    </form>
  );
}
