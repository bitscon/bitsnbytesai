
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Plus, EyeOff, Eye } from 'lucide-react';

interface ApiSetting {
  key_name: string;
  key_value: string;
  description: string | null;
  has_value: boolean;
}

interface GroupedSettings {
  [key: string]: ApiSetting[];
}

export function ApiSettingsPanel() {
  const [settings, setSettings] = useState<ApiSetting[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [editableValues, setEditableValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
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
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-api-settings', {
        method: 'GET',
      });

      if (error) {
        throw new Error(error.message);
      }

      const fetchedSettings = data.settings || [];
      setSettings(fetchedSettings);
      
      // Initialize editable values with current values
      const initialValues: Record<string, string> = {};
      fetchedSettings.forEach((setting: ApiSetting) => {
        initialValues[setting.key_name] = setting.key_value;
      });
      setEditableValues(initialValues);
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
      setEditableValues(prev => ({...prev, [key]: newValue}));
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

  const handleInputChange = (key: string, value: string) => {
    setEditableValues(prev => ({...prev, [key]: value}));
  };

  const handleSaveSetting = async (key: string) => {
    const newValue = editableValues[key];
    
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
          ? { ...setting, key_value: newValue, has_value: !!newValue } 
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

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({...prev, [key]: !prev[key]}));
  };

  // Group settings by category (based on naming convention)
  const groupSettings = (settings: ApiSetting[]): GroupedSettings => {
    const grouped: GroupedSettings = {
      'PayPal': [],
      'Stripe': [],
      'General': []
    };
    
    settings.forEach(setting => {
      if (setting.key_name.startsWith('PAYPAL_')) {
        grouped['PayPal'].push(setting);
      } else if (setting.key_name.startsWith('STRIPE_')) {
        grouped['Stripe'].push(setting);
      } else {
        grouped['General'].push(setting);
      }
    });
    
    return grouped;
  };

  const groupedSettings = groupSettings(settings);

  // Function to render a setting input based on its type
  const renderSettingField = (setting: ApiSetting) => {
    const isSecret = setting.key_name.includes('SECRET') || setting.key_name.includes('KEY');
    const isToggle = setting.key_value === 'true' || setting.key_value === 'false';
    
    if (isToggle) {
      return (
        <Switch
          checked={setting.key_value === 'true'}
          onCheckedChange={() => handleToggleChange(setting.key_name, setting.key_value)}
          disabled={isSaving[setting.key_name]}
        />
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <Input
          type={isSecret && !showSecrets[setting.key_name] ? 'password' : 'text'}
          value={editableValues[setting.key_name] || ''}
          onChange={(e) => handleInputChange(setting.key_name, e.target.value)}
          className="flex-1"
          placeholder={`Enter ${setting.key_name}`}
        />
        {isSecret && (
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => toggleShowSecret(setting.key_name)}
          >
            {showSecrets[setting.key_name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSaveSetting(setting.key_name)}
          disabled={isSaving[setting.key_name]}
        >
          {isSaving[setting.key_name] ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
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
          <div className="space-y-8">
            {Object.entries(groupedSettings).map(([category, categorySettings]) => 
              categorySettings.length > 0 && (
                <div key={category} className="space-y-4">
                  <h2 className="text-lg font-semibold border-b pb-2">{category}</h2>
                  <div className="space-y-6">
                    {categorySettings.map((setting) => (
                      <div key={setting.key_name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{setting.key_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                            {setting.description && (
                              <p className="text-sm text-muted-foreground">{setting.description}</p>
                            )}
                          </div>
                        </div>
                        {renderSettingField(setting)}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
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
