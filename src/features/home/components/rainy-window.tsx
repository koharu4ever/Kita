"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";

type Raindrop = {
  id: number;
  left: string;
  top: string;
  size: number;
  rotation: number;
  animationDelay: string;
  animationDuration: string;
};

type RainyWindowProps = {
  backgroundImageUrl: string;
  raindropCount?: number;
};

type RaindropStyle = CSSProperties & {
  "--rotation": string;
};

function createSeededRandom(seed: number) {
  return function seededRandom() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createRaindrops(count: number): Raindrop[] {
  const random = createSeededRandom(20260609);

  return Array.from({ length: count }, (_, index) => ({
    id: index,
    left: `${random() * 100}%`,
    top: `${random() * 100}%`,
    size: random() * 7 + 3,
    rotation: random() * 360,
    animationDelay: `${random() * 5}s`,
    animationDuration: `${random() * 3 + 2}s`,
  }));
}

export function RainyWindow({
  backgroundImageUrl,
  raindropCount = 72,
}: RainyWindowProps) {
  const raindrops = useMemo(
    () => createRaindrops(raindropCount),
    [raindropCount],
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {raindrops.map((drop) => (
        <div
          className="raindrop"
          key={drop.id}
          style={
            {
              "--rotation": `${drop.rotation}deg`,
              animationDelay: drop.animationDelay,
              animationDuration: drop.animationDuration,
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundPosition: `${drop.left} ${drop.top}`,
              height: `${drop.size * 1.2}px`,
              left: drop.left,
              top: drop.top,
              width: `${drop.size}px`,
            } as RaindropStyle
          }
        />
      ))}
    </div>
  );
}
