
import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PromptCardList } from './PromptCardList';
import { Prompt, PromptCategory } from '@/types/prompts';
import { motion } from 'framer-motion';

interface VirtualizedPromptListProps {
  prompts: Prompt[];
  categories: PromptCategory[];
}

export function VirtualizedPromptList({ prompts, categories }: VirtualizedPromptListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Optimize the estimated size for better performance
  const estimateSize = () => 180; // Adjusted size to accommodate content

  const virtualizer = useVirtualizer({
    count: prompts.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5, // Number of items to render outside the visible area
  });

  return (
    <div
      ref={parentRef}
      className="w-full h-[650px] overflow-auto"
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
        <div className="absolute top-0 left-0 w-full space-y-4 px-2">
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const prompt = prompts[virtualItem.index];
            const category = categories.find(c => c.id === prompt.category_id);
            
            return (
              <motion.div
                key={virtualItem.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: virtualItem.index * 0.05 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="p-2"
              >
                <PromptCardList
                  prompt={prompt}
                  category={category}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
