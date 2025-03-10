
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { calculateYearlySavings } from '@/utils/subscription/subscriptionUtils';

interface BillingIntervalSelectorProps {
  billingInterval: 'month' | 'year';
  setBillingInterval: (interval: 'month' | 'year') => void;
  yearlyDiscount?: number;
  showSavings?: boolean;
  monthlyPrice?: number;
  yearlyPrice?: number;
}

export function BillingIntervalSelector({
  billingInterval,
  setBillingInterval,
  yearlyDiscount = 0,
  showSavings = true,
  monthlyPrice,
  yearlyPrice
}: BillingIntervalSelectorProps) {
  // Animation state for the selector
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right'>(
    billingInterval === 'month' ? 'left' : 'right'
  );
  
  // Calculate savings from prices if provided
  const [calculatedDiscount, setCalculatedDiscount] = useState<number>(yearlyDiscount);
  
  useEffect(() => {
    if (monthlyPrice && yearlyPrice && monthlyPrice > 0 && yearlyPrice > 0) {
      const savings = calculateYearlySavings(monthlyPrice, yearlyPrice);
      setCalculatedDiscount(savings > 0 ? savings : yearlyDiscount);
    } else {
      setCalculatedDiscount(yearlyDiscount);
    }
  }, [monthlyPrice, yearlyPrice, yearlyDiscount]);

  // Update animation direction when billing interval changes
  useEffect(() => {
    setAnimationDirection(billingInterval === 'month' ? 'left' : 'right');
  }, [billingInterval]);

  return (
    <div className="flex flex-col items-center space-y-4 py-4">
      <div className="text-center mb-2">
        <h3 className="text-lg font-medium">Billing Interval</h3>
        <p className="text-sm text-muted-foreground">
          Choose between monthly or yearly billing
        </p>
      </div>
      
      <div className="flex items-center justify-center w-full max-w-xs bg-muted rounded-lg p-1 relative">
        <div
          className={`absolute top-1 bottom-1 ${
            animationDirection === 'left' ? 'left-1' : 'right-1'
          } w-[calc(50%-4px)] bg-primary rounded-md transition-all duration-200 ease-in-out`}
          style={{ 
            transform: `translateX(${animationDirection === 'left' ? '0' : '100%'})`,
            opacity: 0.2
          }}
        />
        
        <Button
          variant="ghost"
          onClick={() => setBillingInterval('month')}
          className={`flex-1 z-10 ${
            billingInterval === 'month' ? 'text-foreground font-medium' : 'text-muted-foreground'
          }`}
        >
          Monthly
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => setBillingInterval('year')}
          className={`flex-1 z-10 ${
            billingInterval === 'year' ? 'text-foreground font-medium' : 'text-muted-foreground'
          }`}
        >
          Yearly
          {showSavings && calculatedDiscount > 0 && (
            <span className="ml-1.5 text-xs py-0.5 px-1.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-full">
              Save {calculatedDiscount}%
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
