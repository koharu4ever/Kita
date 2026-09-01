"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";

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
  const isOpen = index >= 0;
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const closeModal = useCallback(() => {
    dialogRef.current?.close();
    router.push(pathname as Route, { scroll: false });
  }, [pathname, router]);

  const changePhotoId = useCallback(
    (newIndex: number) => {
      const nextGame = games[newIndex];

      if (!nextGame) {
        return;
      }

      router.push(getPhotoHref(nextGame.slug), { scroll: false });
    },
    [games, router],
  );

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!isOpen || !dialog) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (!dialog.open) {
      dialog.showModal();
    }

    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = originalOverflow;
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [isOpen]);

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowRight" && index + 1 < games.length) {
      event.preventDefault();
      changePhotoId(index + 1);
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      changePhotoId(index - 1);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <dialog
      aria-label={`${games[index]?.title ?? "Game"} preview`}
      className="fixed inset-0 z-50 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-white backdrop:bg-black/70 backdrop:backdrop-blur-2xl"
      onCancel={(event) => {
        event.preventDefault();
        closeModal();
      }}
      onKeyDown={handleDialogKeyDown}
      ref={dialogRef}
    >
      <GameSharedModal
        closeButtonRef={closeButtonRef}
        index={index}
        games={games}
        changePhotoId={changePhotoId}
        closeModal={closeModal}
      />
    </dialog>
  );
}
