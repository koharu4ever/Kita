import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { env } from "@/config/env";
import { GalleryHomeWindow } from "@/features/games/components/gallery-home-window";

export const metadata: Metadata = {
  title: "Urban Rain Window Preview | Kita",
  robots: { follow: false, index: false },
};

// Layout samples only: no Payload reads/writes or fictional Game detail links.
const covers = [
  { src: "/home-sea-girl.webp", width: 2560, height: 1350 },
  { src: "/home-night-sky.webp", width: 2560, height: 1753 },
  { src: "/home-rain-harbor.webp", width: 2560, height: 1588 },
  { src: "/home-sunset-field.webp", width: 2560, height: 1450 },
  { src: "/reviews/preview/violet-window.webp", width: 1440, height: 810 },
  { src: "/reviews/preview/forest-room.webp", width: 1280, height: 604 },
];

export default function GamesWindowPreviewPage() {
  if (env.NODE_ENV !== "development") notFound();

  return (
    <main className="min-h-screen bg-[#05070c] text-white">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/home-night-sky.webp')" }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_34%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0.96))]"
      />
      <section className="relative z-10 mx-auto max-w-[1960px] p-4">
        <h1 className="sr-only">Games window layout preview</h1>
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4">
          <GalleryHomeWindow />
          {covers.map((cover) => (
            <Image
              key={cover.src}
              {...cover}
              alt="Gallery layout sample"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw"
              className="mb-5 block h-auto w-full break-inside-avoid rounded-lg brightness-90"
            />
          ))}
        </div>
        <p className="mt-6 text-xs text-white/50">
          Local layout preview · The window uses the same component as Games and
          returns home. Sample covers are non-interactive and are not CMS
          entries.
        </p>
      </section>
    </main>
  );
}
