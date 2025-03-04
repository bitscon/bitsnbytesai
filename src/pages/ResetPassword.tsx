
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword, isLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a hash parameter in the URL, which means this is a valid reset
    const hash = window.location.hash;
    if (!hash || !hash.includes('type=recovery')) {
      // If there's no recovery token, redirect to forgot password
      navigate('/forgot-password');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    const { error } = await updatePassword(password);
    
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <a href="/" className="flex items-center justify-center space-x-2 mb-8">
          <span className="text-xl font-bold text-brand-blue">bits & bytes</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue">AI</span>
        </a>
        
        <Card className="w-full animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Create a new password</CardTitle>
            <CardDescription className="text-center">
              Your new password must be different from previously used passwords
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-brand-blue hover:bg-brand-blue/90" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update password"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Remember your old password?{" "}
              <a
                onClick={() => navigate("/login")}
                className="text-primary hover:underline cursor-pointer"
              >
                Sign in
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
