
import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { SubscriptionPlan } from '@/types/subscription';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SubscriptionPlansListProps {
  plans: SubscriptionPlan[];
  onEdit: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
  isDeleting: boolean;
}

export default function SubscriptionPlansList({
  plans,
  onEdit,
  onDelete,
  isDeleting
}: SubscriptionPlansListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Monthly Price</TableHead>
            <TableHead>Yearly Price</TableHead>
            <TableHead>Stripe IDs</TableHead>
            <TableHead>Features</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No subscription plans found. Create one to get started.
              </TableCell>
            </TableRow>
          ) : (
            plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>
                  <Badge variant={plan.tier === 'free' ? 'outline' : 'default'}>
                    {plan.tier}
                  </Badge>
                </TableCell>
                <TableCell>${plan.price_monthly}</TableCell>
                <TableCell>${plan.price_yearly}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {plan.stripe_price_id_monthly ? (
                    <div className="text-xs">
                      <div className="truncate">
                        <span className="font-semibold">Monthly:</span> {plan.stripe_price_id_monthly}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold">Yearly:</span> {plan.stripe_price_id_yearly || 'N/A'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">Not synced with Stripe</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[300px]">
                  {plan.features && typeof plan.features === 'object' ? (
                    <div className="text-xs">
                      {Object.values(plan.features).map((feature: any, index) => (
                        <div key={index} className="truncate">
                          • {feature.description || feature}
                        </div>
                      )).slice(0, 3)}
                      {Object.values(plan.features).length > 3 && (
                        <div className="text-muted-foreground">
                          +{Object.values(plan.features).length - 3} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">No features</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onDelete(plan)}
                      disabled={isDeleting || plan.tier === 'free'}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
