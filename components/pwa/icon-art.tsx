import { BRAND } from "@/lib/brand";

/** App icon: two ascending chevrons on ink. Rendered by next/og, so inline styles only. */
export function IconArt({ size, padding = 0.2 }: { size: number; padding?: number }) {
  const inner = size * (1 - padding * 2);
  return (
    <div style={{ width: size, height: size, background: BRAND.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={inner} height={inner} viewBox="0 0 100 100" fill="none">
        <path d="M18 62 L50 32 L82 62" stroke="#ffffff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 80 L50 61 L70 80" stroke={BRAND.accent} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
