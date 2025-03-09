
import React from "react";
import AdminLayout from "@/components/AdminLayout";
import { UserManagementHeader } from "@/components/admin/users/UserManagementHeader";
import { UsersList } from "@/components/admin/users/UsersList";
import { AdminUsersList } from "@/components/admin/users/AdminUsersList";
import { CreateUserForm } from "@/components/admin/users/CreateUserForm";
import { CreateAdminForm } from "@/components/admin/users/CreateAdminForm";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminUsers() {
  const {
    adminUsers,
    regularUsers,
    isLoading,
    isAdding,
    isPromoting,
    error,
    success,
    newUserEmail,
    newUserName,
    newUserPassword,
    selectedUserId,
    setNewUserEmail,
    setNewUserName,
    setNewUserPassword,
    addAdminUser,
    createRegularUser,
    promoteToAdmin
  } = useAdminUsers();

  return (
    <AdminLayout>
      <UserManagementHeader error={error} success={success} />

      <Tabs defaultValue="users" className="mb-6">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="admins">Administrators</TabsTrigger>
          <TabsTrigger value="create">Create User</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UsersList 
            regularUsers={regularUsers}
            isLoading={isLoading}
            isPromoting={isPromoting}
            selectedUserId={selectedUserId}
            promoteToAdmin={promoteToAdmin}
          />
        </TabsContent>
        
        <TabsContent value="admins">
          <AdminUsersList 
            adminUsers={adminUsers}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="create">
          <CreateUserForm
            createRegularUser={createRegularUser}
            isAdding={isAdding}
            newUserEmail={newUserEmail}
            setNewUserEmail={setNewUserEmail}
            newUserName={newUserName}
            setNewUserName={setNewUserName}
            newUserPassword={newUserPassword}
            setNewUserPassword={setNewUserPassword}
          />
          
          <CreateAdminForm
            addAdminUser={addAdminUser}
            isAdding={isAdding}
            newUserEmail={newUserEmail}
            setNewUserEmail={setNewUserEmail}
          />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
