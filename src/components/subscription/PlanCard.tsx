
import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubscriptionPlan } from '@/types/subscription';

interface PlanCardProps {
  plan: SubscriptionPlan;
  billingInterval: 'month' | 'year';
  isActive: boolean;
  isSubscribing: boolean;
  onSubscribe: (planId: string) => void;
}

export function PlanCard({
  plan,
  billingInterval,
  isActive,
  isSubscribing,
  onSubscribe
}: PlanCardProps) {
  return (
    <Card 
      className={`flex flex-col h-full ${isActive ? 'border-primary' : ''}`}
    >
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {plan.name}
          {isActive && (
            <Badge variant="secondary">Current Plan</Badge>
          )}
        </CardTitle>
        <CardDescription>
          {plan.features.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">
            ${billingInterval === 'month' ? plan.price_monthly.toFixed(2) : (plan.price_yearly / 12).toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground ml-1.5">
            /month
          </span>
        </div>
        
        {billingInterval === 'year' && plan.price_yearly > 0 && (
          <p className="text-sm text-muted-foreground">
            ${plan.price_yearly.toFixed(2)} billed yearly
          </p>
        )}
        
        <ul className="space-y-2">
          {Object.entries(plan.features)
            .filter(([key]) => key !== 'description')
            .map(([key, value]) => {
              if (typeof value !== 'boolean' && typeof value !== 'number') return null;
              
              const featureName = key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase());
              
              return (
                <li key={key} className="flex items-center">
                  {value ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-300 mr-2 flex-shrink-0" />
                  )}
                  <span className={value ? '' : 'text-muted-foreground'}>
                    {typeof value === 'number' ? `${value} ${featureName}` : featureName}
                  </span>
                </li>
              );
            })}
        </ul>
      </CardContent>
      <CardFooter>
        {plan.tier === 'enterprise' ? (
          <Button 
            className="w-full"
            variant="outline"
            onClick={() => window.open('mailto:sales@example.com')}
          >
            Contact Sales
          </Button>
        ) : isActive ? (
          <Button className="w-full" disabled>
            Current Plan
          </Button>
        ) : (
          <Button 
            className="w-full"
            onClick={() => onSubscribe(plan.id)}
            disabled={
              isSubscribing || 
              (plan.tier === 'free') || 
              (billingInterval === 'month' && !plan.stripe_price_id_monthly) ||
              (billingInterval === 'year' && !plan.stripe_price_id_yearly)
            }
          >
            {isSubscribing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {plan.tier === 'free' ? 'Free Plan' : `Upgrade to ${plan.name}`}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
