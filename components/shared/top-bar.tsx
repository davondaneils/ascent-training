import { CircleUser } from "lucide-react";
import Link from "next/link";

export function TopBar() {
  return (
    <header className="mx-auto flex h-14 w-full max-w-md items-center justify-end px-4 pt-[env(safe-area-inset-top)]">
      <Link
        href="/settings"
        aria-label="Settings"
        className="flex size-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-subtle"
      >
        <CircleUser className="size-6" strokeWidth={1.75} aria-hidden />
      </Link>
    </header>
  );
}
