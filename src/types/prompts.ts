
export interface Prompt {
  id: string;
  prompt_text: string;
  why_it_works: string;
  category_id: string;
  difficulty_level: DifficultyLevel;
  created_at: string;
  updated_at?: string;
  prompt_categories?: PromptCategory;
  image_url?: string;
  explanation?: string;
  explanation_enabled?: boolean;
  title: string;
  short_description?: string;
}

export interface PromptCategory {
  id: string;
  name: string;
  created_at: string;
}

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface SavedPrompt {
  id: string;
  user_id: string;
  prompt_id: string;
  created_at: string;
  prompt?: Prompt;
}
