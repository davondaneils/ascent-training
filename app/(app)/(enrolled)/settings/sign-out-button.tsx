"use client";

import { clearCachedPages } from "@/components/pwa/service-worker";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button type="submit" variant="destructive" size="touch" className="w-full" onClick={() => clearCachedPages()}>
      Sign out
    </Button>
  );
}
