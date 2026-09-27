"use client";

import { Dumbbell, PersonStanding } from "lucide-react";
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

/** Looping clip, image, or a neutral placeholder — same frame and crop for all three. */
function MediaFrame({ media, className }: { media: Media; className?: string }) {
  const loop = media.animationUrl ?? media.videoUrl;
  const Icon = media.category === "strength" || media.category === "hypertrophy" ? Dumbbell : PersonStanding;
  return (
    <div className={cn("relative overflow-hidden rounded-[16px] bg-surface-subtle", className)}>
      {loop ? (
        <video src={loop} autoPlay loop muted playsInline className="size-full object-contain" aria-label={media.name} />
      ) : media.imageUrl ? (
        <Image src={media.imageUrl} alt={media.name} fill sizes="(max-width: 448px) 100vw, 448px" className="object-contain" />
      ) : (
        <div className="flex size-full items-center justify-center" aria-hidden>
          <Icon className="size-10 text-text-tertiary/60" strokeWidth={1.25} />
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
        <button type="button" aria-label={`Show ${info.name} demonstration`} className="block w-full">
          <MediaFrame media={info} className="aspect-[16/9] w-full" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-xl">{info.name}</DrawerTitle>
          <DrawerDescription className="sr-only">Movement demonstration and cues</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <MediaFrame media={info} className="aspect-square w-full" />
          {cues.length > 0 && (
            <ul className="flex flex-col gap-2 text-[15px] text-text-secondary">
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

export function ExerciseThumb({ info }: { info: Media }) {
  return <MediaFrame media={info} className="size-12 shrink-0 rounded-[12px]" />;
}
