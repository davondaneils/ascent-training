"use client";

import { Dumbbell, PersonStanding } from "lucide-react";
import { useReducedMotion } from "motion/react";
import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { ExerciseInfo } from "./types";

type Media = Pick<ExerciseInfo, "name" | "category" | "imageUrl" | "videoUrl" | "animationUrl">;

const LOADED = new Set(["strength", "hypertrophy"]);

/**
 * One frame treatment for every exercise: white card, subtle border, centred subject.
 * Order of preference: looping clip/animation → still image → neutral placeholder.
 * Reduced motion always gets the still.
 */
export function MediaFrame({ media, className, animate = true }: { media: Media; className?: string; animate?: boolean }) {
  const reduce = useReducedMotion();
  const moving = animate && !reduce;
  const loop = moving ? (media.animationUrl ?? media.videoUrl) : null;
  const src = loop ?? media.imageUrl;
  const Icon = LOADED.has(media.category) ? Dumbbell : PersonStanding;

  return (
    <div className={cn("relative overflow-hidden rounded-[16px] border border-border-subtle bg-surface", className)}>
      {loop && /\.(mp4|webm|mov)$/i.test(loop) ? (
        <video src={loop} autoPlay loop muted playsInline className="size-full object-contain" aria-label={media.name} />
      ) : src && src.endsWith(".svg") ? (
        // SVG illustrations (incl. CSS-animated loops) need a plain <img>; next/image rasterises/blocks SVG.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={media.name} className="size-full object-contain p-[6%]" draggable={false} />
      ) : src ? (
        <Image src={src} alt={media.name} fill sizes="(max-width: 448px) 100vw, 448px" className="object-contain p-[6%]" />
      ) : (
        <div className="flex size-full items-center justify-center bg-surface-subtle/60" aria-hidden>
          <Icon className="size-[28%] max-h-12 max-w-12 text-text-tertiary/50" strokeWidth={1.25} />
        </div>
      )}
    </div>
  );
}

export function ExerciseMedia({ info }: { info: ExerciseInfo }) {
  const cues = [info.notes, info.instructions].filter(Boolean) as string[];
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button type="button" aria-label={`Show ${info.name} demonstration`} className="block w-full rounded-[16px] active:opacity-90">
          <MediaFrame media={info} className="aspect-[16/10] w-full" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="type-heading">{info.name}</DrawerTitle>
          <DrawerDescription className="sr-only">Movement demonstration and cues</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <MediaFrame media={info} className="aspect-square w-full" />
          {cues.length > 0 && (
            <ul className="flex flex-col gap-2 type-body text-text-secondary">
              {cues.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function ExerciseThumb({ info, className }: { info: Media; className?: string }) {
  return <MediaFrame media={info} animate={false} className={cn("size-12 shrink-0 rounded-[12px]", className)} />;
}
