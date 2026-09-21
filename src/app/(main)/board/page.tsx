"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { KanbanBoard } from "@/components/board/kanban-board";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Filter, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/store";
import { CreateIssueDialog } from "@/components/board/create-issue-dialog";
import { AddMemberDialog } from "@/components/workspace/add-member-dialog";

function BoardContent() {
  const searchParams = useSearchParams();
  const workspaceSlug = searchParams.get("workspace");
  const { currentWorkspace, setCurrentWorkspace } = useStore();
  
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("member");
  const [members, setMembers] = useState<any[]>([]);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  // Sync workspace from URL — works on fresh reload when store is empty
  useEffect(() => {
    if (!workspaceSlug || currentWorkspace) return;

    async function resolveWorkspace() {
      try {
        // Try the in-memory store first (fast path after navigation)
        const fromStore = useStore.getState().workspaces.find(w => w.slug === workspaceSlug);
        if (fromStore) {
          setCurrentWorkspace(fromStore);
          return;
        }
        // Fallback: fetch directly from API (handles page reloads)
        const res = await api.get(`/workspaces/slug/${workspaceSlug}`);
        setCurrentWorkspace(res.data);
      } catch (err) {
        console.error("Failed to resolve workspace from slug", err);
      }
    }

    resolveWorkspace();
  }, [workspaceSlug, currentWorkspace, setCurrentWorkspace]);

  useEffect(() => {
    async function fetchIssues() {
      if (!currentWorkspace) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [issuesRes, membersRes] = await Promise.all([
          api.get(`/workspaces/${currentWorkspace.id}/issues`),
          api.get(`/workspaces/${currentWorkspace.id}/members`),
        ]);
        setIssues(issuesRes.data);
        setMembers(membersRes.data);
        // Determine current user's role
        const { user } = useStore.getState();
        const myMember = membersRes.data.find((m: any) => m.user_id === user?.id);
        setUserRole(myMember?.role ?? "member");
      } catch (err) {
        console.error("Failed to fetch issues", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchIssues();
  }, [currentWorkspace]);

  if (!currentWorkspace && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-semibold mb-2">No workspace selected</h2>
        <p className="text-muted-foreground">Please select a workspace from the dashboard to view the board.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {currentWorkspace?.name || "Workspace"} Board
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <Filter size={14} /> Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddMemberOpen(true)}
              className="h-8 gap-1.5 cursor-pointer text-xs"
            >
              <UserPlus size={14} /> Add Member
            </Button>
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background z-10" />
              <div className="w-7 h-7 rounded-full bg-blue-500/20 border-2 border-background z-0" />
            </div>
          </div>
        </div>
        <Button
          onClick={() => setCreateIssueOpen(true)}
          className="shrink-0 gap-2 font-medium"
        >
          <Plus size={18} />
          Create Issue
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto">
        {loading ? (
          <div className="flex gap-4 h-full">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-80 shrink-0 h-full flex flex-col gap-3 p-3 bg-muted/30 rounded-xl">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <KanbanBoard initialIssues={issues} workspaceId={currentWorkspace?.id} userRole={userRole} members={members} />
        )}
      </div>

      {currentWorkspace && (
        <>
          <CreateIssueDialog
            open={createIssueOpen}
            onOpenChange={setCreateIssueOpen}
            workspaceId={currentWorkspace.id}
            members={members}
            onIssueCreated={(newIssue) => setIssues((prev) => [newIssue, ...prev])}
          />
          <AddMemberDialog
            open={addMemberOpen}
            onOpenChange={setAddMemberOpen}
            workspaceId={currentWorkspace.id}
            workspaceName={currentWorkspace.name}
          />
        </>
      )}
    </div>
  );
}

export default function BoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex gap-4 h-full p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-80 shrink-0 h-full flex flex-col gap-3 p-3 bg-muted/30 rounded-xl">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ))}
        </div>
      }
    >
      <BoardContent />
    </Suspense>
  );
}
