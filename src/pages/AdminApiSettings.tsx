
import React from "react";
import AdminLayout from "@/components/AdminLayout";
import { ApiSettingsPanel } from "@/components/admin/ApiSettingsPanel";

export default function AdminApiSettings() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">API Settings</h1>
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
