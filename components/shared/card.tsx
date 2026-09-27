import { cn } from "@/lib/utils";

/** The one card treatment: groups a real task. Subtle border, tonal surface, no floating shadow. */
export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-[20px] border border-border-subtle bg-surface p-5", className)}
      {...props}
    />
  );
}

export function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-[13px] font-medium text-text-tertiary", className)} {...props} />;
}
