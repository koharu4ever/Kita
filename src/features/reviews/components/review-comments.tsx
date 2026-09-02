"use client";

import Giscus from "@giscus/react";
import Image from "next/image";
import { useEffect, useSyncExternalStore } from "react";

import { useReviewsTheme } from "./reviews-experience-shell";
import styles from "./review-detail.module.css";

const frameStickers = [
  { name: "sticker-idea.png", position: "idea" },
  { name: "sticker-cool.png", position: "cool" },
  { name: "sticker-salute.png", position: "salute" },
  { name: "sticker-thanks.png", position: "thanks" },
  { name: "sticker-giggle.png", position: "giggle" },
  { name: "sticker-crown.png", position: "crown" },
  { name: "sticker-heart.png", position: "heart" },
];

const productionOrigin = "https://kita.kral-koharu.com";
const subscribeToOrigin = () => () => undefined;

export function ReviewComments() {
  const { theme } = useReviewsTheme();
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    () => window.location.origin,
    () => productionOrigin,
  );

  // The remote iframe cannot reliably load localhost CSS. Development uses
  // the owner's published theme; deployed Kita serves its own theme/assets.
  const isLocalPreview = ["localhost", "127.0.0.1", "[::1]"].includes(
    new URL(origin).hostname,
  );
  const themeURL = isLocalPreview
    ? `https://koharu4ever.github.io/css/giscus-koharu-${theme}.css`
    : `${origin}/reviews/giscus/${theme}.css`;

  useEffect(() => {
    const frame = document.querySelector<HTMLIFrameElement>(
      "iframe.giscus-frame",
    );
    if (!frame) return;

    const applyTheme = () => {
      frame.contentWindow?.postMessage(
        { giscus: { setConfig: { theme: themeURL } } },
        "https://giscus.app",
      );
    };

    frame.addEventListener("load", applyTheme);
    applyTheme();
    return () => frame.removeEventListener("load", applyTheme);
  }, [themeURL]);

  return (
    <section
      className={styles.comments}
      data-comments-theme={theme}
      aria-labelledby="review-comments-title"
    >
      <div className={styles.commentFrame}>
        <div className={styles.commentsHeading}>
          <h2 id="review-comments-title">
            <span>KITA /</span> 评论
          </h2>
        </div>
        {frameStickers.map((sticker) => (
          <Image
            aria-hidden="true"
            alt=""
            className={styles.commentSticker}
            data-position={sticker.position}
            height={78}
            key={sticker.name}
            src={`/reviews/reactions/anki-tan/${sticker.name}`}
            width={78}
          />
        ))}
        <div className={styles.giscusFrame}>
          <Giscus
            repo="koharu4ever/Kita"
            repoId="R_kgDOS5bpDg"
            category="Announcements"
            categoryId="DIC_kwDOS5bpDs4DEqOK"
            mapping="pathname"
            strict="1"
            reactionsEnabled="1"
            emitMetadata="0"
            inputPosition="top"
            theme={themeURL}
            lang="zh-CN"
            loading="lazy"
          />
        </div>
      </div>
      <p className={styles.reactionCredit}>
        Anki-tan reaction artwork by Shigeyuki, used under CC BY-SA 4.0.
      </p>
    </section>
  );
}
