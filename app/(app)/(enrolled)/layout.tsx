import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/data/context";

export default async function EnrolledLayout({ children }: LayoutProps<"/">) {
  const { enrollment } = await getAppContext();
  if (!enrollment) redirect("/onboarding");
  return children;
}
