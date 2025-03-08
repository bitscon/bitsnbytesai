
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PromptTextAreaProps {
  id: string;
  label: string;
  name: string;
  value: string;
  placeholder: string;
  rows?: number;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  description?: string;
}

export function PromptTextArea({
  id,
  label,
  name,
  value,
  placeholder,
  rows = 5,
  required = false,
  onChange,
  description
}: PromptTextAreaProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id}>{label}</Label>
        {required && <span className="text-xs text-red-500">*Required</span>}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <Textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
      />
    </div>
  );
}
