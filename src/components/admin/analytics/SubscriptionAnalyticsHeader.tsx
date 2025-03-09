
import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

interface SubscriptionAnalyticsHeaderProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function SubscriptionAnalyticsHeader({
  dateRange,
  onDateRangeChange,
  onRefresh,
  isLoading
}: SubscriptionAnalyticsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscription Analytics</h1>
        <p className="text-muted-foreground">
          Track subscription metrics, conversions, and payment failures
        </p>
      </div>
      
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
