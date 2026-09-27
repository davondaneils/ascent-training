"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendCode, signInWithPassword, verifyCode, type LoginState } from "./actions";

async function loginAction(prev: LoginState, form: FormData): Promise<LoginState> {
  const intent = form.get("intent");
  // Carry the typed email across steps: React resets the form after each action.
  const email = String(form.get("email") ?? "") || undefined;
  if (intent === "use-password") return { step: "password", email };
  if (intent === "use-link") return { step: "email", email };
  if (prev.step === "password") return signInWithPassword(prev, form);
  return prev.step === "email" ? sendCode(prev, form) : verifyCode(prev, form);
}

const inputClass = "h-12 rounded-[14px] px-4 text-base";

function EmailField({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="email" className="text-text-secondary">Email</Label>
      <Input id="email" name="email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" required defaultValue={defaultValue} className={inputClass} />
    </div>
  );
}

function Switch({ intent, children }: { intent: string; children: React.ReactNode }) {
  return (
    <Button type="submit" name="intent" value={intent} variant="ghost" size="touch" formNoValidate>
      {children}
    </Button>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { step: "password" } as LoginState);

  if (state.step === "password") {
    return (
      <form action={action} className="flex flex-col gap-4">
        <EmailField defaultValue={state.email} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-text-secondary">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
        </div>
        {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" size="xl" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <Switch intent="use-link">Email me a sign-in link instead</Switch>
      </form>
    );
  }

  if (state.step === "email") {
    return (
      <form action={action} className="flex flex-col gap-4">
        <EmailField defaultValue={state.email} />
        {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
        <Button type="submit" size="xl" disabled={pending}>
          {pending ? "Sending…" : "Send link"}
        </Button>
        <Switch intent="use-password">Use password instead</Switch>
      </form>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="email" value={state.email} />
      <p className="text-[15px] text-text-secondary">
        We sent a sign-in email to <span className="text-text-primary">{state.email}</span>. Open the link on this device, or
        enter the code if the email has one.
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
          className="h-14 rounded-[14px] px-4 text-center text-2xl tracking-[0.3em] tabular-nums"
        />
      </div>
      {state.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <Button type="submit" size="xl" disabled={pending}>
        {pending ? "Checking…" : "Sign in"}
      </Button>
      <Switch intent="use-password">Use password instead</Switch>
    </form>
  );
}
