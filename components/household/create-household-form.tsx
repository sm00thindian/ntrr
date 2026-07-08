"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createHousehold, type CreateHouseholdState } from "@/lib/households/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating…" : "Create household"}
    </Button>
  );
}

export function CreateHouseholdForm() {
  const [state, formAction] = useActionState<CreateHouseholdState, FormData>(
    createHousehold,
    null,
  );

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Create your household</CardTitle>
        <CardDescription>
          Start with a name your family will recognize — then invite members from the Family
          page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" action={formAction}>
          <div className="space-y-2">
            <Label htmlFor="name">Household name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Martinez Family"
              required
              maxLength={80}
            />
          </div>
          <SubmitButton />
          {state?.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}