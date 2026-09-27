import { BottomNav } from "@/components/shared/bottom-nav";
import { DevTimeBanner } from "@/components/shared/dev-time-banner";
import { TopBar } from "@/components/shared/top-bar";

export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <DevTimeBanner />
      <TopBar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
