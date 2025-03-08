
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onChange: (value: string) => void;
}

export function SearchBar({ searchTerm, onChange }: SearchBarProps) {
  return (
    <div className="relative flex-1 w-full mb-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 w-full h-10"
        />
      </div>
    </div>
  );
}
