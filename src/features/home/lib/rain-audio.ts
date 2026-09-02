import { crossfadeRainLoop } from "./rain-audio-loop";

const rainAudioUrl = "/audio/home-rain.mp3";
const playbackGain = 0.7;

// Called only by the sound button. No download or AudioContext on page load.
export function createRainAudio() {
  const context = new AudioContext();
  const controller = new AbortController();
  const gain = context.createGain();
  gain.gain.value = 0;
  gain.connect(context.destination);
  let disposed = false;
  let wantsPlayback = false;
  let pauseTimer = 0;
  let source: AudioBufferSourceNode | null = null;
  let loading: Promise<void> | null = null;

  async function load() {
    const response = await fetch(rainAudioUrl, { signal: controller.signal });
    if (!response.ok) throw new Error("Rain audio could not be loaded");
    const decoded = await context.decodeAudioData(await response.arrayBuffer());
    if (disposed) return;
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, i) =>
      decoded.getChannelData(i),
    );
    const loop = crossfadeRainLoop(channels, decoded.sampleRate);
    const buffer = context.createBuffer(
      loop.length,
      loop[0].length,
      decoded.sampleRate,
    );
    loop.forEach((channel, index) => buffer.copyToChannel(channel, index));
    source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    source.start();
  }

  return {
    async play() {
      if (disposed) return;
      wantsPlayback = true;
      clearTimeout(pauseTimer);
      // Resume in the click gesture, before awaiting the lazy network request.
      await context.resume();
      if (disposed) return;
      loading ??= load();
      await loading;
      if (!disposed && wantsPlayback)
        gain.gain.setTargetAtTime(playbackGain, context.currentTime, 0.7);
    },
    pause() {
      wantsPlayback = false;
      clearTimeout(pauseTimer);
      if (disposed) return;
      gain.gain.setTargetAtTime(0, context.currentTime, 0.12);
      pauseTimer = window.setTimeout(() => {
        if (!disposed && !wantsPlayback) void context.suspend().catch(() => {});
      }, 500);
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      wantsPlayback = false;
      clearTimeout(pauseTimer);
      controller.abort();
      source?.stop();
      source?.disconnect();
      gain.disconnect();
      void context.close().catch(() => {});
    },
  };
}

export type RainAudio = ReturnType<typeof createRainAudio>;
