import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { getAppContext } from "@/lib/data/context";
import packageJson from "@/package.json";
import { signOut } from "./actions";
import { PasswordForm } from "./password-form";
import { SignOutButton } from "./sign-out-button";

export default async function SettingsPage() {
  const { user } = await getAppContext();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pt-[env(safe-area-inset-top)]">
      <header className="flex h-14 items-center">
        <Link href="/today" aria-label="Back" className="-ml-3 flex size-11 items-center justify-center rounded-full text-text-secondary">
          <ChevronLeft className="size-6" aria-hidden />
        </Link>
      </header>
      <h1 className="pb-6 type-title">Settings</h1>
      <dl className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle text-[15px]">
        <div className="flex items-center justify-between py-4">
          <dt className="text-text-secondary">Email</dt>
          <dd className="text-text-primary">{user.email}</dd>
        </div>
        <div className="flex items-center justify-between py-4">
          <dt className="text-text-secondary">Weight unit</dt>
          <dd className="text-text-primary">lb</dd>
        </div>
        <div className="flex items-center justify-between py-4">
          <dt className="text-text-secondary">Version</dt>
          <dd className="text-text-primary tabular-nums">{packageJson.version}</dd>
        </div>
      </dl>
      <section className="flex flex-col gap-3 pt-8">
        <h2 className="type-subheading">Password</h2>
        <p className="text-[15px] text-text-secondary">Sign in with your email and this password on any device, including the installed app.</p>
        <PasswordForm />
      </section>
      <p className="pt-6 type-meta font-normal text-text-tertiary">
        Exercise illustrations ©{" "}
        <a href="https://github.com/everkinetic/data" className="underline underline-offset-2">Everkinetic</a>, licensed{" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/" className="underline underline-offset-2">CC BY-SA 4.0</a>{" "}
        (<a href="/exercise-media/ATTRIBUTION.md" className="underline underline-offset-2">details</a>).
      </p>
      <form action={signOut} className="pt-8">
        <SignOutButton />
      </form>
    </main>
  );
}
