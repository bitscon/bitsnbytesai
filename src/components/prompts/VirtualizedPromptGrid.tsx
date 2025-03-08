
import React, { useRef } from 'react';
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
  
  // Use a dynamic size estimate based on screen width
  const estimateSize = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640 ? 350 : 320; // Mobile vs desktop sizing
    }
    return 320;
  };

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
        <div className="absolute top-0 left-0 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const prompt = prompts[virtualItem.index];
            const category = categories.find(c => c.id === prompt.category_id);
            
            return (
              <motion.div
                key={virtualItem.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(0.3, virtualItem.index * 0.03) }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="p-2"
              >
                <PromptCard
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
