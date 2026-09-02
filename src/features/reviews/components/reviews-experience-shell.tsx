"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import { ReviewStickerRail } from "./review-sticker-rail";
import { ReviewsUtilityDock } from "./reviews-utility-dock";
import styles from "./reviews-experience.module.css";

type ReviewsTheme = "dark" | "light";

type ReviewsThemeContextValue = {
  theme: ReviewsTheme;
  toggleTheme: () => void;
};

const ReviewsThemeContext = createContext<ReviewsThemeContextValue | null>(
  null,
);
const storageKey = "kita:reviews-theme:v1";
const themeChangeEvent = "kita:reviews-theme-change";

function getThemeSnapshot(): ReviewsTheme {
  const storedTheme = window.localStorage.getItem(storageKey);
  return storedTheme === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): ReviewsTheme {
  return "light";
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(themeChangeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(themeChangeEvent, callback);
  };
}

export function useReviewsTheme() {
  const context = useContext(ReviewsThemeContext);

  if (!context) {
    throw new Error(
      "useReviewsTheme must be used inside ReviewsExperienceShell",
    );
  }

  return context;
}

export function ReviewsExperienceShell({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const context = useMemo<ReviewsThemeContextValue>(
    () => ({
      theme,
      toggleTheme: () => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        window.localStorage.setItem(storageKey, nextTheme);
        window.dispatchEvent(new Event(themeChangeEvent));
      },
    }),
    [theme],
  );

  return (
    <ReviewsThemeContext value={context}>
      <div className={styles.shell} data-reviews-theme={theme}>
        <ReviewStickerRail />
        {children}
        <ReviewsUtilityDock />
      </div>
    </ReviewsThemeContext>
  );
}
