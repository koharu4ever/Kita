"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { GameDetail } from "@/features/games/types/game-detail";

import { GameSharedModal } from "./game-shared-modal";

type GameLightboxProps = {
  games: GameDetail[];
};

function getPhotoHref(slug: string) {
  return `/games?photo=${slug}` as Route;
}

export function GameLightbox({ games }: GameLightboxProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSlug = searchParams.get("photo");
  const index = games.findIndex((game) => game.slug === activeSlug);
  const [direction, setDirection] = useState(0);

  const closeModal = useCallback(() => {
    router.push(pathname as Route, { scroll: false });
  }, [pathname, router]);

  const changePhotoId = useCallback(
    (newIndex: number) => {
      const nextGame = games[newIndex];

      if (!nextGame) {
        return;
      }

      setDirection(newIndex > index ? 1 : -1);
      router.push(getPhotoHref(nextGame.slug), { scroll: false });
    },
    [games, index, router],
  );

  useEffect(() => {
    if (index < 0) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }

      if (event.key === "ArrowRight" && index + 1 < games.length) {
        changePhotoId(index + 1);
      }

      if (event.key === "ArrowLeft" && index > 0) {
        changePhotoId(index - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [changePhotoId, closeModal, games.length, index]);

  if (index < 0) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${games[index]?.title ?? "Game"} preview`}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <button
        type="button"
        aria-label="Close preview"
        onClick={closeModal}
        className="fixed inset-0 z-30 bg-black/70 backdrop-blur-2xl"
      />
      <GameSharedModal
        index={index}
        direction={direction}
        games={games}
        changePhotoId={changePhotoId}
        closeModal={closeModal}
      />
    </div>
  );
}
