
import React from 'react';
import { Button } from '@/components/ui/button';
import { Prompt } from '@/types/prompts';
import { Edit, MoreVertical, Plus, Trash } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface PromptListProps {
  prompts: any[]; // Using any[] because of the joined prompt_categories in your data
  onAddPrompt: () => void;
  onEditPrompt: (prompt: Prompt) => void;
  onDeletePrompt: (prompt: Prompt) => void;
}

export function PromptList({ 
  prompts, 
  onAddPrompt,
  onEditPrompt,
  onDeletePrompt,
}: PromptListProps) {
  return (
    <>
      {prompts.length > 0 ? (
        <div className="divide-y">
          {prompts.map((prompt: any) => (
            <div key={prompt.id} className="py-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      prompt.difficulty_level === "Beginner" && "bg-green-100 text-green-800",
                      prompt.difficulty_level === "Intermediate" && "bg-blue-100 text-blue-800",
                      prompt.difficulty_level === "Advanced" && "bg-purple-100 text-purple-800",
                    )}>
                      {prompt.difficulty_level}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {prompt.prompt_categories?.name}
                    </span>
                  </div>
                  <h3 className="font-medium">
                    {prompt.prompt_text.substring(0, 100)}
                    {prompt.prompt_text.length > 100 ? '...' : ''}
                  </h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditPrompt(prompt)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDeletePrompt(prompt)}
                    >
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-muted-foreground">No prompts found</p>
          <Button onClick={onAddPrompt} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Prompt
          </Button>
        </div>
      )}
    </>
  );
}
