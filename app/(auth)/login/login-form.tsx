"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendCode, verifyCode, type LoginState } from "./actions";

async function loginAction(prev: LoginState, form: FormData): Promise<LoginState> {
  if (form.get("intent") === "restart") return { step: "email" };
  return prev.step === "email" ? sendCode(prev, form) : verifyCode(prev, form);
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { step: "email" } as LoginState);

  if (state.step === "email") {
    return (
      <form action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-text-secondary">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            required
            className="h-12 rounded-[14px] px-4 text-base"
          />
        </div>
        {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" size="xl" disabled={pending}>
          {pending ? "Sending…" : "Send code"}
        </Button>
      </form>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="email" value={state.email} />
      <p className="text-[15px] text-text-secondary">
        We sent a code to <span className="text-text-primary">{state.email}</span>. You can also tap the link in the email.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="code" className="text-text-secondary">Code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={10}
          required
          autoFocus
          className="h-14 rounded-[14px] px-4 text-center text-2xl tracking-[0.3em] tabular-nums"
        />
      </div>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" size="xl" disabled={pending}>
        {pending ? "Checking…" : "Sign in"}
      </Button>
      <Button type="submit" name="intent" value="restart" variant="ghost" size="touch" formNoValidate>
        Use a different email
      </Button>
    </form>
  );
}
