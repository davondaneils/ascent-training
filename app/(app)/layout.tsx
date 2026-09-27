import { requireUser } from "@/lib/supabase/server";

// Defense in depth: the proxy already redirects signed-out requests.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requireUser();
  return children;
}
