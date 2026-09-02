"use client";

import { useEffect, useState } from "react";

import styles from "./reviews-experience.module.css";

const phrases = [
  "记录游戏，也记录它留在生活里的回声。",
  "在叙事、系统与角色之间慢慢书写。",
  "把通关之后仍然值得回看的细节留下来。",
] as const;

export function ReviewTypewriter() {
  const [text, setText] = useState<string>(phrases[0]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let phraseIndex = 0;
    let characterCount = phrases[0].length;
    let deleting = true;
    let timer = 0;

    const scheduleNextCharacter = (delay: number) => {
      timer = window.setTimeout(() => {
        if (reducedMotion.matches) {
          setText(phrases[0]);
          return;
        }

        const phrase = phrases[phraseIndex];

        if (deleting) {
          characterCount -= 1;
          setText(phrase.slice(0, characterCount));

          if (characterCount === 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            scheduleNextCharacter(420);
            return;
          }

          scheduleNextCharacter(38);
          return;
        }

        characterCount += 1;
        setText(phrases[phraseIndex].slice(0, characterCount));

        if (characterCount === phrases[phraseIndex].length) {
          deleting = true;
          scheduleNextCharacter(1850);
          return;
        }

        scheduleNextCharacter(72);
      }, delay);
    };

    const handleMotionChange = () => {
      window.clearTimeout(timer);

      if (reducedMotion.matches) {
        setText(phrases[0]);
        return;
      }

      phraseIndex = 0;
      characterCount = phrases[0].length;
      deleting = true;
      setText(phrases[0]);
      scheduleNextCharacter(1850);
    };

    if (!reducedMotion.matches) {
      scheduleNextCharacter(1850);
    }

    reducedMotion.addEventListener("change", handleMotionChange);

    return () => {
      window.clearTimeout(timer);
      reducedMotion.removeEventListener("change", handleMotionChange);
    };
  }, []);

  return (
    <p className={styles.typewriter}>
      <span className={styles.screenReaderOnly}>{phrases.join(" ")}</span>
      <span className={styles.typewriterText} aria-hidden="true">
        {text}
      </span>
    </p>
  );
}
