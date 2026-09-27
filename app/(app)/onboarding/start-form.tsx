"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startProgram } from "./actions";

export function StartForm({ defaultDate }: { defaultDate: string }) {
  const [error, action, pending] = useActionState(startProgram, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="startDate" className="text-text-secondary">Start date</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={defaultDate}
          required
          className="h-12 rounded-[14px] px-4 text-base"
        />
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="xl" disabled={pending}>
        {pending ? "Starting…" : "Start Phase 1"}
      </Button>
    </form>
  );
}
