
import React from "react";
import AdminLayout from "@/components/AdminLayout";
import { ThemeCustomization } from "@/components/admin/ThemeCustomization";

export default function AdminThemeSettings() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Theme Settings</h1>
        <p className="text-muted-foreground mt-2">Customize your application's appearance</p>
      </div>

      <ThemeCustomization />
    </AdminLayout>
  );
}
