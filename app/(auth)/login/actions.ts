"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { step: "email"; error?: string }
  | { step: "code"; email: string; error?: string };

/**
 * The origin the user is actually on (localhost in dev, the Vercel domain in prod), so the magic
 * link always returns to the same site. NEXT_PUBLIC_APP_URL is only a fallback.
 */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "";
}

function isAllowed(email: string): boolean {
  const allowed = process.env.ALLOWED_EMAIL?.trim().toLowerCase();
  // With no ALLOWED_EMAIL configured, Supabase itself (signups disabled) is the gate.
  return !allowed || allowed === email;
}

export async function sendCode(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { step: "email", error: "Enter your email." };

  // Same response whether or not the address is allowed; nothing is sent for others.
  if (!isAllowed(email)) return { step: "code", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${await requestOrigin()}/auth/confirm` },
  });
  if (error && error.status === 429) {
    return { step: "email", error: "Too many sign-in emails for now. Supabase limits how many it sends per hour. Try again later." };
  }
  return { step: "code", email };
}

export async function verifyCode(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const token = String(form.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6,10}$/.test(token)) return { step: "code", email, error: "Enter the code from the email." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { step: "code", email, error: "That code didn't work. Check it or send a new one." };
  redirect("/today");
}
