import { redirect } from "next/navigation";
import { serverNow } from "@/lib/clock";
import { nextMonday, toLocalDate } from "@/lib/dates";
import { getAppContext } from "@/lib/data/context";
import { StartForm } from "./start-form";

export default async function OnboardingPage() {
  const { program, enrollment } = await getAppContext();
  if (enrollment) redirect("/today");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-10 px-6 py-16">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-text-tertiary">{program.block.name}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">When do you start?</h1>
        <p className="text-text-secondary">
          Your five-year campaign begins here. Physical training follows 13-week cycles, with Sunday for worship and rest. You set this date once.
        </p>
      </div>
      <StartForm defaultDate={nextMonday(toLocalDate(await serverNow()))} />
    </main>
  );
}
