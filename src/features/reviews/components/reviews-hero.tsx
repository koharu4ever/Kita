import Image from "next/image";

import { ReviewTypewriter } from "./review-typewriter";
import styles from "./reviews-experience.module.css";

export function ReviewsHero() {
  return (
    <header className={styles.indexHero}>
      <Image
        src="/reviews/preview/rain-city.webp"
        alt="雨夜中的城市天际线"
        fill
        preload
        sizes="100vw"
        className={styles.indexHeroImage}
      />
      <div className={styles.indexHeroShade} />

      <div className={styles.indexHeroContent}>
        <p className={styles.indexHeroEyebrow}>Kita · Review Journal</p>
        <h1 className={styles.indexHeroTitle}>游戏与叙事的长期记录</h1>
        <ReviewTypewriter />
      </div>
    </header>
  );
}
