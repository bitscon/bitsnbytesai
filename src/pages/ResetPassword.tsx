
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword, isLoading } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validResetLink, setValidResetLink] = useState(false);

  useEffect(() => {
    // Check if we have a hash parameter in the URL, which means this is a valid reset
    const hash = window.location.hash;
    
    if (!hash) {
      console.error("No hash found in URL");
      setValidResetLink(false);
      toast({
        title: "Invalid reset link",
        description: "The password reset link is invalid or has expired. Please request a new one.",
        variant: "destructive",
      });
    } else if (!hash.includes('type=recovery')) {
      console.error("No recovery token found in hash", hash);
      setValidResetLink(false);
      toast({
        title: "Invalid reset link",
        description: "The password reset link is invalid. Please request a new one.",
        variant: "destructive",
      });
    } else {
      console.log("Valid recovery hash found");
      setValidResetLink(true);
    }
  }, [toast, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsSubmitting(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }
    
    try {
      const { error } = await updatePassword(password);
      
      if (error) {
        console.error("Password reset error:", error);
        setError(error.message || "Failed to update password");
        toast({
          title: "Password Reset Failed",
          description: error.message || "Failed to update password. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated. You can now log in with your new password.",
        });
        navigate('/login');
      }
    } catch (err) {
      console.error("Password reset exception:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!validResetLink) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md">
          <Card className="w-full animate-fade-in">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Invalid Reset Link</CardTitle>
              <CardDescription className="text-center">
                The password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <Button onClick={() => navigate("/forgot-password")} className="mt-4">
                Request New Reset Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              Your new password must be at least 6 characters
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-brand-blue hover:bg-brand-blue/90" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update password"
                )}
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
