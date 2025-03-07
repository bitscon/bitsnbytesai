
import React, { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PromptCard } from './PromptCard';
import { Prompt, PromptCategory } from '@/types/prompts';
import { motion } from 'framer-motion';

interface VirtualizedPromptGridProps {
  prompts: Prompt[];
  categories: PromptCategory[];
}

export function VirtualizedPromptGrid({ prompts, categories }: VirtualizedPromptGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Increased estimated size to account for images
  const estimateSize = () => 500;

  const virtualizer = useVirtualizer({
    count: prompts.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5, // Number of items to render outside the visible area
  });

  return (
    <div
      ref={parentRef}
      className="w-full h-[800px] overflow-auto"
      style={{
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const prompt = prompts[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-3"
              >
                <PromptCard
                  prompt={prompt}
                  category={categories.find(c => c.id === prompt.category_id)}
                />
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
