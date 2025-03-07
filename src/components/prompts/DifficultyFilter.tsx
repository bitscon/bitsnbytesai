
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { DifficultyLevel } from '@/types/prompts';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DifficultyFilterProps {
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
              "cursor-pointer transition-all px-3 py-1 text-sm font-medium",
              selectedDifficulty === difficulty && 
              (difficulty === "Beginner" ? "bg-green-100 text-green-800 hover:bg-green-100" :
               difficulty === "Intermediate" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
               "bg-purple-100 text-purple-800 hover:bg-purple-100")
            )}
            onClick={() => handleClick(difficulty)}
          >
            {difficulty}
          </Badge>
        </motion.div>
      ))}
    </div>
  );
}
