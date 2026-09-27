"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setPassword, type PasswordState } from "./actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(setPassword, { status: "idle" } as PasswordState);
  return (
    <form action={action} className="flex flex-col gap-3" key={state.status === "saved" ? "saved" : "form"}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password" className="text-text-secondary">New password</Label>
        <Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required className="h-12 rounded-[14px] px-4 text-base" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-password" className="text-text-secondary">Confirm</Label>
        <Input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={8} required className="h-12 rounded-[14px] px-4 text-base" />
      </div>
      {state.status === "error" && <p role="alert" className="text-sm text-danger">{state.message}</p>}
      {state.status === "saved" && <p role="status" className="text-sm text-success">Password saved. Use it to sign in on any device.</p>}
      <Button type="submit" variant="secondary" size="touch" disabled={pending}>
        {pending ? "Saving…" : "Set password"}
      </Button>
    </form>
  );
}
