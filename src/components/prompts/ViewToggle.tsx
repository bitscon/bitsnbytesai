
import React from 'react';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ viewMode, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn("flex items-center space-x-1 bg-muted/50 p-1 rounded-md", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('grid')}
        className={cn(
          "h-8 px-2",
          viewMode === 'grid' ? "bg-background shadow-sm" : "hover:bg-background/60"
        )}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4 mr-1" />
        Grid
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('list')}
        className={cn(
          "h-8 px-2",
          viewMode === 'list' ? "bg-background shadow-sm" : "hover:bg-background/60"
        )}
        aria-label="List view"
      >
        <List className="h-4 w-4 mr-1" />
        List
      </Button>
    </div>
  );
}
