import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserSettingsForm } from "./settings-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";

export default function SettingsView() {
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => getCurrentUser(),
  });

  const handleEditSettings = () => {
    setCurrentUser(user);
    setOpen(true);
  };

  return (
    <div className="py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Settings</h1>
        <Button onClick={handleEditSettings}>Edit Settings</Button>
      </div>

      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              View and manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Name
                </h3>
                <p>{user.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Email
                </h3>
                <p>{user.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Role
                </h3>
                <p>{(user as { role?: string }).role}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Status
                </h3>
                <p>Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!user && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Unable to load user details.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <UserSettingsForm
        open={open}
        onOpenChange={setOpen}
        // initialData={currentUser}
        // onSuccess={(updatedUser) => {
        //   console.log("User updated:", updatedUser);
        // }}
      />
    </div>
  );
}
