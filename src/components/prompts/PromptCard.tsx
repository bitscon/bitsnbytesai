
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Prompt } from '@/types/prompts';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PromptCardProps {
  prompt: Prompt;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt.prompt_text);
    setCopied(true);
    
    toast({
      title: "Copied to clipboard",
      description: "The prompt has been copied to your clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 animate-fade-in">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className={cn(
              "inline-block px-2 py-1 text-xs rounded-full mb-2",
              prompt.difficulty_level === "Beginner" && "bg-green-100 text-green-800",
              prompt.difficulty_level === "Intermediate" && "bg-blue-100 text-blue-800",
              prompt.difficulty_level === "Advanced" && "bg-purple-100 text-purple-800",
            )}>
              {prompt.difficulty_level}
            </div>
            <h3 className="font-semibold truncate">
              {prompt.prompt_text.split(' ').slice(0, 6).join(' ')}...
            </h3>
          </div>
          <Button
            size="sm"
            variant={copied ? "default" : "outline"}
            onClick={handleCopy}
            className="gap-1"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-2 p-0 h-auto w-full flex justify-between hover:bg-transparent"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="text-xs text-muted-foreground">
            {expanded ? "Hide details" : "Show details"}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
        
        {expanded && (
          <div className={cn(
            "mt-4 space-y-4 transition-all duration-300",
            expanded ? "animate-fade-in" : "animate-fade-out"
          )}>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Prompt:</h4>
              <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                {prompt.prompt_text}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Why This Works:</h4>
              <p className="text-sm text-muted-foreground">{prompt.why_it_works}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
