
import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PromptCard } from './PromptCard';
import { Prompt, PromptCategory } from '@/types/prompts';

interface VirtualizedPromptGridProps {
  prompts: Prompt[];
  categories: PromptCategory[];
}

export function VirtualizedPromptGrid({ prompts, categories }: VirtualizedPromptGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Use a smaller estimated size for more compact cards
  const estimateSize = () => 300;

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
              <div
                key={virtualItem.key}
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
