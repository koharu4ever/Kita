"use client";

import { useEffect, useRef, useState } from "react";
import {
  createRainAudio,
  type RainAudio,
} from "@/features/home/lib/rain-audio";
import styles from "./home-atmosphere.module.css";

export function RainSoundControl({ progress }: { progress: number }) {
  const audioRef = useRef<RainAudio | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const visible = progress > 0.02 || enabled || pending || Boolean(error);
  const label = pending ? "正在加载雨声" : enabled ? "关闭雨声" : "开启雨声";
  useEffect(
    () => () => {
      audioRef.current?.destroy();
      audioRef.current = null;
    },
    [],
  );

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden || !enabled) audioRef.current?.pause();
      else
        void audioRef.current?.play().catch(() => {
          setEnabled(false);
          setError("雨声已暂停，请点击重新开启。");
        });
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [enabled]);

  async function toggle() {
    if (enabled) {
      audioRef.current?.pause();
      setEnabled(false);
      return;
    }
    setPending(true);
    setError("");
    try {
      const audio = audioRef.current ?? createRainAudio();
      audioRef.current = audio;
      await audio.play();
      if (audioRef.current !== audio) return;
      if (document.hidden) audio.pause();
      setEnabled(true);
    } catch {
      audioRef.current?.destroy();
      audioRef.current = null;
      setError("暂时无法播放雨声，你仍然可以浏览雨景。");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.soundControl}
        data-visible={visible}
        aria-hidden={!visible}
        tabIndex={visible ? 0 : -1}
        onClick={toggle}
        aria-pressed={enabled}
        aria-busy={pending}
        disabled={pending}
        aria-label={label}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          aria-hidden="true"
        >
          <path d="M3 10v4h4l5 4V6l-5 4H3Z" strokeLinejoin="round" />
          {enabled ? (
            <>
              <path d="M16 8c2 2 2 6 0 8" />
              <path d="M19 5c4 4 4 10 0 14" />
            </>
          ) : (
            <path d="m17 9 5 6m0-6-5 6" />
          )}
        </svg>
        <span className={styles.soundTooltip} aria-hidden="true">
          {label}
        </span>
      </button>
      {error ? (
        <p role="status" className={styles.soundStatus}>
          {error}
        </p>
      ) : null}
    </>
  );
}
