
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
  mode?: 'new' | 'change';
}

export function PlanCard({
  plan,
  billingInterval,
  isActive,
  isSubscribing,
  onSubscribe,
  mode = 'new'
}: PlanCardProps) {
  const getTierButtonText = (tier: string, isActive: boolean) => {
    if (isActive) return "Current Plan";
    if (tier === 'free') return "Free Plan";
    
    if (mode === 'change') {
      const tierLevels: Record<string, number> = {
        'free': 0,
        'pro': 1,
        'premium': 2,
        'enterprise': 3
      };
      
      // We need to determine if this is an upgrade, downgrade, or just a change
      // But we don't have the current tier here, so we'll just say "Select"
      return `Select ${plan.name}`;
    }
    
    return `Upgrade to ${plan.name}`;
  };

  const renderFeatures = () => {
    if (!plan.features) return null;
    
    let featuresList: JSX.Element[] = [];
    
    // Handle description separately
    let description = '';
    if (typeof plan.features === 'object') {
      if ('description' in plan.features) {
        description = plan.features.description as string;
      }
    }
    
    // Process the features
    if (typeof plan.features === 'object') {
      // First, collect and sort all feature entries
      const entries = Object.entries(plan.features)
        .filter(([key]) => key !== 'description') // Skip description
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
      
      // Then process each feature
      featuresList = entries.map(([key, value], index) => {
        // Handle different feature formats
        let featureEnabled = false;
        let featureLabel = '';
        
        if (typeof value === 'boolean') {
          featureEnabled = value;
          featureLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } else if (typeof value === 'number') {
          featureEnabled = value > 0;
          featureLabel = `${value} ${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
        } else if (typeof value === 'object' && value !== null) {
          // For complex objects with description and value properties
          if ('description' in value && 'value' in value) {
            featureEnabled = Boolean(value.value);
            featureLabel = value.description as string;
          } else if ('description' in value) {
            // For objects with just a description
            featureEnabled = true;
            featureLabel = value.description as string;
          }
        } else if (typeof value === 'string') {
          featureEnabled = true;
          featureLabel = value;
        }
        
        return (
          <li key={index} className="flex items-center">
            {featureEnabled ? (
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-300 mr-2 flex-shrink-0" />
            )}
            <span className={featureEnabled ? '' : 'text-muted-foreground'}>
              {featureLabel}
            </span>
          </li>
        );
      });
    }
    
    return { description, featuresList };
  };

  const { description, featuresList } = renderFeatures() || { description: '', featuresList: [] };

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
          {description}
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
          {featuresList}
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
              (plan.tier === 'free' && mode === 'new') || 
              (billingInterval === 'month' && !plan.stripe_price_id_monthly) ||
              (billingInterval === 'year' && !plan.stripe_price_id_yearly)
            }
          >
            {isSubscribing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {getTierButtonText(plan.tier, isActive)}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
