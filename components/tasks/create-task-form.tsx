"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HouseholdMember } from "@/lib/households/queries";
import { createTask } from "@/lib/tasks/actions";

type CreateTaskFormProps = {
  members: HouseholdMember[];
  onCreated?: () => void;
};

export function CreateTaskForm({ members, onCreated }: CreateTaskFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add task</CardTitle>
        <CardDescription>Create a family task with optional assignee and due date.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await createTask(formData);
              if (result?.error) {
                setError(result.error);
                return;
              }
              onCreated?.();
              (document.getElementById("create-task-form") as HTMLFormElement | null)?.reset();
            });
          }}
          id="create-task-form"
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Pick up prescription" required maxLength={120} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <Input id="description" name="description" placeholder="Pharmacy closes at 6pm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assigneeId">Assign to</Label>
            <select
              id="assigneeId"
              name="assigneeId"
              defaultValue=""
              className="flex h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.displayName ?? member.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueAt">Due (optional)</Label>
            <Input id="dueAt" name="dueAt" type="datetime-local" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add task"}
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}