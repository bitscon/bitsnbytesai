
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface PromptCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface Prompt {
  id: string;
  category_id: string;
  difficulty_level: DifficultyLevel;
  prompt_text: string;
  why_it_works: string;
  created_at: string;
  updated_at: string;
  image_url?: string; // Added optional image URL
}
