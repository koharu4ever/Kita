import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import type { RefObject } from "react";

import type { GameDetail } from "@/features/games/types/game-detail";

type GameSharedModalProps = {
  index: number;
  games: GameDetail[];
  changePhotoId: (newIndex: number) => void;
  closeModal: () => void;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
};

type IconProps = {
  className?: string;
};

function XMarkIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18 18 6M6 6l12 12"
      />
    </svg>
  );
}

function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 19.5 8.25 12l7.5-7.5"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m8.25 4.5 7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}

function ArrowTopRightOnSquareIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5M16.5 3H21m0 0v4.5M21 3l-9.75 9.75"
      />
    </svg>
  );
}

function range(start: number, end: number) {
  const output = [];

  for (let value = start; value < end; value += 1) {
    output.push(value);
  }

  return output;
}

function getDetailHref(slug: string) {
  return `/games/${slug}` as Route;
}

export function GameSharedModal({
  index,
  games,
  changePhotoId,
  closeModal,
  closeButtonRef,
}: GameSharedModalProps) {
  const currentGame = games[index];
  const filteredGames = games.filter((_, gameIndex) =>
    range(index - 15, index + 15).includes(gameIndex),
  );

  if (!currentGame) {
    return null;
  }

  return (
    <div className="relative z-50 flex h-dvh w-full items-center">
      <div className="w-full overflow-hidden">
        <div className="relative flex h-dvh items-center justify-center">
          <div
            key={index}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Image
              src={currentGame.cover.src}
              width={1280}
              height={853}
              priority
              alt={currentGame.cover.alt}
              className="max-h-dvh w-auto max-w-full object-contain"
            />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 mx-auto flex items-center justify-center">
        <p aria-live="polite" className="sr-only">
          {currentGame.title}, image {index + 1} of {games.length}
        </p>

        <div className="relative h-dvh max-h-full w-full">
          <div className="absolute top-0 left-0 flex items-center gap-2 p-3 text-white">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none"
              aria-label="Close preview"
              ref={closeButtonRef}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="absolute top-0 right-0 flex items-center gap-2 p-3 text-white">
            <Link
              href={getDetailHref(currentGame.slug)}
              className="rounded-full bg-black/50 p-2 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none"
              title="Open fullsize version"
              aria-label="Open details"
            >
              <ArrowTopRightOnSquareIcon className="h-5 w-5" />
            </Link>
          </div>

          <button
            type="button"
            aria-disabled={index <= 0}
            className="absolute top-[calc(50%-16px)] left-3 rounded-full bg-black/50 p-3 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-30"
            style={{ transform: "translate3d(0, 0, 0)" }}
            onClick={() => {
              if (index > 0) {
                changePhotoId(index - 1);
              }
            }}
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>

          <button
            type="button"
            aria-disabled={index + 1 >= games.length}
            className="absolute top-[calc(50%-16px)] right-3 rounded-full bg-black/50 p-3 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-30"
            style={{ transform: "translate3d(0, 0, 0)" }}
            onClick={() => {
              if (index + 1 < games.length) {
                changePhotoId(index + 1);
              }
            }}
            aria-label="Next image"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 overflow-hidden bg-gradient-to-b from-black/0 to-black/60">
          <div className="mx-auto mt-6 mb-6 flex aspect-[3/2] h-14">
            {filteredGames.map((game) => {
              const gameIndex = games.findIndex(
                (item) => item.slug === game.slug,
              );

              return (
                <button
                  type="button"
                  onClick={() => changePhotoId(gameIndex)}
                  key={game.slug}
                  title={game.title}
                  aria-label={`Preview ${game.title}`}
                  aria-current={gameIndex === index ? "true" : undefined}
                  className={`${
                    gameIndex === index
                      ? "z-20 scale-125 rounded-md shadow shadow-black/50"
                      : "z-10"
                  } ${gameIndex === 0 ? "rounded-l-md" : ""} ${
                    gameIndex === games.length - 1 ? "rounded-r-md" : ""
                  } relative inline-block w-full shrink-0 transform-gpu overflow-hidden focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:outline-none`}
                >
                  <Image
                    alt=""
                    width={180}
                    height={120}
                    className={`${
                      gameIndex === index
                        ? "brightness-110 hover:brightness-110"
                        : "brightness-50 contrast-125 hover:brightness-75"
                    } h-full transform object-cover transition`}
                    src={game.cover.src}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
