export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";

    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener(
      "error",
      () => reject(new Error(`Failed to load image: ${src}`)),
      { once: true },
    );

    image.src = src;
  });
}

export async function loadImages<T extends Record<string, string>>(sources: T) {
  const entries = await Promise.all(
    Object.entries(sources).map(async ([key, src]) => {
      const image = await loadImage(src);

      return [key, image] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<keyof T, HTMLImageElement>;
}
