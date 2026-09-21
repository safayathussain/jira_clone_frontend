import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlignLeft, Activity, MessageSquare, Calendar, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/lib/api";

interface IssueDetailsPanelProps {
  issue: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedIssue: any) => void;
  isViewer?: boolean;
  members?: any[];
}

export function IssueDetailsPanel({ issue, isOpen, onClose, onUpdate, isViewer, members }: IssueDetailsPanelProps) {
  const [description, setDescription] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync state when issue changes
  React.useEffect(() => {
    if (issue) {
      setDescription(issue.description || "");
      setIsEditingDesc(false);
    }
  }, [issue]);

  if (!issue) return null;

  const handleSaveDescription = async () => {
    if (isViewer) return;
    try {
      setSaving(true);
      const res = await api.patch(`/workspaces/${issue.workspace_id}/issues/${issue.id}`, {
        description: description,
      });
      onUpdate(res.data);
      setIsEditingDesc(false);
    } catch (err) {
      console.error("Failed to update description", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (isViewer) return;
    try {
      const res = await api.patch(`/workspaces/${issue.workspace_id}/issues/${issue.id}`, {
        assignee_id: newAssigneeId === "unassigned" ? null : parseInt(newAssigneeId),
      });
      onUpdate(res.data);
    } catch (err) {
      console.error("Failed to update assignee", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/20">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-xs text-muted-foreground uppercase bg-background">
                  ISSUE-{issue.id}
                </Badge>
                <Badge variant="outline" className="capitalize bg-background">
                  {issue.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 hover:bg-muted">
                  <X size={16} />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Title Section */}
              <div>
                <h1 className="text-2xl font-bold leading-tight text-foreground">{issue.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Assignee:</span>
                    <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md border border-white/5 relative">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px] bg-primary/20 text-primary font-medium">
                          {issue.assignee_id 
                            ? (members?.find(m => m.user_id === issue.assignee_id)?.user?.full_name?.charAt(0)?.toUpperCase() || "U") 
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <select
                        value={issue.assignee_id || "unassigned"}
                        onChange={(e) => handleAssigneeChange(e.target.value)}
                        disabled={isViewer}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                      >
                        <option value="unassigned">Unassigned</option>
                        {members?.map((m: any) => (
                          <option key={m.id} value={m.user_id}>
                            {m.user?.full_name || m.user?.username || m.user?.email}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Priority:</span>
                    <Badge variant="outline" className="capitalize flex items-center gap-1 shadow-sm bg-background">
                      <span className={`h-2 w-2 rounded-full ${
                        issue.priority === "high" ? "bg-red-500" :
                        issue.priority === "low" ? "bg-blue-500" : "bg-yellow-500"
                      }`} />
                      {issue.priority}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline" className="capitalize shadow-sm bg-background">
                      {issue.issue_type}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <AlignLeft size={18} />
                  <h3>Description</h3>
                </div>
                {isEditingDesc ? (
                  <div className="space-y-2">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full min-h-[150px] p-3 rounded-md bg-muted/30 border border-white/10 focus:outline-none focus:ring-1 focus:ring-primary text-sm font-mono resize-y text-foreground"
                      placeholder="Add a detailed description..."
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleSaveDescription} disabled={saving} className="h-8">
                        {saving ? "Saving..." : "Save"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingDesc(false)} className="h-8">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => !isViewer && setIsEditingDesc(true)}
                    className={`min-h-[100px] p-4 rounded-lg bg-muted/10 border border-white/5 text-sm prose prose-invert max-w-none ${!isViewer && 'hover:bg-muted/30 hover:border-white/10 cursor-pointer transition-colors'}`}
                  >
                    {issue.description ? (
                      <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{issue.description}</div>
                    ) : (
                      <p className="text-muted-foreground italic">
                        {isViewer ? "No description provided." : "Click to add a description..."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
