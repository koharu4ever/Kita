import type { HomeWallpaper } from "@/features/home/types/home";

type SceneBackgroundProps = {
  wallpapers: HomeWallpaper[];
  activeIndex: number;
  hasRotated: boolean;
};

export function SceneBackground({
  wallpapers,
  activeIndex,
  hasRotated,
}: SceneBackgroundProps) {
  return (
    <div className="absolute inset-0 z-0">
      {wallpapers.map((wallpaper, index) => {
        const isOutgoingWallpaperAfterWrap =
          hasRotated && activeIndex === 0 && index === wallpapers.length - 1;
        const shouldRequestWallpaper =
          index <= activeIndex || isOutgoingWallpaperAfterWrap;

        return (
          <div
            aria-hidden="true"
            className={[
              "absolute inset-0 bg-cover bg-center transition-opacity duration-[1800ms] ease-in-out motion-reduce:transition-none",
              "animate-wallpaper-breathing",
              index % 2 === 1 ? "animation-delay-half" : "",
              index === activeIndex ? "opacity-100" : "opacity-0",
            ].join(" ")}
            key={wallpaper.id}
            style={
              shouldRequestWallpaper
                ? { backgroundImage: `url(${wallpaper.image.url})` }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
