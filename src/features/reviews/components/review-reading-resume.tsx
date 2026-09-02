"use client";

import { useEffect, useState } from "react";

import styles from "./review-detail.module.css";

const ninetyDays = 90 * 24 * 60 * 60 * 1000;

type ReadingRecord = {
  position: number;
  savedAt: number;
  version: string;
};

export function ReviewReadingResume({
  slug,
  version,
}: {
  slug: string;
  version: string;
}) {
  const [resumePosition, setResumePosition] = useState<number>();

  useEffect(() => {
    const key = `kita:review-progress:${slug}`;
    const rawRecord = window.localStorage.getItem(key);
    let frame: number | undefined;

    if (rawRecord) {
      try {
        const record = JSON.parse(rawRecord) as ReadingRecord;
        if (
          record.version === version &&
          Date.now() - record.savedAt < ninetyDays &&
          record.position > 320
        ) {
          frame = window.requestAnimationFrame(() =>
            setResumePosition(record.position),
          );
        }
      } catch {
        window.localStorage.removeItem(key);
      }
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        window.localStorage.setItem(
          key,
          JSON.stringify({
            position: Math.round(window.scrollY),
            savedAt: Date.now(),
            version,
          } satisfies ReadingRecord),
        );
      }, 200);
    };

    window.addEventListener("scroll", save, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      clearTimeout(timeout);
      window.removeEventListener("scroll", save);
    };
  }, [slug, version]);

  if (!resumePosition) return null;

  return (
    <div className={styles.resume} role="status">
      <span>继续上次阅读？</span>
      <button
        type="button"
        onClick={() => {
          window.scrollTo({ behavior: "smooth", top: resumePosition });
          setResumePosition(undefined);
        }}
      >
        回到原处
      </button>
      <button
        type="button"
        aria-label="Dismiss reading resume"
        onClick={() => setResumePosition(undefined)}
      >
        ×
      </button>
    </div>
  );
}
