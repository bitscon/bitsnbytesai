
import React, { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PromptCard } from './PromptCard';
import { PromptModal } from './PromptModal';
import { Prompt, PromptCategory } from '@/types/prompts';
import { motion } from 'framer-motion';

interface VirtualizedPromptGridProps {
  prompts: Prompt[];
  categories: PromptCategory[];
}

export function VirtualizedPromptGrid({ prompts, categories }: VirtualizedPromptGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [itemsPerRow, setItemsPerRow] = useState(3);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  
  // Update items per row based on screen width
  useEffect(() => {
    const updateGridColumns = () => {
      if (window.innerWidth < 640) {
        setItemsPerRow(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerRow(2);
      } else {
        setItemsPerRow(3);
      }
    };
    
    // Initial call
    updateGridColumns();
    
    // Add resize listener
    window.addEventListener('resize', updateGridColumns);
    return () => window.removeEventListener('resize', updateGridColumns);
  }, []);
  
  // Calculate how many rows we need
  const rowCount = Math.ceil(prompts.length / itemsPerRow);
  
  // Use a better size estimate for row height
  const estimateSize = () => 280; // Adjusted height for better spacing

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 3, // Number of rows to render outside the visible area
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
                  padding: '0 8px',
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
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
                        className="h-full" // Ensure full height
                      >
                        <PromptCard
                          prompt={prompt}
                          category={category}
                          onClick={() => handleCardClick(prompt)}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>
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
