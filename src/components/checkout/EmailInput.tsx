
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailInputProps {
  email: string;
  setEmail: (email: string) => void;
  emailError: string;
}

export function EmailInput({ email, setEmail, emailError }: EmailInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email Address</Label>
      <Input
        id="email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={emailError ? "border-red-500" : ""}
      />
      {emailError && <p className="text-sm text-red-500">{emailError}</p>}
    </div>
  );
}
