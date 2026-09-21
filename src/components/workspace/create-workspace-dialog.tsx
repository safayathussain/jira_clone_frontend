"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useStore, Workspace } from "@/store";
import { getErrorMessage } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (workspace: Workspace) => void;
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateWorkspaceDialogProps) {
  const router = useRouter();
  const { workspaces, setWorkspaces, setCurrentWorkspace } = useStore();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!slugTouched) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanSlug = slug.trim().toLowerCase();
    if (!name.trim()) {
      setError("Workspace name is required");
      return;
    }

    if (!cleanSlug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
      setError("Slug must contain only lowercase letters, numbers, and hyphens");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/workspaces", {
        name: name.trim(),
        slug: cleanSlug,
      });

      const newWorkspace: Workspace = res.data;
      setWorkspaces([...workspaces, newWorkspace]);
      setCurrentWorkspace(newWorkspace);

      // Reset form
      setName("");
      setSlug("");
      setSlugTouched(false);
      onOpenChange(false);

      if (onCreated) {
        onCreated(newWorkspace);
      } else {
        router.push(`/board?workspace=${newWorkspace.slug}`);
      }
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to create workspace"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Workspaces organize your team projects and issues.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Workspace Name</Label>
              <Input
                id="ws-name"
                placeholder="e.g. Core Engineering"
                value={name}
                onChange={handleNameChange}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ws-slug">URL Slug</Label>
              <Input
                id="ws-slug"
                placeholder="e.g. core-engineering"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase());
                  setSlugTouched(true);
                }}
                required
              />
              <p className="text-xs text-muted-foreground">
                Accessible via /board?workspace={slug || "..."}
              </p>
            </div>

            {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
