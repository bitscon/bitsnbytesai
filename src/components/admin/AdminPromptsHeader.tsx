
import React from "react";

interface AdminPromptsHeaderProps {
  title: string;
  description: string;
}

export function AdminPromptsHeader({ title, description }: AdminPromptsHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">{description}</p>
    </div>
  );
}
