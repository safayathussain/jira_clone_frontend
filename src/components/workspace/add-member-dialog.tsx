"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { useStore } from "@/store";
import { UserPlus, Search, Trash2, Shield, Check, Users, Lock } from "lucide-react";

interface Member {
  id: number;
  workspace_id: number;
  user_id: number;
  role: string;
  created_at: string;
  user?: {
    id: number;
    email: string;
    username?: string;
    full_name?: string;
  };
}

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: number;
  workspaceName?: string;
  onMembersUpdated?: () => void;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
  onMembersUpdated,
}: AddMemberDialogProps) {
  const { user: currentUser } = useStore();

  const [members, setMembers] = useState<Member[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("member");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Derived permission — only available after members load
  const currentUserMember = members.find((m) => m.user_id === currentUser?.id);
  const currentUserRole = currentUserMember?.role ?? "viewer";
  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  const loadData = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      setError("");

      const [membersRes, usersRes] = await Promise.all([
        api.get(`/workspaces/${workspaceId}/members`),
        api.get("/users/"),
      ]);

      const usersMap: Record<number, any> = {};
      usersRes.data.forEach((u: any) => {
        usersMap[u.id] = u;
      });

      const enrichedMembers: Member[] = membersRes.data.map((m: any) => ({
        ...m,
        user: usersMap[m.user_id] || {
          id: m.user_id,
          email: `User #${m.user_id}`,
          full_name: `User #${m.user_id}`,
        },
      }));

      setMembers(enrichedMembers);
      setAllUsers(usersRes.data);
    } catch (err: any) {
      console.error("Failed to load members", err);
      setError(getErrorMessage(err, "Failed to load members"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSelectedUserId(null);
      setSearch("");
      setError("");
      setSuccess("");
      loadData();
    }
  }, [open, workspaceId]);

  const memberUserIds = new Set(members.map((m) => m.user_id));
  const availableUsers = allUsers.filter(
    (u) =>
      !memberUserIds.has(u.id) &&
      (u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError("Please select a user to add");
      return;
    }
    if (!canManage) {
      setError("Only owners and admins can add members.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await api.post(`/workspaces/${workspaceId}/members`, {
        user_id: selectedUserId,
        role: selectedRole,
      });

      setSuccess("Member added successfully!");
      setSelectedUserId(null);
      setSearch("");
      await loadData();
      if (onMembersUpdated) onMembersUpdated();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to add member"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!canManage) return;
    try {
      setError("");
      await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
      await loadData();
      if (onMembersUpdated) onMembersUpdated();
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to remove member"));
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!canManage) return;
    try {
      setError("");
      await api.patch(`/workspaces/${workspaceId}/members/${userId}`, {
        role: newRole,
      });
      await loadData();
      if (onMembersUpdated) onMembersUpdated();
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to update member role"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="shrink-0 pb-2 border-b">
          <div className="flex items-center gap-2 text-primary">
            <Users size={20} />
            <DialogTitle>Workspace Members</DialogTitle>
          </div>
          <DialogDescription>
            Manage who has access to {workspaceName ? `"${workspaceName}"` : "this workspace"}.
            {!canManage && (
              <span className="ml-1 text-yellow-400 font-medium">
                (View only — only owners &amp; admins can make changes)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1">
          {/* Add member form — owner/admin only */}
          {canManage ? (
            <form onSubmit={handleAddMember} className="p-4 rounded-lg bg-muted/30 border border-white/5 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <UserPlus size={16} className="text-primary" />
                Add New Member
              </h4>

              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search user by name, email, or username..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>

                {search && availableUsers.length > 0 && (
                  <div className="max-h-36 overflow-y-auto rounded-md border bg-popover p-1 shadow-md space-y-1">
                    {availableUsers.map((u) => {
                      const isSelected = selectedUserId === u.id;
                      const uInitials = (u.full_name || u.username || u.email || "U")
                        .substring(0, 2)
                        .toUpperCase();
                      return (
                        <div
                          key={u.id}
                          onClick={() => setSelectedUserId(u.id)}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-xs ${
                            isSelected
                              ? "bg-primary/20 text-primary font-medium"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-[10px] bg-primary/10">
                                {uInitials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{u.full_name || u.username}</p>
                              <p className="text-[10px] text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                          {isSelected && <Check size={14} className="text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {search && availableUsers.length === 0 && (
                  <p className="text-xs text-muted-foreground py-1 text-center">
                    No new users found matching &quot;{search}&quot;
                  </p>
                )}
              </div>

              {selectedUserId && (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Selected:</span>
                    <Badge variant="secondary" className="font-normal">
                      {allUsers.find((u) => u.id === selectedUserId)?.email}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="h-8 rounded-md border border-input bg-background text-foreground px-2 text-xs"
                    >
                      <option value="member" className="bg-background text-foreground">Member</option>
                      <option value="admin" className="bg-background text-foreground">Admin</option>
                      <option value="viewer" className="bg-background text-foreground">Viewer</option>
                    </select>

                    <Button type="submit" size="sm" disabled={submitting} className="h-8 text-xs font-semibold">
                      {submitting ? "Adding..." : "Add to Workspace"}
                    </Button>
                  </div>
                </div>
              )}

              {error && <p className="text-xs font-medium text-destructive">{error}</p>}
              {success && (
                <p className="text-xs font-medium text-green-500 flex items-center gap-1">
                  <Check size={12} /> {success}
                </p>
              )}
            </form>
          ) : (
            <div className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 flex items-center gap-2 text-xs text-yellow-400">
              <Lock size={14} />
              You have viewer access. Contact a workspace owner or admin to manage members.
            </div>
          )}

          {/* Members list */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Current Members ({members.length})
            </h4>

            {loading ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Loading members...</p>
            ) : members.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No members found</p>
            ) : (
              <div className="divide-y divide-white/5 rounded-lg border border-white/5 bg-card/40">
                {members.map((m) => {
                  const mInitials = (m.user?.full_name || m.user?.username || m.user?.email || "U")
                    .substring(0, 2)
                    .toUpperCase();
                  const isSelf = currentUser?.id === m.user_id;

                  return (
                    <div key={m.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {mInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1.5">
                            {m.user?.full_name || m.user?.username || m.user?.email}
                            {isSelf && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/30 text-primary">
                                You
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {m.role === "owner" ? (
                          <Badge variant="secondary" className="text-xs capitalize font-medium">
                            <Shield size={12} className="mr-1 text-yellow-400" /> Owner
                          </Badge>
                        ) : canManage ? (
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
                            className="h-7 rounded border border-input bg-background text-foreground px-2 text-xs capitalize cursor-pointer focus:outline-none"
                          >
                            <option value="admin" className="bg-background text-foreground">Admin</option>
                            <option value="member" className="bg-background text-foreground">Member</option>
                            <option value="viewer" className="bg-background text-foreground">Viewer</option>
                          </select>
                        ) : (
                          <Badge variant="outline" className="text-xs capitalize font-medium border-white/10">
                            {m.role}
                          </Badge>
                        )}

                        {canManage && m.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveMember(m.user_id)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                            title="Remove member"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
