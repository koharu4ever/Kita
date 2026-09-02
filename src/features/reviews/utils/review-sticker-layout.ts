const stickerNames = [
  "sticker-02-cry.png",
  "sticker-03-heart-eyes.png",
  "sticker-05-shocked.png",
  "sticker-07-star-eyes.png",
  "sticker-08-upside-down.png",
  "sticker-13-hard.png",
  "sticker-14-good.png",
  "sticker-18-smirking.png",
  "sticker-20-sweat.png",
  "sticker-26-smiling.png",
  "sticker-27-smiling-halo.png",
  "sticker-33-melting.png",
  "sticker-35-sleeping.png",
  "sticker-41-blowing-a-kiss.png",
  "sticker-42-open-hands.png",
  "sticker-45-big-heart-blue.png",
  "sticker-46-anki.png",
  "sticker-47-robot.png",
] as const;

const verticalBands = {
  left: [
    [13, 21],
    [32, 42],
    [53, 64],
    [76, 87],
  ],
  right: [
    [19, 28],
    [40, 50],
    [61, 71],
    [79, 88],
  ],
} as const;

export type ReviewStickerLayoutItem = {
  flip: 1 | -1;
  name: (typeof stickerNames)[number];
  offset: number;
  opacity: number;
  rotation: number;
  side: keyof typeof verticalBands;
  size: number;
  top: number;
};

function hash(value: string) {
  return Array.from(value).reduce(
    (result, character) => (result * 31 + character.charCodeAt(0)) >>> 0,
    2166136261,
  );
}

function createSeededRandom(seed: number) {
  let state = seed || 0x6d2b79f5;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(random: () => number, minimum: number, maximum: number) {
  return minimum + random() * (maximum - minimum);
}

function shuffle<T>(items: readonly T[], random: () => number) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

export function createReviewStickerLayout(pathname: string) {
  const random = createSeededRandom(hash(pathname));
  const names = shuffle(stickerNames, random);
  let nameIndex = 0;

  return (Object.keys(verticalBands) as Array<keyof typeof verticalBands>)
    .flatMap((side) =>
      verticalBands[side].map(([minimumTop, maximumTop]) => {
        let rotation = Math.round(randomBetween(random, -23, 23));

        if (Math.abs(rotation) < 5) {
          rotation = rotation < 0 ? -5 : 5;
        }

        return {
          flip: random() > 0.62 ? -1 : 1,
          name: names[nameIndex++]!,
          offset: Math.round(randomBetween(random, 14, 54)),
          opacity: Number(randomBetween(random, 0.66, 0.88).toFixed(2)),
          rotation,
          side,
          size: Math.round(randomBetween(random, 54, 84)),
          top: Number(randomBetween(random, minimumTop, maximumTop).toFixed(1)),
        } satisfies ReviewStickerLayoutItem;
      }),
    )
    .sort((first, second) => first.top - second.top);
}
