
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ApiSetting {
  key_name: string;
  key_value: string;
  description: string | null;
  has_value: boolean;
}

export function ApiSettingsPanel() {
  const [settings, setSettings] = useState<ApiSetting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('admin-api-settings', {
          method: 'GET',
        });

        if (error) {
          throw new Error(error.message);
        }

        setSettings(data.settings || []);
      } catch (error) {
        console.error('Error fetching API settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load API settings. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();

    // Set up subscription for real-time updates
    const subscription = supabase
      .channel('api_settings_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'api_settings' 
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [toast]);

  const handleToggleChange = async (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    
    setIsSaving(prev => ({ ...prev, [key]: true }));
    
    try {
      const { error } = await supabase.functions.invoke('admin-api-settings', {
        method: 'POST',
        body: { key_name: key, key_value: newValue },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Success',
        description: `Setting "${key}" updated successfully.`,
      });
      
      // Update local state immediately
      setSettings(settings.map(setting => 
        setting.key_name === key 
          ? { ...setting, key_value: newValue } 
          : setting
      ));
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      toast({
        title: 'Error',
        description: `Failed to update setting. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Settings</CardTitle>
        <CardDescription>
          Configure global settings for your application
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : settings.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No API settings found.</p>
        ) : (
          <div className="space-y-6">
            {settings.map((setting) => (
              <div key={setting.key_name} className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{setting.key_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                  {setting.description && (
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  )}
                </div>
                <div className="flex items-center">
                  {isSaving[setting.key_name] ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {setting.key_name === 'prompt_explanations_enabled' && (
                    <Switch
                      checked={setting.key_value === 'true'}
                      onCheckedChange={() => handleToggleChange(setting.key_name, setting.key_value)}
                      disabled={isSaving[setting.key_name]}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t px-6 py-4 bg-muted/50">
        <p className="text-xs text-muted-foreground">
          These settings control global functionality across your application.
          Changes take effect immediately.
        </p>
      </CardFooter>
    </Card>
  );
}
