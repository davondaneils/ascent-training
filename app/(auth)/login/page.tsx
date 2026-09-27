import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · Ascent" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const linkFailed = (await searchParams).error === "link";
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-10 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">Ascent</h1>
        <p className="text-text-secondary">Sign in to continue.</p>
      </div>
      {linkFailed && (
        <p role="alert" className="rounded-[14px] bg-warning/15 px-4 py-3 text-[15px] text-text-primary">
          That sign-in link didn&apos;t work. It may have expired, or been opened in a different browser than the one
          that asked for it. Send a new one from here and open it on this device.
        </p>
      )}
      <LoginForm />
    </main>
  );
}
