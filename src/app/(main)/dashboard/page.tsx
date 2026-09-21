"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Plus, FolderKanban, Users, Trash2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { AddMemberDialog } from "@/components/workspace/add-member-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Workspace } from "@/store";

export default function DashboardPage() {
  const { workspaces, setWorkspaces, currentWorkspace, setCurrentWorkspace } = useStore();
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [membersWorkspace, setMembersWorkspace] = useState<Workspace | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchWorkspaces() {
      try {
        const res = await api.get("/workspaces");
        setWorkspaces(res.data);
      } catch (err) {
        console.error("Failed to fetch workspaces", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkspaces();
  }, [setWorkspaces]);

  const handleWorkspaceSelect = (workspace: any) => {
    setCurrentWorkspace(workspace);
    router.push(`/board?workspace=${workspace.slug}`);
  };

  const openDeleteDialog = (e: React.MouseEvent, workspace: Workspace) => {
    e.stopPropagation();
    setDeleteTarget(workspace);
    setDeleteInput("");
    setDeleteError("");
  };

  const handleDeleteWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;

    if (deleteInput !== deleteTarget.name) {
      setDeleteError("Workspace name does not match.");
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError("");
      await api.delete(`/workspaces/${deleteTarget.id}`);

      const updatedWorkspaces = workspaces.filter(w => w.id !== deleteTarget.id);
      setWorkspaces(updatedWorkspaces);

      // If the deleted workspace was the active one, clear it
      if (currentWorkspace?.id === deleteTarget.id) {
        setCurrentWorkspace(updatedWorkspaces.length > 0 ? updatedWorkspaces[0] : null);
      }

      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError("Failed to delete workspace. Make sure you are the owner.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground mt-1">
            Select a workspace to view your boards and issues.
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="shrink-0 gap-2 font-medium"
        >
          <Plus size={18} />
          New Workspace
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-32 animate-pulse bg-muted/50 border-white/5" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2 bg-transparent">
          <FolderKanban className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <CardTitle className="mb-2">No Workspaces Found</CardTitle>
          <CardDescription className="mb-6 max-w-sm mx-auto">
            You don't belong to any workspaces yet. Create one to get started tracking your issues.
          </CardDescription>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus size={18} />
            Create Workspace
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace, i) => (
            <motion.div
              key={workspace.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer"
              onClick={() => handleWorkspaceSelect(workspace)}
            >
              <Card className="h-full bg-card hover:bg-card/80 transition-colors border-white/10 overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/80 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{workspace.name}</span>
                    <button
                      type="button"
                      onClick={(e) => openDeleteDialog(e, workspace)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete workspace"
                    >
                      <Trash2 size={15} />
                    </button>
                  </CardTitle>
                  <CardDescription>/{workspace.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMembersWorkspace(workspace);
                    }}
                    className="flex items-center text-xs text-muted-foreground hover:text-primary transition-colors gap-1.5 mt-2 cursor-pointer"
                  >
                    <Users size={14} />
                    <span>Manage Members</span>
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {membersWorkspace && (
        <AddMemberDialog
          open={!!membersWorkspace}
          onOpenChange={(open) => {
            if (!open) setMembersWorkspace(null);
          }}
          workspaceId={membersWorkspace.id}
          workspaceName={membersWorkspace.name}
        />
      )}

      {/* Delete Workspace Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle size={22} />
              <DialogTitle>Delete Workspace</DialogTitle>
            </div>
            <DialogDescription>
              This action is <span className="font-semibold text-foreground">irreversible</span>. It will permanently delete{" "}
              <span className="font-semibold text-foreground">{deleteTarget?.name}</span>, all its members, and all issues.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDeleteWorkspace} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="dashboard-confirm-delete">
                Type <span className="font-semibold select-all">{deleteTarget?.name}</span> to confirm.
              </Label>
              <Input
                id="dashboard-confirm-delete"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={deleteTarget?.name}
                className="border-destructive/30 focus-visible:ring-destructive"
                autoFocus
              />
            </div>
            {deleteError && <p className="text-xs font-medium text-destructive">{deleteError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={deleteInput !== deleteTarget?.name || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Workspace"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
