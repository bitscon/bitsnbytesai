
import React, { useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface PromptExplanationProps {
  explanation?: string;
  enabled?: boolean;
  className?: string;
}

export function PromptExplanation({ explanation, enabled = true, className }: PromptExplanationProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [globalEnabled, setGlobalEnabled] = useState<boolean>(true);

  useEffect(() => {
    // Fetch global setting for prompt explanations
    const fetchGlobalSetting = async () => {
      const { data, error } = await supabase
        .from('api_settings')
        .select('key_value')
        .eq('key_name', 'prompt_explanations_enabled')
        .single();
      
      if (error) {
        console.error('Error fetching global prompt explanation setting:', error);
        return;
      }
      
      // Parse the text value as boolean
      setGlobalEnabled(data.key_value === 'true');
    };

    fetchGlobalSetting();

    // Subscribe to changes in the api_settings table
    const subscription = supabase
      .channel('api_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'api_settings',
          filter: 'key_name=eq.prompt_explanations_enabled'
        },
        (payload) => {
          console.log('Prompt explanations setting updated:', payload);
          setGlobalEnabled(payload.new.key_value === 'true');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // If explanation is not provided, or individual prompt has it disabled, or globally disabled
  if (!explanation || !enabled || !globalEnabled) {
    return null;
  }

  return (
    <div className={cn("mt-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="p-0 h-auto hover:bg-transparent"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="explanation-content"
      >
        <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
        <span className="sr-only">Toggle explanation</span>
      </Button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="explanation-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              {explanation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
