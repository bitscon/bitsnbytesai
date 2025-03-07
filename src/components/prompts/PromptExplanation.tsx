
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PromptExplanationProps {
  explanation?: string;
  enabled?: boolean;
  className?: string;
}

export function PromptExplanation({ explanation, enabled = true, className }: PromptExplanationProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!explanation || !enabled) {
    return null;
  }

  return (
    <div className={cn("mt-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="p-0 h-auto hover:bg-transparent"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="explanation-content"
      >
        <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
        <span className="sr-only">Toggle explanation</span>
      </Button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="explanation-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              {explanation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
