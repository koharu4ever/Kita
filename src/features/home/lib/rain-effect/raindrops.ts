import { createCanvas } from "@/features/home/lib/rain-effect/create-canvas";
import { chance, random, times } from "@/features/home/lib/rain-effect/random";

const dropSize = 64;

type DropState = {
  x: number;
  y: number;
  r: number;
  spreadX: number;
  spreadY: number;
  momentum: number;
  momentumX: number;
  lastSpawn: number;
  nextSpawn: number;
  parent: DropState | null;
  isNew: boolean;
  killed: boolean;
  shrink: number;
};

export type RaindropsOptions = {
  minR: number;
  maxR: number;
  maxDrops: number;
  rainChance: number;
  rainLimit: number;
  dropletsRate: number;
  dropletsSize: [number, number];
  dropletsCleaningRadiusMultiplier: number;
  raining: boolean;
  globalTimeScale: number;
  trailRate: number;
  autoShrink: boolean;
  spawnArea: [number, number];
  trailScaleRange: [number, number];
  collisionRadius: number;
  collisionRadiusIncrease: number;
  dropFallMultiplier: number;
  collisionBoostMultiplier: number;
  collisionBoost: number;
};

const defaultOptions: RaindropsOptions = {
  minR: 8,
  maxR: 34,
  maxDrops: 420,
  rainChance: 0.18,
  rainLimit: 3,
  dropletsRate: 18,
  dropletsSize: [2, 4],
  dropletsCleaningRadiusMultiplier: 0.32,
  raining: true,
  globalTimeScale: 1,
  trailRate: 1,
  autoShrink: true,
  spawnArea: [-0.1, 0.95],
  trailScaleRange: [0.2, 0.45],
  collisionRadius: 0.48,
  collisionRadiusIncrease: 0.004,
  dropFallMultiplier: 1,
  collisionBoostMultiplier: 0.05,
  collisionBoost: 1,
};

function createDrop(options: Partial<DropState>): DropState {
  return {
    x: 0,
    y: 0,
    r: 0,
    spreadX: 0,
    spreadY: 0,
    momentum: 0,
    momentumX: 0,
    lastSpawn: 0,
    nextSpawn: 0,
    parent: null,
    isNew: true,
    killed: false,
    shrink: 0,
    ...options,
  };
}

export class Raindrops {
  readonly canvas: HTMLCanvasElement;

  private readonly ctx: CanvasRenderingContext2D;
  private readonly droplets: HTMLCanvasElement;
  private readonly dropletsCtx: CanvasRenderingContext2D;
  private readonly dropsGfx: HTMLCanvasElement[] = [];
  private readonly clearDropletsGfx: HTMLCanvasElement;
  private readonly width: number;
  private readonly height: number;
  private readonly scale: number;
  private readonly dropAlpha: HTMLImageElement;
  private readonly dropColor: HTMLImageElement;
  private readonly dropletsPixelDensity = 1;
  private dropletsCounter = 0;
  private drops: DropState[] = [];
  private textureCleaningIterations = 0;

  options: RaindropsOptions;

  constructor(
    width: number,
    height: number,
    scale: number,
    dropAlpha: HTMLImageElement,
    dropColor: HTMLImageElement,
    options: Partial<RaindropsOptions> = {},
  ) {
    this.width = width;
    this.height = height;
    this.scale = scale;
    this.dropAlpha = dropAlpha;
    this.dropColor = dropColor;
    this.options = { ...defaultOptions, ...options };

    this.canvas = createCanvas(width, height);
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create raindrop canvas context.");
    }
    this.ctx = ctx;

    this.droplets = createCanvas(
      width * this.dropletsPixelDensity,
      height * this.dropletsPixelDensity,
    );
    const dropletsCtx = this.droplets.getContext("2d");
    if (!dropletsCtx) {
      throw new Error("Unable to create droplet canvas context.");
    }
    this.dropletsCtx = dropletsCtx;

    this.clearDropletsGfx = this.createClearDropletsBrush();
    this.renderDropsGfx();
  }

  private get deltaR() {
    return this.options.maxR - this.options.minR;
  }

  private get area() {
    return (this.width * this.height) / this.scale;
  }

  private get areaMultiplier() {
    return Math.sqrt(this.area / (1024 * 768));
  }

  update(timeScale: number) {
    this.clearCanvas();
    this.updateDrops(Math.min(timeScale, 1.1) * this.options.globalTimeScale);
  }

  private clearCanvas() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  private renderDropsGfx() {
    const dropBuffer = createCanvas(dropSize, dropSize);
    const dropBufferCtx = dropBuffer.getContext("2d");

    if (!dropBufferCtx) {
      return;
    }

    times(255, (index) => {
      const drop = createCanvas(dropSize, dropSize);
      const dropCtx = drop.getContext("2d");

      if (!dropCtx) {
        return;
      }

      dropBufferCtx.clearRect(0, 0, dropSize, dropSize);
      dropBufferCtx.globalCompositeOperation = "source-over";
      dropBufferCtx.drawImage(this.dropColor, 0, 0, dropSize, dropSize);

      dropBufferCtx.globalCompositeOperation = "screen";
      dropBufferCtx.fillStyle = `rgba(0,0,${index},1)`;
      dropBufferCtx.fillRect(0, 0, dropSize, dropSize);

      dropCtx.globalCompositeOperation = "source-over";
      dropCtx.drawImage(this.dropAlpha, 0, 0, dropSize, dropSize);
      dropCtx.globalCompositeOperation = "source-in";
      dropCtx.drawImage(dropBuffer, 0, 0, dropSize, dropSize);

      this.dropsGfx.push(drop);
    });
  }

  private createClearDropletsBrush() {
    const brush = createCanvas(128, 128);
    const brushCtx = brush.getContext("2d");

    if (brushCtx) {
      brushCtx.fillStyle = "#000";
      brushCtx.beginPath();
      brushCtx.arc(64, 64, 64, 0, Math.PI * 2);
      brushCtx.fill();
    }

    return brush;
  }

  private drawDroplet(x: number, y: number, radius: number) {
    this.drawDrop(
      this.dropletsCtx,
      createDrop({
        x: x * this.dropletsPixelDensity,
        y: y * this.dropletsPixelDensity,
        r: radius * this.dropletsPixelDensity,
      }),
    );
  }

  private drawDrop(ctx: CanvasRenderingContext2D, drop: DropState) {
    if (this.dropsGfx.length === 0) {
      return;
    }

    const scaleX = 1;
    const scaleY = 1.5;
    const spreadX = drop.spreadX;
    const spreadY = drop.spreadY;
    let depth = Math.max(
      0,
      Math.min(1, ((drop.r - this.options.minR) / this.deltaR) * 0.9),
    );
    depth *= 1 / ((spreadX + spreadY) * 0.5 + 1);

    const depthIndex = Math.floor(depth * (this.dropsGfx.length - 1));
    const source = this.dropsGfx[depthIndex];
    if (!source) {
      return;
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(
      source,
      (drop.x - drop.r * scaleX * (spreadX + 1)) * this.scale,
      (drop.y - drop.r * scaleY * (spreadY + 1)) * this.scale,
      drop.r * 2 * scaleX * (spreadX + 1) * this.scale,
      drop.r * 2 * scaleY * (spreadY + 1) * this.scale,
    );
  }

  private clearDroplets(x: number, y: number, radius = 30) {
    this.dropletsCtx.globalCompositeOperation = "destination-out";
    this.dropletsCtx.drawImage(
      this.clearDropletsGfx,
      (x - radius) * this.dropletsPixelDensity * this.scale,
      (y - radius) * this.dropletsPixelDensity * this.scale,
      radius * 2 * this.dropletsPixelDensity * this.scale,
      radius * 2 * this.dropletsPixelDensity * this.scale * 1.5,
    );
  }

  private tryCreateDrop(options: Partial<DropState>) {
    if (this.drops.length >= this.options.maxDrops * this.areaMultiplier) {
      return null;
    }

    return createDrop(options);
  }

  private updateRain(timeScale: number) {
    const rainDrops: DropState[] = [];

    if (!this.options.raining) {
      return rainDrops;
    }

    const limit = this.options.rainLimit * timeScale * this.areaMultiplier;
    let count = 0;

    while (
      chance(this.options.rainChance * timeScale * this.areaMultiplier) &&
      count < limit
    ) {
      count += 1;

      const radius = random(this.options.minR, this.options.maxR, (value) =>
        Math.pow(value, 3),
      );
      const drop = this.tryCreateDrop({
        x: random(this.width / this.scale),
        y: random(
          (this.height / this.scale) * this.options.spawnArea[0],
          (this.height / this.scale) * this.options.spawnArea[1],
        ),
        r: radius,
        momentum: 1 + (radius - this.options.minR) * 0.1 + random(2),
        spreadX: 1.5,
        spreadY: 1.5,
      });

      if (drop) {
        rainDrops.push(drop);
      }
    }

    return rainDrops;
  }

  private updateDroplets(timeScale: number) {
    if (this.textureCleaningIterations > 0) {
      this.textureCleaningIterations -= timeScale;
      this.dropletsCtx.globalCompositeOperation = "destination-out";
      this.dropletsCtx.fillStyle = `rgba(0,0,0,${0.05 * timeScale})`;
      this.dropletsCtx.fillRect(
        0,
        0,
        this.width * this.dropletsPixelDensity,
        this.height * this.dropletsPixelDensity,
      );
    }

    if (this.options.raining) {
      this.dropletsCounter +=
        this.options.dropletsRate * timeScale * this.areaMultiplier;
      times(this.dropletsCounter, () => {
        this.dropletsCounter -= 1;
        this.drawDroplet(
          random(this.width / this.scale),
          random(this.height / this.scale),
          random(...this.options.dropletsSize, (value) => value * value),
        );
      });
    }

    this.ctx.drawImage(this.droplets, 0, 0, this.width, this.height);
  }

  private updateDrops(timeScale: number) {
    let newDrops: DropState[] = [];

    this.updateDroplets(timeScale);
    newDrops = newDrops.concat(this.updateRain(timeScale));

    this.drops.sort((dropA, dropB) => {
      const valueA = dropA.y * (this.width / this.scale) + dropA.x;
      const valueB = dropB.y * (this.width / this.scale) + dropB.x;

      return valueA - valueB;
    });

    this.drops.forEach((drop, index) => {
      if (drop.killed) {
        return;
      }

      if (
        chance(
          (drop.r - this.options.minR * this.options.dropFallMultiplier) *
            (0.1 / this.deltaR) *
            timeScale,
        )
      ) {
        drop.momentum += random((drop.r / this.options.maxR) * 4);
      }

      if (
        this.options.autoShrink &&
        drop.r <= this.options.minR &&
        chance(0.05 * timeScale)
      ) {
        drop.shrink += 0.01;
      }

      drop.r -= drop.shrink * timeScale;
      if (drop.r <= 0) {
        drop.killed = true;
      }

      if (this.options.raining) {
        drop.lastSpawn += drop.momentum * timeScale * this.options.trailRate;
        if (drop.lastSpawn > drop.nextSpawn) {
          const trailDrop = this.tryCreateDrop({
            x: drop.x + random(-drop.r, drop.r) * 0.1,
            y: drop.y - drop.r * 0.01,
            r: drop.r * random(...this.options.trailScaleRange),
            spreadY: drop.momentum * 0.1,
            parent: drop,
          });

          if (trailDrop) {
            newDrops.push(trailDrop);
            drop.r *= Math.pow(0.97, timeScale);
            drop.lastSpawn = 0;
            drop.nextSpawn =
              random(this.options.minR, this.options.maxR) -
              drop.momentum * 2 * this.options.trailRate +
              (this.options.maxR - drop.r);
          }
        }
      }

      drop.spreadX *= Math.pow(0.4, timeScale);
      drop.spreadY *= Math.pow(0.7, timeScale);

      const moved = drop.momentum > 0;
      if (moved && !drop.killed) {
        drop.y += drop.momentum * this.options.globalTimeScale;
        drop.x += drop.momentumX * this.options.globalTimeScale;
        if (drop.y > this.height / this.scale + drop.r) {
          drop.killed = true;
        }
      }

      const checkCollision = (moved || drop.isNew) && !drop.killed;
      drop.isNew = false;

      if (checkCollision) {
        this.drops.slice(index + 1, index + 70).forEach((otherDrop) => {
          if (
            drop === otherDrop ||
            drop.r <= otherDrop.r ||
            drop.parent === otherDrop ||
            otherDrop.parent === drop ||
            otherDrop.killed
          ) {
            return;
          }

          const dx = otherDrop.x - drop.x;
          const dy = otherDrop.y - drop.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const collisionRadius =
            this.options.collisionRadius +
            drop.momentum * this.options.collisionRadiusIncrease * timeScale;

          if (distance < (drop.r + otherDrop.r) * collisionRadius) {
            const targetR = Math.min(
              this.options.maxR,
              Math.sqrt(
                (Math.PI * drop.r * drop.r +
                  Math.PI * otherDrop.r * otherDrop.r * 0.8) /
                  Math.PI,
              ),
            );

            drop.r = targetR;
            drop.momentumX += dx * 0.1;
            drop.spreadX = 0;
            drop.spreadY = 0;
            otherDrop.killed = true;
            drop.momentum = Math.max(
              otherDrop.momentum,
              Math.min(
                40,
                drop.momentum +
                  targetR * this.options.collisionBoostMultiplier +
                  this.options.collisionBoost,
              ),
            );
          }
        });
      }

      drop.momentum -=
        Math.max(1, this.options.minR * 0.5 - drop.momentum) * 0.1 * timeScale;
      if (drop.momentum < 0) {
        drop.momentum = 0;
      }
      drop.momentumX *= Math.pow(0.7, timeScale);

      if (!drop.killed) {
        newDrops.push(drop);
        if (moved && this.options.dropletsRate > 0) {
          this.clearDroplets(
            drop.x,
            drop.y,
            drop.r * this.options.dropletsCleaningRadiusMultiplier,
          );
        }
        this.drawDrop(this.ctx, drop);
      }
    });

    this.drops = newDrops;
  }
}
