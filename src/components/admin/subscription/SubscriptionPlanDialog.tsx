import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { X, Plus, Trash } from 'lucide-react';
import { SubscriptionPlan, SubscriptionTier } from '@/types/subscription';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface SubscriptionPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SubscriptionPlan | null;
  onClose: () => void;
}

const subscriptionTiers: SubscriptionTier[] = ['free', 'pro', 'premium', 'enterprise'];

const planFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tier: z.enum(['free', 'pro', 'premium', 'enterprise']),
  price_monthly: z.coerce.number().min(0, 'Price must be 0 or higher'),
  price_yearly: z.coerce.number().min(0, 'Price must be 0 or higher'),
  features: z.array(z.object({
    description: z.string().min(1, 'Feature description is required')
  })).min(1, 'At least one feature is required'),
  stripe_price_id_monthly: z.string().optional(),
  stripe_price_id_yearly: z.string().optional()
});

type PlanFormValues = z.infer<typeof planFormSchema>;

export default function SubscriptionPlanDialog({ 
  open, 
  onOpenChange, 
  plan, 
  onClose 
}: SubscriptionPlanDialogProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!plan;
  
  // Transform features object to array if needed
  const getInitialFeatures = () => {
    if (!plan?.features) return [{ description: '' }];
    
    if (Array.isArray(plan.features)) {
      return plan.features.map(f => typeof f === 'object' && f.description ? f : { description: String(f) });
    }
    
    if (typeof plan.features === 'object' && !Array.isArray(plan.features)) {
      return Object.entries(plan.features).map(([_, value]) => {
        if (typeof value === 'string') {
          return { description: value };
        }
        if (typeof value === 'object' && value && 'description' in value) {
          return { description: String(value.description) };
        }
        return { description: '' };
      });
    }
    
    return [{ description: '' }];
  };
  
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: plan?.name || '',
      tier: plan?.tier || 'free',
      price_monthly: plan?.price_monthly || 0,
      price_yearly: plan?.price_yearly || 0,
      features: getInitialFeatures(),
      stripe_price_id_monthly: plan?.stripe_price_id_monthly || '',
      stripe_price_id_yearly: plan?.stripe_price_id_yearly || ''
    }
  });
  
  useEffect(() => {
    if (open) {
      form.reset({
        name: plan?.name || '',
        tier: plan?.tier || 'free',
        price_monthly: plan?.price_monthly || 0,
        price_yearly: plan?.price_yearly || 0,
        features: getInitialFeatures(),
        stripe_price_id_monthly: plan?.stripe_price_id_monthly || '',
        stripe_price_id_yearly: plan?.stripe_price_id_yearly || ''
      });
    }
  }, [open, plan, form]);
  
  const savePlanMutation = useMutation({
    mutationFn: async (values: PlanFormValues) => {
      const featuresObject: Record<string, { description: string }> = {};
      values.features.forEach((feature, index) => {
        featuresObject[`feature${index + 1}`] = { description: feature.description };
      });
      
      const planData = {
        name: values.name,
        tier: values.tier,
        price_monthly: values.price_monthly,
        price_yearly: values.price_yearly,
        features: featuresObject,
        stripe_price_id_monthly: values.stripe_price_id_monthly || null,
        stripe_price_id_yearly: values.stripe_price_id_yearly || null
      };
      
      if (isEditMode && plan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', plan.id);
        
        if (error) throw new Error(error.message);
        return 'updated';
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert([planData]);
        
        if (error) throw new Error(error.message);
        return 'created';
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPlans'] });
      toast({
        title: `Subscription plan ${result}`,
        description: `The subscription plan has been ${result} successfully.`
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error saving subscription plan',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  });
  
  const onSubmit = (values: PlanFormValues) => {
    savePlanMutation.mutate(values);
  };
  
  const addFeature = () => {
    const features = form.getValues('features') || [];
    form.setValue('features', [...features, { description: '' }]);
  };
  
  const removeFeature = (index: number) => {
    const features = form.getValues('features');
    const newFeatures = features.filter((_, i) => i !== index);
    form.setValue('features', newFeatures);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Create'} Subscription Plan</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the details of this subscription plan.' 
              : 'Create a new subscription plan for your customers.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Pro Plan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isEditMode && plan?.tier === 'free'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subscriptionTiers.map((tier) => (
                        <SelectItem key={tier} value={tier}>
                          {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price_monthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price_yearly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yearly Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Features</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addFeature}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Feature
                </Button>
              </div>
              
              {form.watch('features').map((_, index) => (
                <div key={index} className="flex gap-2">
                  <FormField
                    control={form.control}
                    name={`features.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Feature description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFeature(index)}
                    disabled={form.watch('features').length <= 1}
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="pt-4 space-y-4">
              <Label className="text-sm font-medium">Stripe Integration (Optional)</Label>
              
              <FormField
                control={form.control}
                name="stripe_price_id_monthly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Monthly Price ID</FormLabel>
                    <FormControl>
                      <Input placeholder="price_xxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="stripe_price_id_yearly"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Yearly Price ID</FormLabel>
                    <FormControl>
                      <Input placeholder="price_xxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={savePlanMutation.isPending}>
                {savePlanMutation.isPending ? 'Saving...' : isEditMode ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
