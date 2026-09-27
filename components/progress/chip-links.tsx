import Link from "next/link";
import { cn } from "@/lib/utils";

/** Horizontally scrolling selector; each option is a link so the page stays server-rendered. */
export function ChipLinks({ options, selected, hrefFor, label }: {
  options: { value: string; label: string }[];
  selected: string;
  hrefFor: (value: string) => string;
  label: string;
}) {
  return (
    <nav aria-label={label} className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
      {options.map((o) => (
        <Link
          key={o.value}
          href={hrefFor(o.value)}
          scroll={false}
          replace
          aria-current={o.value === selected ? "true" : undefined}
          className={cn(
            "flex h-11 shrink-0 items-center rounded-full px-4 text-[15px] font-medium transition-colors",
            o.value === selected ? "bg-primary text-primary-foreground" : "border border-border-subtle bg-surface text-text-primary",
          )}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
