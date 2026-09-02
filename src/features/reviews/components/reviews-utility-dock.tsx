"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useReviewsTheme } from "./reviews-experience-shell";
import styles from "./reviews-experience.module.css";

function ToolIcon({ name }: { name: "theme" | "settings" | "shuffle" | "up" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      focusable="false"
    >
      {name === "theme" && (
        <>
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" />
        </>
      )}
      {name === "settings" && (
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="m10 2-.6 3-1.6.9-2.9-1-2 3.4 2.3 2V12l-2.3 2 2 3.5 2.9-1 1.6.9.6 3h4l.6-3 1.6-.9 2.9 1 2-3.5-2.3-2v-1.7l2.3-2-2-3.4-2.9 1-1.6-.9L14 2h-4Zm2 6a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"
        />
      )}
      {name === "shuffle" && (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h3c4 0 8 12 12 12h3m-4-4 4 4-4 4M3 18h3c1.4 0 2.8-1.5 4-3.5M14 9.5C15.2 7.5 16.6 6 18 6h3m-4-4 4 4-4 4" />
        </g>
      )}
      {name === "up" && (
        <path
          d="m5 14 7-7 7 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function ReviewsUtilityDock() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useReviewsTheme();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const updateProgress = () => {
      const comments = document
        .querySelector("[data-comments-theme]")
        ?.getBoundingClientRect();
      const readingCommentsOnMobile =
        window.matchMedia("(max-width: 760px)").matches &&
        comments &&
        comments.top < window.innerHeight &&
        comments.bottom > 0;
      setVisible(window.scrollY > 100 && !readingCommentsOnMobile);
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      setProgress(
        scrollable > 0
          ? Math.min(100, Math.round((window.scrollY / scrollable) * 100))
          : 0,
      );
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [pathname]);

  const currentSlug = pathname.startsWith("/reviews/")
    ? pathname.slice("/reviews/".length)
    : undefined;
  const randomHref = currentSlug
    ? `/reviews/random?exclude=${encodeURIComponent(currentSlug)}`
    : "/reviews/random";

  return (
    <aside
      className={styles.utilityDock}
      data-visible={visible}
      aria-label="Review page tools"
    >
      <div
        id="reviews-reading-tools"
        className={styles.utilityExtra}
        hidden={!expanded}
      >
        <button
          type="button"
          className={styles.utilityButton}
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
          title={theme === "dark" ? "Light theme" : "Dark theme"}
        >
          <ToolIcon name="theme" />
        </button>
      </div>
      <button
        type="button"
        className={styles.utilityButton}
        onClick={() => setExpanded(!expanded)}
        aria-label="展开或收起阅读工具"
        aria-expanded={expanded}
        aria-controls="reviews-reading-tools"
        title="阅读工具"
      >
        <ToolIcon name="settings" />
      </button>
      <a
        className={styles.utilityButton}
        href={randomHref}
        aria-label="Open a random review"
        title="Random review"
      >
        <ToolIcon name="shuffle" />
      </a>
      <button
        type="button"
        className={`${styles.utilityButton} ${styles.progressButton}`}
        onClick={() =>
          window.scrollTo({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
            top: 0,
          })
        }
        aria-label={`Back to top (${progress}% read)`}
        title="回到顶部"
      >
        <span className={styles.progress} aria-hidden="true">
          {progress}
        </span>
        <span className={styles.progressArrow}>
          <ToolIcon name="up" />
        </span>
      </button>
    </aside>
  );
}
