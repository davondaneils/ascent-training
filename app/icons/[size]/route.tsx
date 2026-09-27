import { ImageResponse } from "next/og";
import { IconArt } from "@/components/pwa/icon-art";

// /icons/192, /icons/512 (any), /icons/maskable-512 (extra safe-zone padding for Android masks)
const SIZES: Record<string, { px: number; padding: number }> = {
  "192": { px: 192, padding: 0.16 },
  "512": { px: 512, padding: 0.16 },
  "maskable-512": { px: 512, padding: 0.26 },
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((size) => ({ size }));
}

export async function GET(_req: Request, { params }: RouteContext<"/icons/[size]">) {
  const spec = SIZES[(await params).size];
  if (!spec) return new Response(null, { status: 404 });
  return new ImageResponse(<IconArt size={spec.px} padding={spec.padding} />, { width: spec.px, height: spec.px });
}
