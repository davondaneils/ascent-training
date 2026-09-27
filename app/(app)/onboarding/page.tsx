import { redirect } from "next/navigation";
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
          Week 1 begins on this date. Twelve weeks, Monday to Sunday. You set this once.
        </p>
      </div>
      <StartForm defaultDate={nextMonday(toLocalDate(new Date()))} />
    </main>
  );
}
