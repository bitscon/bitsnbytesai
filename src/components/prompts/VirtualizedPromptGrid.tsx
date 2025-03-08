
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
  
  // Calculate items per row based on screen width
  const getItemsPerRow = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3;
    }
    return 3; // Default to 3 columns for SSR
  };
  
  const itemsPerRow = getItemsPerRow();
  
  // Calculate how many rows we need
  const rowCount = Math.ceil(prompts.length / itemsPerRow);
  
  // Use a dynamic size estimate based on screen width for row height
  const estimateSize = () => {
    return 350; // Fixed row height
  };

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 2, // Number of rows to render outside the visible area
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
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowIndex = virtualRow.index;
          
          // Calculate the starting index for this row
          const startIndex = rowIndex * itemsPerRow;
          
          // Get the items for this row
          const rowItems = prompts.slice(startIndex, startIndex + itemsPerRow);
          
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2"
            >
              {rowItems.map((prompt, itemIndex) => {
                const promptIndex = startIndex + itemIndex;
                const category = categories.find(c => c.id === prompt.category_id);
                
                return (
                  <motion.div
                    key={prompt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: Math.min(0.3, promptIndex * 0.03) 
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
          );
        })}
      </div>
    </div>
  );
}
