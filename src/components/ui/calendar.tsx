
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  getLocalTimeZone, 
  today,
  CalendarDate,
  isSameDay,
  isSameMonth
} from "@internationalized/date";

export interface CalendarProps {
  mode?: "single" | "range" | "multiple";
  selected?: Date | Date[] | { from?: Date; to?: Date } | undefined;
  onSelect?: (date: Date | undefined) => void;
  onRangeSelect?: (range: { from?: Date; to?: Date } | undefined) => void;
  disabled?: (date: Date) => boolean;
  fromDate?: Date;
  toDate?: Date;
  showOutsideDays?: boolean;
  className?: string;
  initialFocus?: boolean;
  defaultMonth?: Date;
  numberOfMonths?: number;
  captionLayout?: "buttons" | "dropdown";
}

function Calendar({
  mode = "single",
  selected,
  onSelect,
  onRangeSelect,
  disabled,
  fromDate,
  toDate,
  showOutsideDays = true,
  className,
  initialFocus,
  defaultMonth,
  numberOfMonths = 1,
  captionLayout = "buttons",
  ...props
}: CalendarProps) {
  const [month, setMonth] = React.useState(() => {
    if (mode === "single" && selected instanceof Date) {
      return new Date(selected.getFullYear(), selected.getMonth(), 1);
    }
    
    if (mode === "range" && selected && typeof selected === "object" && "from" in selected && selected.from) {
      return new Date(selected.from.getFullYear(), selected.from.getMonth(), 1);
    }
    
    if (defaultMonth) {
      return new Date(defaultMonth.getFullYear(), defaultMonth.getMonth(), 1);
    }
    
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  
  // Convert selected value to internal format
  const getSelectedDates = React.useCallback(() => {
    if (mode === "single" && selected instanceof Date) {
      return [selected];
    }
    
    if (mode === "multiple" && Array.isArray(selected)) {
      return selected;
    }
    
    if (mode === "range" && selected && typeof selected === "object" && "from" in selected) {
      const dates: Date[] = [];
      if (!selected.from || !selected.to) return dates;
      
      const start = new Date(selected.from);
      const end = new Date(selected.to);
      const date = new Date(start);
      
      while (date <= end) {
        dates.push(new Date(date));
        date.setDate(date.getDate() + 1);
      }
      
      return dates;
    }
    
    return [];
  }, [mode, selected]);
  
  const selectedDates = getSelectedDates();
  
  const isDateSelected = (date: Date) => {
    return selectedDates.some(selectedDate => 
      isSameDay(
        new CalendarDate(selectedDate.getFullYear(), selectedDate.getMonth() + 1, selectedDate.getDate()),
        new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
      )
    );
  };
  
  const isDateInRange = (date: Date) => {
    if (mode !== "range" || !selected || typeof selected !== "object" || !("from" in selected) || !selected.from || !selected.to) {
      return false;
    }
    
    const current = new Date(date);
    current.setHours(0, 0, 0, 0);
    
    const start = new Date(selected.from);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(selected.to);
    end.setHours(0, 0, 0, 0);
    
    return current > start && current < end;
  };
  
  const isFirstOrLastSelectedDate = (date: Date) => {
    if (mode !== "range" || !selected || typeof selected !== "object" || !("from" in selected)) {
      return false;
    }
    
    const current = new Date(date);
    current.setHours(0, 0, 0, 0);
    
    if (selected.from) {
      const start = new Date(selected.from);
      start.setHours(0, 0, 0, 0);
      if (current.getTime() === start.getTime()) return true;
    }
    
    if (selected.to) {
      const end = new Date(selected.to);
      end.setHours(0, 0, 0, 0);
      if (current.getTime() === end.getTime()) return true;
    }
    
    return false;
  };
  
  const isToday = (date: Date) => {
    const todayDate = today(getLocalTimeZone());
    return isSameDay(
      new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()),
      new CalendarDate(todayDate.year, todayDate.month, todayDate.day)
    );
  };
  
  const isDateDisabled = (date: Date) => {
    if (disabled && disabled(date)) return true;
    
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      if (date < from) return true;
    }
    
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(0, 0, 0, 0);
      if (date > to) return true;
    }
    
    return false;
  };
  
  const handleDateSelect = (date: Date) => {
    if (isDateDisabled(date)) return;
    
    if (mode === "single" && onSelect) {
      onSelect(date);
    } else if (mode === "range" && onRangeSelect) {
      const range = { from: undefined, to: undefined };
      
      if (!selected || typeof selected !== "object" || !("from" in selected) || (!selected.from && !selected.to)) {
        range.from = date;
      } else if (selected.from && !selected.to) {
        if (date < selected.from) {
          range.from = date;
          range.to = selected.from;
        } else {
          range.from = selected.from;
          range.to = date;
        }
      } else {
        range.from = date;
      }
      
      onRangeSelect(range);
    }
  };
  
  const handlePreviousMonth = () => {
    setMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };
  
  const handleNextMonth = () => {
    setMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };
  
  const getDaysArray = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Last day of month
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for previous month days
    for (let i = 0; i < firstDay; i++) {
      if (showOutsideDays) {
        const prevMonthDate = new Date(year, month, -i);
        days.unshift(prevMonthDate);
      } else {
        days.unshift(null);
      }
    }
    
    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add next month days to complete the grid
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remainingCells = totalCells - days.length;
    
    for (let i = 1; i <= remainingCells; i++) {
      if (showOutsideDays) {
        days.push(new Date(year, month + 1, i));
      } else {
        days.push(null);
      }
    }
    
    return days;
  };
  
  const renderMonthGrid = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const monthIndex = monthDate.getMonth();
    const days = getDaysArray(year, monthIndex);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-center pt-1 relative items-center">
          <div className="text-sm font-medium">
            {monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          <div className="space-x-1 flex items-center absolute right-1">
            {monthIndex === month.getMonth() && monthDate.getFullYear() === month.getFullYear() && (
              <Button
                variant="outline"
                className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {monthIndex === month.getMonth() && monthDate.getFullYear() === month.getFullYear() && (
              <Button
                variant="outline"
                className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-7">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div 
              key={`header-${i}`} 
              className="text-muted-foreground rounded-md text-center text-[0.8rem] font-normal"
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-9 w-9" />;
            }
            
            const isSelected = isDateSelected(date);
            const isRange = isDateInRange(date);
            const isRangeEnd = isFirstOrLastSelectedDate(date);
            const isCurrentDay = isToday(date);
            const isDisabled = isDateDisabled(date);
            const isOutsideCurrentMonth = !isSameMonth(
              new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()),
              new CalendarDate(month.getFullYear(), month.getMonth() + 1, 1)
            );
            
            return (
              <div 
                key={`date-${date.toISOString()}`} 
                className={cn(
                  "h-9 w-9 text-center p-0 relative",
                  isSelected && "bg-primary text-primary-foreground",
                  isRange && "bg-accent text-accent-foreground",
                  isRangeEnd && "rounded-md",
                  isCurrentDay && !isSelected && "bg-accent text-accent-foreground",
                  isOutsideCurrentMonth && "text-muted-foreground opacity-50",
                  isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed"
                )}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "h-9 w-9 p-0 font-normal",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    isCurrentDay && !isSelected && "bg-accent text-accent-foreground"
                  )}
                  disabled={isDisabled}
                  onClick={() => handleDateSelect(date)}
                >
                  {date.getDate()}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  const renderMonthGrids = () => {
    const grids = [];
    
    for (let i = 0; i < numberOfMonths; i++) {
      const currentMonth = new Date(month);
      currentMonth.setMonth(month.getMonth() + i);
      
      grids.push(
        <div key={`month-${i}`} className="space-y-4">
          {renderMonthGrid(currentMonth)}
        </div>
      );
    }
    
    return grids;
  };
  
  return (
    <div className={cn("p-3 pointer-events-auto", className)} {...props}>
      <div className={cn(
        "flex",
        numberOfMonths > 1 ? "flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0" : ""
      )}>
        {renderMonthGrids()}
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
