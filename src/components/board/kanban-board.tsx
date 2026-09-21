"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, GripVertical, Trash2, AlertTriangle, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { IssueDetailsPanel } from "@/components/board/issue-details-panel";

// Fallback dummy issues for empty state
const DUMMY_ISSUES: any[] = [];

const COLUMNS = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
  { id: "backlog", title: "Backlog" },
];

export function KanbanBoard({
  initialIssues,
  workspaceId,
  userRole = "member",
  members,
}: {
  initialIssues: any[];
  workspaceId?: number;
  userRole?: string;
  members?: any[];
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [issues, setIssues] = useState(initialIssues);
  
  // Deletion state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Issue Details state
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const isViewer = userRole === "viewer";

  useEffect(() => {
    setIsMounted(true);
    setIssues(initialIssues);
  }, [initialIssues]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const draggedIssue = issues.find((issue) => issue.id.toString() === draggableId);
    if (!draggedIssue) return;

    // Optimistic UI update
    const previousIssues = [...issues];
    const newIssues = [...issues];
    const index = newIssues.findIndex((i) => i.id.toString() === draggableId);
    newIssues[index] = { ...draggedIssue, status: destination.droppableId };
    
    setIssues(newIssues);
    
    // Sync with backend API
    if (workspaceId) {
      try {
        await api.patch(`/workspaces/${workspaceId}/issues/${draggableId}`, {
          status: destination.droppableId,
        });
      } catch (err) {
        console.error("Failed to update issue status", err);
        // Rollback on error
        setIssues(previousIssues);
      }
    }
  };

  const handleDeleteIssue = async () => {
    if (!issueToDelete || !workspaceId || isViewer) return;
    
    try {
      setIsDeleting(true);
      await api.delete(`/workspaces/${workspaceId}/issues/${issueToDelete.id}`);
      
      // Update local state
      setIssues(issues.filter(i => i.id !== issueToDelete.id));
      setDeleteDialogOpen(false);
      setIssueToDelete(null);
    } catch (err) {
      console.error("Failed to delete issue", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isMounted) return null;

  return (
    <DragDropContext onDragEnd={isViewer ? () => {} : onDragEnd}>
      <div className="flex h-full gap-4 pb-4">
        {COLUMNS.map((col) => {
          const colIssues = issues.filter((issue) => issue.status === col.id);

          return (
            <div key={col.id} className="flex flex-col w-80 shrink-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <span className="truncate">{col.title}</span>
                  <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                    {colIssues.length}
                  </span>
                </h3>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal size={14} />
                </Button>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 rounded-xl p-2 transition-colors min-h-[150px] h-full ${
                      snapshot.isDraggingOver ? "bg-muted/50" : "bg-muted/20"
                    }`}
                  >
                    <div className="flex flex-col gap-2 max-h-full overflow-y-auto">
                      {colIssues.map((issue, index) => (
                        <Draggable
                          key={issue.id.toString()}
                          draggableId={issue.id.toString()}
                          index={index}
                          isDragDisabled={isViewer}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                // Add slight rotation when dragging
                                transform: snapshot.isDragging 
                                  ? `${provided.draggableProps.style?.transform} rotate(2deg)` 
                                  : provided.draggableProps.style?.transform,
                              }}
                              className={`group outline-none ${snapshot.isDragging ? 'z-50' : ''}`}
                            >
                              <Card 
                                onClick={() => {
                                  setSelectedIssue(issue);
                                  setIsPanelOpen(true);
                                }}
                                className={`border-white/5 transition-all shadow-sm cursor-pointer ${
                                  snapshot.isDragging ? "shadow-xl border-primary/20 scale-[1.02]" : "hover:border-white/20 hover:shadow-md"
                                }`}>
                                <CardContent className="p-3">
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                      <p className="text-sm font-medium leading-snug line-clamp-2">
                                        {issue.title}
                                      </p>
                                      
                                      <DropdownMenu>
                                        <DropdownMenuTrigger className="h-6 w-6 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md hover:bg-muted focus-visible:outline-none">
                                          <MoreHorizontal size={14} />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                          <DropdownMenuGroup>
                                            <DropdownMenuItem className="gap-2 cursor-pointer">
                                              <Edit2 size={14} /> Edit Issue
                                            </DropdownMenuItem>
                                            {!isViewer && (
                                              <DropdownMenuItem 
                                                className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setIssueToDelete(issue);
                                                  setDeleteDialogOpen(true);
                                                }}
                                              >
                                                <Trash2 size={14} /> Delete
                                              </DropdownMenuItem>
                                            )}
                                          </DropdownMenuGroup>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  
                                  <div className="flex items-center justify-between mt-4">
                                    <div className="flex gap-2">
                                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-transparent ${
                                        issue.issue_type === 'bug' ? 'bg-destructive/20 text-destructive' : 
                                        issue.issue_type === 'story' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'
                                      }`}>
                                        {issue.issue_type}
                                      </Badge>
                                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-transparent ${
                                        issue.priority === 'high' ? 'bg-orange-500/20 text-orange-500' : 
                                        issue.priority === 'low' ? 'bg-muted-foreground/20 text-muted-foreground' : 'bg-yellow-500/20 text-yellow-500'
                                      }`}>
                                        {issue.priority}
                                      </Badge>
                                    </div>
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-medium">
                                        {issue.assignee_id 
                                          ? (members?.find(m => m.user_id === issue.assignee_id)?.user?.full_name?.charAt(0)?.toUpperCase() || "U") 
                                          : "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle size={24} />
              <DialogTitle>Delete Issue</DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">"{issueToDelete?.title}"</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteIssue} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Issue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <IssueDetailsPanel
        issue={selectedIssue}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        isViewer={isViewer}
        members={members}
        onUpdate={(updatedIssue) => {
          setIssues(issues.map(i => i.id === updatedIssue.id ? updatedIssue : i));
          setSelectedIssue(updatedIssue);
        }}
      />
    </DragDropContext>
  );
}
