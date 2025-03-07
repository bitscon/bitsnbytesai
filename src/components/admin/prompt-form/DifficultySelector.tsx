
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DifficultyLevel } from '@/types/prompts';

interface DifficultySelectorProps {
  difficulty: DifficultyLevel;
  onValueChange: (value: DifficultyLevel) => void;
}

export function DifficultySelector({ difficulty, onValueChange }: DifficultySelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="difficulty">Difficulty Level</Label>
      <Select 
        name="difficulty_level"
        value={difficulty} 
        onValueChange={(value) => onValueChange(value as DifficultyLevel)}
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
  );
}
