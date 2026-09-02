"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { mountGalleryWindowRain } from "../lib/gallery-window-rain";
import styles from "./gallery-home-window.module.css";

const asset = "/games/window";

export function GalleryHomeWindow() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ReturnType<typeof mountGalleryWindowRain> | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!canvas.current) return;
    const rain = mountGalleryWindowRain(canvas.current);
    engine.current = rain;
    return () => {
      rain.destroy();
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    engine.current?.setPaused(paused);
  }, [paused]);

  return (
    <div className={styles.window} data-paused={paused}>
      <Link href="/" aria-label="Return home" className={styles.link}>
        <div className={styles.scene} aria-hidden="true">
          <Image
            src={`${asset}/city.jpg`}
            alt=""
            fill
            unoptimized
            loading="eager"
            className={styles.city}
          />
          <div className={styles.glassPlate} aria-hidden="true">
            <Image
              src={`${asset}/left-glass.png`}
              alt=""
              fill
              unoptimized
              className={styles.leftGlass}
            />
            <Image
              src={`${asset}/right-glass.png`}
              alt=""
              fill
              unoptimized
              className={styles.rightGlass}
            />
          </div>
          <canvas ref={canvas} aria-hidden="true" className={styles.rain} />
        </div>
        <span aria-hidden="true" className={styles.shade} />
        <span className={styles.returnLabel}>
          <span>Return home</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
          >
            <path d="m14 6-6 6 6 6M8 12h12" />
          </svg>
        </span>
      </Link>
      <button
        type="button"
        className={styles.pause}
        aria-label={paused ? "Play rain animation" : "Pause rain animation"}
        title={paused ? "Play rain animation" : "Pause rain animation"}
        onClick={() => setPaused((value) => !value)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          {paused ? <path d="m9 5 10 7-10 7Z" /> : <path d="M8 5v14M16 5v14" />}
        </svg>
      </button>
    </div>
  );
}
