
import React, { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PromptCardList } from './PromptCardList';
import { PromptModal } from './PromptModal';
import { Prompt, PromptCategory } from '@/types/prompts';
import { motion } from 'framer-motion';

interface VirtualizedPromptListProps {
  prompts: Prompt[];
  categories: PromptCategory[];
}

export function VirtualizedPromptList({ prompts, categories }: VirtualizedPromptListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  
  // Use a better size estimate for items
  const estimateSize = () => 220; // Increased height for better spacing

  const virtualizer = useVirtualizer({
    count: prompts.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5, // Number of items to render outside the visible area
  });

  const handleCardClick = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
  };

  const handleCloseModal = () => {
    setSelectedPrompt(null);
  };

  const selectedCategory = selectedPrompt 
    ? categories.find(c => c.id === selectedPrompt.category_id)
    : undefined;

  return (
    <>
      <div
        ref={parentRef}
        className="w-full h-[650px] overflow-auto rounded-md bg-background"
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
            const category = categories.find(c => c.id === prompt.category_id);
            
            return (
              <motion.div
                key={virtualItem.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(0.2, virtualItem.index * 0.02) }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                  padding: '0 8px 16px',
                  height: `${virtualItem.size}px`,
                }}
              >
                <div onClick={() => handleCardClick(prompt)} className="cursor-pointer">
                  <PromptCardList
                    prompt={prompt}
                    category={category}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <PromptModal 
        prompt={selectedPrompt}
        category={selectedCategory}
        isOpen={!!selectedPrompt}
        onClose={handleCloseModal}
      />
    </>
  );
}
