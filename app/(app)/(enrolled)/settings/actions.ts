"use server";

import { redirect } from "next/navigation";
import { createClient, requireUser } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type PasswordState = { status: "idle" } | { status: "saved" } | { status: "error"; message: string };

export async function setPassword(_prev: PasswordState, form: FormData): Promise<PasswordState> {
  await requireUser();
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < 8) return { status: "error", message: "Use at least 8 characters." };
  if (password !== confirm) return { status: "error", message: "The two passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { status: "error", message: error.message };
  return { status: "saved" };
}
