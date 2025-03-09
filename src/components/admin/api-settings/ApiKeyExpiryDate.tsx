
import React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ApiKeyExpiryDateProps {
  expiryDate: string | null;
  onExpiryDateChange: (date: Date | undefined) => void;
  disabled?: boolean;
}

export function ApiKeyExpiryDate({ 
  expiryDate, 
  onExpiryDateChange,
  disabled = false
}: ApiKeyExpiryDateProps) {
  const date = expiryDate ? parseISO(expiryDate) : undefined;
  const isExpired = date && date < new Date();
  const isExpiringSoon = date && !isExpired && date < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            isExpired && "border-red-300 text-red-500",
            isExpiringSoon && "border-amber-300 text-amber-500",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date && isValid(date) ? format(date, 'PPP') : <span>Set expiry date</span>}
          {isExpired && " (Expired)"}
          {isExpiringSoon && !isExpired && " (Expiring soon)"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onExpiryDateChange}
          disabled={(date) => date < new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
