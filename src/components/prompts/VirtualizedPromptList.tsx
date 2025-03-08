
import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PromptCardList } from './PromptCardList';
import { Prompt, PromptCategory } from '@/types/prompts';

interface VirtualizedPromptListProps {
  prompts: Prompt[];
  categories: PromptCategory[];
}

export function VirtualizedPromptList({ prompts, categories }: VirtualizedPromptListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Use a smaller estimated size for list items
  const estimateSize = () => 150;

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
        <div className="absolute top-0 left-0 w-full space-y-3 px-2">
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
                <PromptCardList
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
