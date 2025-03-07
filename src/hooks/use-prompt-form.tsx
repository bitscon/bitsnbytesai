
import { useState } from 'react';
import { useAdminPrompts } from '@/hooks/use-admin-prompts';
import { Prompt, DifficultyLevel } from '@/types/prompts';

export interface PromptFormData {
  category_id: string;
  difficulty_level: DifficultyLevel;
  prompt_text: string;
  why_it_works: string;
  explanation: string;
  explanation_enabled: boolean;
}

interface UsePromptFormProps {
  prompt?: Prompt;
  onSuccess: () => void;
}

export function usePromptForm({ prompt, onSuccess }: UsePromptFormProps) {
  const [formData, setFormData] = useState<PromptFormData>({
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

  const isValid = !!formData.category_id && !!formData.prompt_text && !!formData.why_it_works;

  return {
    formData,
    isSubmitting,
    handleChange,
    handleSubmit,
    isValid
  };
}
