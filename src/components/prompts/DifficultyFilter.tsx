
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DifficultyLevel } from '@/types/prompts';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { BrainCircuit, Check, CircleCheck, CircleAlert, CircleHelp, Sparkles, Zap } from 'lucide-react';

export interface DifficultyFilterProps {
  selectedDifficulty: DifficultyLevel | null;
  onChange: (difficulty: DifficultyLevel | null) => void;
}

export function DifficultyFilter({ selectedDifficulty, onChange }: DifficultyFilterProps) {
  const difficulties: DifficultyLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
  
  const handleClick = (difficulty: DifficultyLevel) => {
    if (selectedDifficulty === difficulty) {
      onChange(null);
    } else {
      onChange(difficulty);
    }
  };

  const getDifficultyIcon = (difficulty: DifficultyLevel) => {
    switch(difficulty) {
      case 'Beginner':
        return <Sparkles className="h-3.5 w-3.5 mr-1" />;
      case 'Intermediate':
        return <Zap className="h-3.5 w-3.5 mr-1" />;
      case 'Advanced':
        return <BrainCircuit className="h-3.5 w-3.5 mr-1" />;
    }
  };

  const getDifficultyClass = (difficulty: DifficultyLevel, isSelected: boolean) => {
    if (!isSelected) return "border hover:bg-muted/30";
    
    switch(difficulty) {
      case 'Beginner':
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
      case 'Intermediate':
        return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200";
      case 'Advanced':
        return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {difficulties.map((difficulty) => (
        <motion.div
          key={difficulty}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Badge
            variant="outline"
            className={cn(
              "cursor-pointer transition-all px-3 py-1.5 text-sm font-medium flex items-center",
              getDifficultyClass(difficulty, selectedDifficulty === difficulty)
            )}
            onClick={() => handleClick(difficulty)}
          >
            {getDifficultyIcon(difficulty)}
            {difficulty}
            {selectedDifficulty === difficulty && (
              <Check className="h-3 w-3 ml-1" />
            )}
          </Badge>
        </motion.div>
      ))}
    </div>
  );
}
