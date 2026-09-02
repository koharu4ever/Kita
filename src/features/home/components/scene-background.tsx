import type { WallpaperScene } from "@/features/home/lib/rain-atmosphere";
import styles from "./home-atmosphere.module.css";

export function SceneBackground({ scene }: { scene: WallpaperScene }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 z-0">
      {scene.previousUrl ? (
        <div
          className={styles.wallpaper}
          style={{ backgroundImage: `url(${scene.previousUrl})` }}
        />
      ) : null}
      <div
        key={scene.url}
        className={`${styles.wallpaper} ${scene.previousUrl ? styles.incoming : ""}`}
        style={{ backgroundImage: `url(${scene.url})` }}
      />
    </div>
  );
}
