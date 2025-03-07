
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
}

export function PromptTextArea({
  id,
  label,
  name,
  value,
  placeholder,
  rows = 5,
  required = false,
  onChange
}: PromptTextAreaProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
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
