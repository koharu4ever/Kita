import type { HomeWallpaper } from "@/features/home/types/home";

type SceneBackgroundProps = {
  wallpapers: HomeWallpaper[];
  activeIndex: number;
};

export function SceneBackground({
  wallpapers,
  activeIndex,
}: SceneBackgroundProps) {
  return (
    <div className="absolute inset-0 z-0">
      {wallpapers.map((wallpaper, index) => (
        <div
          aria-hidden="true"
          className={[
            "absolute inset-0 bg-cover bg-center transition-opacity duration-[1800ms] ease-in-out",
            "animate-wallpaper-breathing",
            index % 2 === 1 ? "animation-delay-half" : "",
            index === activeIndex ? "opacity-100" : "opacity-0",
          ].join(" ")}
          key={wallpaper.id}
          style={{ backgroundImage: `url(${wallpaper.image.url})` }}
        />
      ))}
    </div>
  );
}
