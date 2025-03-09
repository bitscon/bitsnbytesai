
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Save, EyeOff, Eye, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { ApiSetting } from './types';
import { ApiKeyExpiryDate } from './ApiKeyExpiryDate';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO, isValid } from 'date-fns';

interface SettingFieldProps {
  setting: ApiSetting;
  editableValue: string;
  isSaving: boolean;
  showSecret: boolean;
  onInputChange: (value: string) => void;
  onSave: () => void;
  onToggleChange: () => void;
  onToggleShowSecret: () => void;
  onExpiryDateChange?: (key: string, date: Date | undefined) => void;
  onRenewKey?: (key: string) => void;
  formatSettingName: (name: string) => string;
}

export function SettingField({
  setting,
  editableValue,
  isSaving,
  showSecret,
  onInputChange,
  onSave,
  onToggleChange,
  onToggleShowSecret,
  onExpiryDateChange,
  onRenewKey,
  formatSettingName
}: SettingFieldProps) {
  const isSecret = setting.is_secret || 
                   setting.key_name.includes('SECRET') || 
                   setting.key_name.includes('KEY') || 
                   setting.key_name.includes('PASSWORD');
  const isToggle = setting.key_value === 'true' || setting.key_value === 'false';
  
  const isExpired = setting.expires_at && 
                    isValid(parseISO(setting.expires_at)) && 
                    parseISO(setting.expires_at) < new Date();
  
  const isExpiringSoon = setting.expires_at && 
                         isValid(parseISO(setting.expires_at)) && 
                         !isExpired && 
                         parseISO(setting.expires_at) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  if (isToggle) {
    return (
      <div className="flex items-center gap-2">
        <Switch
          checked={setting.key_value === 'true'}
          onCheckedChange={onToggleChange}
          disabled={isSaving}
        />
        <Label>{setting.key_value === 'true' ? 'Enabled' : 'Disabled'}</Label>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type={isSecret && !showSecret ? 'password' : 'text'}
            value={editableValue}
            onChange={(e) => onInputChange(e.target.value)}
            className={cn(
              "pr-10",
              setting.has_value ? 'border-green-200 dark:border-green-800' : '',
              isExpired ? 'border-red-200 dark:border-red-800' : '',
              isExpiringSoon && !isExpired ? 'border-amber-200 dark:border-amber-800' : ''
            )}
            placeholder={`Enter ${formatSettingName(setting.key_name)}`}
          />
          {setting.has_value && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          )}
          {isExpired && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This API key has expired!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isExpiringSoon && !isExpired && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This API key is expiring soon!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {isSecret && (
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={onToggleShowSecret}
            className="flex-shrink-0"
          >
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
        <Button
          variant={setting.has_value ? "secondary" : "default"}
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="flex-shrink-0 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save
        </Button>
      </div>
      
      {isSecret && onExpiryDateChange && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ApiKeyExpiryDate 
              expiryDate={setting.expires_at}
              onExpiryDateChange={(date) => onExpiryDateChange(setting.key_name, date)}
              disabled={isSaving}
            />
          </div>
          {onRenewKey && (
            <Button
              variant="outline"
              size="sm"
              disabled={isSaving || !setting.has_value}
              onClick={() => onRenewKey(setting.key_name)}
              className="flex-shrink-0"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Renew
            </Button>
          )}
        </div>
      )}
      
      {setting.last_renewed_at && (
        <p className="text-xs text-muted-foreground">
          Last renewed: {format(parseISO(setting.last_renewed_at), 'PPP')}
        </p>
      )}
      
      {setting.environment && (
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs px-2 py-1 rounded-full",
            setting.environment === 'production' 
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          )}>
            {setting.environment.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}

// Utility function for class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
