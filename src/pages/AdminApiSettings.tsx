
import React from "react";
import AdminLayout from "@/components/AdminLayout";
import { ApiSettingsPanel } from "@/components/admin/ApiSettingsPanel";
import { KeyRound } from "lucide-react";

export default function AdminApiSettings() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">API Settings</h1>
        </div>
        <p className="text-muted-foreground mt-2">
          Manage global API settings and configurations for your application
        </p>
      </div>

      <div className="space-y-6">
        <ApiSettingsPanel />
      </div>
    </AdminLayout>
  );
}
