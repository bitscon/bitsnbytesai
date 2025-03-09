
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface BillingIntervalSelectorProps {
  onChange: (value: 'month' | 'year') => void;
}

export function BillingIntervalSelector({ onChange }: BillingIntervalSelectorProps) {
  return (
    <div className="mb-6 flex justify-center">
      <Tabs 
        defaultValue="month" 
        onValueChange={(value) => onChange(value as 'month' | 'year')}
        className="w-full max-w-md"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="month">Monthly</TabsTrigger>
          <TabsTrigger value="year">
            Yearly
            <Badge variant="outline" className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Save 20%
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
