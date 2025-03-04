
import React from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Welcome to your Dashboard</h1>
          
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border mb-8">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-2">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Account ID:</strong> {user?.id}</p>
              <p><strong>Verified:</strong> {user?.email_confirmed_at ? 'Yes' : 'No'}</p>
            </div>
            <div className="mt-6">
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Go to Home
              </Button>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <h2 className="text-xl font-semibold mb-4">Your Prompts</h2>
            <p className="text-muted-foreground">
              You don't have any prompts yet. Purchase our premium content to access over 100 expert-crafted AI prompts.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
