"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/store";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/utils";
import { User, Building, Shield, Check, LogOut, Users, Trash2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddMemberDialog } from "@/components/workspace/add-member-dialog";

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, currentWorkspace, setCurrentWorkspace, workspaces, setWorkspaces, logout } = useStore();

  // Profile Form state
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Workspace Form state
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace?.name || "");
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [workspaceSuccess, setWorkspaceSuccess] = useState(false); 
  const [workspaceError, setWorkspaceError] = useState("");
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user]);

  useEffect(() => {
    if (currentWorkspace?.name) {
      setWorkspaceName(currentWorkspace.name);
    }
  }, [currentWorkspace]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess(false);

    try {
      setProfileSaving(true);
      const res = await api.patch("/users/me", {
        full_name: fullName.trim() || null,
      });
      setUser(res.data);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(getErrorMessage(err, "Failed to update profile"));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;

    setWorkspaceError("");
    setWorkspaceSuccess(false);

    if (!workspaceName.trim()) {
      setWorkspaceError("Workspace name cannot be empty");
      return;
    }

    try {
      setWorkspaceSaving(true);
      const res = await api.patch(`/workspaces/${currentWorkspace.id}`, {
        name: workspaceName.trim(),
      });

      const updated = res.data;
      setCurrentWorkspace(updated);
      setWorkspaces(workspaces.map((w) => (w.id === updated.id ? updated : w)));
      setWorkspaceSuccess(true);
      setTimeout(() => setWorkspaceSuccess(false), 3000);
    } catch (err: any) {
      setWorkspaceError(getErrorMessage(err, "Failed to update workspace"));
    } finally {
      setWorkspaceSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/login");
  };

  const handleWorkspaceDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;
    
    if (deleteInput !== currentWorkspace.name) {
      setDeleteError("Workspace name does not match.");
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError("");
      await api.delete(`/workspaces/${currentWorkspace.id}`);
      
      // Update store
      const updatedWorkspaces = workspaces.filter(w => w.id !== currentWorkspace.id);
      setWorkspaces(updatedWorkspaces);
      setCurrentWorkspace(updatedWorkspaces.length > 0 ? updatedWorkspaces[0] : null);
      
      setDeleteDialogOpen(false);
      router.push("/dashboard");
    } catch (err: any) {
      setDeleteError(getErrorMessage(err, "Failed to delete workspace"));
    } finally {
      setIsDeleting(false);
    }
  };

  const initials = (user?.full_name || user?.username || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings, profile preferences, and workspace configuration.
        </p>
      </div>

      <div className="grid gap-6">
        {/* User Profile Card */}
        <Card className="border-white/10 bg-card/60 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary">
              <User size={20} />
              <CardTitle>Profile Details</CardTitle>
            </div>
            <CardDescription>
              Your personal information and account identity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{user?.full_name || "Anonymous User"}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">@{user?.username || "user"}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/5 text-primary border-primary/20">
                      Active Member
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted/50 text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              {profileError && <p className="text-xs font-medium text-destructive">{profileError}</p>}
              {profileSuccess && (
                <p className="text-xs font-medium text-green-500 flex items-center gap-1.5">
                  <Check size={14} /> Profile updated successfully!
                </p>
              )}

              <Button type="submit" disabled={profileSaving} className="font-medium">
                {profileSaving ? "Saving..." : "Save Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Workspace Card */}
        {currentWorkspace && (
          <Card className="border-white/10 bg-card/60 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Building size={20} />
                <CardTitle>Workspace Configuration</CardTitle>
              </div>
              <CardDescription>
                Settings for the active workspace: <span className="font-medium text-foreground">{currentWorkspace.name}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateWorkspace} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="workspace-name">Workspace Name</Label>
                    <Input
                      id="workspace-name"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      placeholder="e.g. Engineering Team"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="workspace-slug">URL Slug</Label>
                    <Input
                      id="workspace-slug"
                      value={currentWorkspace.slug}
                      disabled
                      className="bg-muted/50 text-muted-foreground cursor-not-allowed"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Slugs are immutable identifiers used in URLs.
                    </p>
                  </div>
                </div>

                {workspaceError && <p className="text-xs font-medium text-destructive">{workspaceError}</p>}
                {workspaceSuccess && (
                  <p className="text-xs font-medium text-green-500 flex items-center gap-1.5">
                    <Check size={14} /> Workspace updated successfully!
                  </p>
                )}

                <Button type="submit" disabled={workspaceSaving} className="font-medium">
                  {workspaceSaving ? "Updating..." : "Save Workspace"}
                </Button>
              </form>

              <div className="pt-6 mt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <Users size={16} className="text-primary" /> Workspace Members
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Invite people to this workspace and manage access permissions.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMembersDialogOpen(true)}
                  className="gap-2 shrink-0 text-xs"
                >
                  <Users size={14} /> Manage Members
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        {currentWorkspace && (
          <Card className="border-destructive/20 bg-destructive/5 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle size={20} />
                <CardTitle>Danger Zone</CardTitle>
              </div>
              <CardDescription>
                Irreversible and destructive actions for this workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-destructive/10 pt-4">
              <div>
                <p className="text-sm font-medium">Delete Workspace</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete this workspace, all of its boards, and issues. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteInput("");
                  setDeleteError("");
                  setDeleteDialogOpen(true);
                }}
                className="gap-2 shrink-0"
              >
                <Trash2 size={16} />
                Delete Workspace
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Security & Session Card */}
        <Card className="border-white/10 bg-card/60 backdrop-blur-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <Shield size={20} />
              <CardTitle>Account & Session</CardTitle>
            </div>
            <CardDescription>
              Control your active sessions and log out of the current device.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Active Session</p>
              <p className="text-xs text-muted-foreground">
                You are currently signed in as {user?.email}
              </p>
            </div>
            <Button variant="destructive" onClick={handleLogout} className="gap-2">
              <LogOut size={16} />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {currentWorkspace && (
        <AddMemberDialog
          open={membersDialogOpen}
          onOpenChange={setMembersDialogOpen}
          workspaceId={currentWorkspace.id}
          workspaceName={currentWorkspace.name}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle size={24} />
              <DialogTitle>Delete Workspace</DialogTitle>
            </div>
            <DialogDescription>
              This action is <span className="font-semibold text-foreground">irreversible</span>. It will permanently delete the{" "}
              <span className="font-semibold text-foreground">{currentWorkspace?.name}</span> workspace, its members, and all issues.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWorkspaceDelete} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                Please type <span className="font-semibold select-all">{currentWorkspace?.name}</span> to confirm.
              </Label>
              <Input
                id="confirm-delete"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={currentWorkspace?.name}
                className="border-destructive/30 focus-visible:ring-destructive"
              />
            </div>
            {deleteError && <p className="text-xs font-medium text-destructive">{deleteError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={deleteInput !== currentWorkspace?.name || isDeleting}
              >
                {isDeleting ? "Deleting..." : "I understand, delete workspace"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
