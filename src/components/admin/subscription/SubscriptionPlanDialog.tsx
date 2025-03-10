
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SubscriptionPlan, SubscriptionTier } from '@/types/subscription';
import FeatureEditor from './FeatureEditor';
import { toast } from 'sonner';

interface SubscriptionPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SubscriptionPlanDialog({
  open,
  onOpenChange,
  plan,
  onClose,
  onSuccess
}: SubscriptionPlanDialogProps) {
  const queryClient = useQueryClient();

  const [formValues, setFormValues] = useState({
    name: '',
    tier: 'pro' as SubscriptionTier,
    price_monthly: 0,
    price_yearly: 0,
    stripe_price_id_monthly: '',
    stripe_price_id_yearly: '',
    features: {} as any
  });

  useEffect(() => {
    if (plan) {
      setFormValues({
        name: plan.name || '',
        tier: plan.tier || 'pro',
        price_monthly: plan.price_monthly || 0,
        price_yearly: plan.price_yearly || 0,
        stripe_price_id_monthly: plan.stripe_price_id_monthly || '',
        stripe_price_id_yearly: plan.stripe_price_id_yearly || '',
        features: plan.features || getInitialFeatures()
      });
    } else {
      setFormValues({
        name: '',
        tier: 'pro',
        price_monthly: 0,
        price_yearly: 0,
        stripe_price_id_monthly: '',
        stripe_price_id_yearly: '',
        features: getInitialFeatures()
      });
    }
  }, [plan, open]);

  const getInitialFeatures = () => {
    return {
      description: 'A great subscription plan with many features',
      feature1: { description: 'Access to all basic features', value: true },
      feature2: { description: 'Premium support', value: true },
      feature3: { description: 'Advanced features', value: false }
    };
  };

  const savePlanMutation = useMutation({
    mutationFn: async (data: any) => {
      // Clean up the features to ensure they're in the correct format for the database
      const processedFeatures = { ...data.features };
      
      // If using Supabase, we need to make sure we have valid JSON
      const finalFeatures = JSON.stringify(processedFeatures);
      
      if (plan?.id) {
        // Update existing plan
        const { error } = await supabase
          .from('subscription_plans')
          .update({
            name: data.name,
            tier: data.tier,
            price_monthly: data.price_monthly,
            price_yearly: data.price_yearly,
            stripe_price_id_monthly: data.stripe_price_id_monthly,
            stripe_price_id_yearly: data.stripe_price_id_yearly,
            features: finalFeatures
          })
          .eq('id', plan.id);
        
        if (error) throw error;
        return { success: true, action: 'update' };
      } else {
        // Create new plan
        const { error } = await supabase
          .from('subscription_plans')
          .insert({
            name: data.name,
            tier: data.tier,
            price_monthly: data.price_monthly,
            price_yearly: data.price_yearly,
            stripe_price_id_monthly: data.stripe_price_id_monthly,
            stripe_price_id_yearly: data.stripe_price_id_yearly,
            features: finalFeatures
          });
        
        if (error) throw error;
        return { success: true, action: 'create' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      toast.success(`Subscription plan ${plan ? 'updated' : 'created'} successfully`);
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (error: any) => {
      console.error('Error saving subscription plan:', error);
      toast.error(`Failed to ${plan ? 'update' : 'create'} subscription plan: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formValues.name) {
      toast.error('Name is required');
      return;
    }
    
    if (formValues.price_monthly < 0 || formValues.price_yearly < 0) {
      toast.error('Prices cannot be negative');
      return;
    }
    
    savePlanMutation.mutate(formValues);
  };

  const handleChange = (field: string, value: any) => {
    setFormValues({
      ...formValues,
      [field]: value
    });
  };

  const handleFeaturesChange = (features: any) => {
    setFormValues({
      ...formValues,
      features
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit' : 'Create'} Subscription Plan</DialogTitle>
          <DialogDescription>
            {plan 
              ? 'Update the details of this subscription plan.' 
              : 'Add a new subscription plan to your pricing tiers.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={formValues.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Pro Plan"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tier">Tier</Label>
              <Select
                value={formValues.tier}
                onValueChange={(value) => handleChange('tier', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price_monthly">Monthly Price</Label>
              <Input
                id="price_monthly"
                type="number"
                min="0"
                step="0.01"
                value={formValues.price_monthly}
                onChange={(e) => handleChange('price_monthly', parseFloat(e.target.value))}
                placeholder="19.99"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price_yearly">Yearly Price</Label>
              <Input
                id="price_yearly"
                type="number"
                min="0"
                step="0.01"
                value={formValues.price_yearly}
                onChange={(e) => handleChange('price_yearly', parseFloat(e.target.value))}
                placeholder="199.99"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stripe_price_id_monthly">Stripe Monthly Price ID</Label>
              <Input
                id="stripe_price_id_monthly"
                value={formValues.stripe_price_id_monthly}
                onChange={(e) => handleChange('stripe_price_id_monthly', e.target.value)}
                placeholder="price_1234567890"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stripe_price_id_yearly">Stripe Yearly Price ID</Label>
              <Input
                id="stripe_price_id_yearly"
                value={formValues.stripe_price_id_yearly}
                onChange={(e) => handleChange('stripe_price_id_yearly', e.target.value)}
                placeholder="price_0987654321"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="features">Plan Features</Label>
              <FeatureEditor 
                features={formValues.features}
                onChange={handleFeaturesChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={savePlanMutation.isPending}>
              {savePlanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {plan ? 'Update' : 'Create'} Plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
