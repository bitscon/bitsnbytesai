
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const { error } = await resetPassword(email);
    
    if (error) {
      setError(error.message);
    } else {
      setEmailSent(true);
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
            <CardTitle className="text-2xl font-bold text-center">Reset your password</CardTitle>
            <CardDescription className="text-center">
              Enter your email and we'll send you a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="bg-green-50 text-green-800 p-4 rounded-md">
                  Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
                </div>
                <Button
                  onClick={() => navigate("/login")}
                  className="mt-4"
                  variant="outline"
                >
                  Return to login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-brand-blue hover:bg-brand-blue/90" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
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
