"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { type CSSProperties, useMemo } from "react";

import {
  createReviewStickerLayout,
  type ReviewStickerLayoutItem,
} from "../utils/review-sticker-layout";

import styles from "./reviews-experience.module.css";

type StickerStyle = CSSProperties & {
  "--sticker-flip": number;
  "--sticker-offset": string;
  "--sticker-opacity": number;
  "--sticker-rotation": string;
  "--sticker-size": string;
  "--sticker-top": string;
};

function getStickerStyle(sticker: ReviewStickerLayoutItem): StickerStyle {
  return {
    "--sticker-flip": sticker.flip,
    "--sticker-offset": `${sticker.offset}px`,
    "--sticker-opacity": sticker.opacity,
    "--sticker-rotation": `${sticker.rotation}deg`,
    "--sticker-size": `${sticker.size}px`,
    "--sticker-top": `${sticker.top}%`,
  };
}

export function ReviewStickerRail() {
  const pathname = usePathname();
  const followsIndexHero =
    pathname === "/reviews" || pathname === "/reviews/preview";
  const stickers = useMemo(
    () => createReviewStickerLayout(pathname),
    [pathname],
  );

  return (
    <div
      className={styles.stickerRail}
      data-below-hero={followsIndexHero ? "true" : undefined}
      aria-hidden="true"
    >
      {stickers.map((sticker) => (
        <Image
          key={sticker.name}
          src={`/reviews/reactions/anki-tan/${sticker.name}`}
          alt=""
          width={96}
          height={96}
          sizes="84px"
          className={styles.sticker}
          data-side={sticker.side}
          style={getStickerStyle(sticker)}
        />
      ))}
    </div>
  );
}
