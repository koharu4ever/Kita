import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRainAudio } from "../rain-audio";

function mockAudio() {
  const source = {
    buffer: null,
    loop: false,
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
  };
  const gain = {
    gain: { value: 0, setTargetAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const decoded = {
    numberOfChannels: 2,
    sampleRate: 100,
    getChannelData: () => new Float32Array(1800).fill(0.05),
  };
  const context = {
    currentTime: 0,
    destination: {},
    createBuffer: vi.fn(() => ({ copyToChannel: vi.fn() })),
    createBufferSource: vi.fn(() => source),
    createGain: vi.fn(() => gain),
    decodeAudioData: vi.fn().mockResolvedValue(decoded),
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const Constructor = vi.fn(function () {
    return context;
  });
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
  });
  vi.stubGlobal("AudioContext", Constructor);
  vi.stubGlobal("window", { setTimeout });
  vi.stubGlobal("fetch", fetchMock);
  return { context, source, gain, Constructor, fetchMock, decoded };
}

describe("opt-in recorded rain audio", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("does not fetch or play until explicitly requested", () => {
    const { Constructor, fetchMock, gain, source } = mockAudio();
    expect(Constructor).not.toHaveBeenCalled();
    const audio = createRainAudio();
    expect(gain.gain.value).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(source.start).not.toHaveBeenCalled();
    audio.destroy();
  });
  it("resumes in the gesture then loads and loops the crossfaded recording", async () => {
    const { context, source, gain, fetchMock } = mockAudio();
    const audio = createRainAudio();
    const playing = audio.play();
    expect(context.resume).toHaveBeenCalledOnce();
    expect(fetchMock).not.toHaveBeenCalled();
    await playing;
    expect(fetchMock).toHaveBeenCalledWith(
      "/audio/home-rain.mp3",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(context.createBuffer).toHaveBeenCalledWith(2, 1600, 100);
    expect(source.loop).toBe(true);
    expect(source.start).toHaveBeenCalledOnce();
    expect(gain.gain.setTargetAtTime).toHaveBeenLastCalledWith(0.7, 0, 0.7);
    audio.destroy();
  });
  it("reuses the decoded loop and cancels stale suspension on restart", async () => {
    const { context, fetchMock, source } = mockAudio();
    const audio = createRainAudio();
    await audio.play();
    audio.pause();
    await audio.play();
    vi.advanceTimersByTime(600);
    expect(context.suspend).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(source.start).toHaveBeenCalledOnce();
    audio.pause();
    vi.advanceTimersByTime(500);
    expect(context.suspend).toHaveBeenCalledOnce();
    audio.destroy();
  });
  it("stays silent if the page was hidden while decoding", async () => {
    const { context, decoded, gain } = mockAudio();
    let finish!: (value: typeof decoded) => void;
    context.decodeAudioData.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const audio = createRainAudio();
    const playing = audio.play();
    await vi.waitFor(() => expect(context.decodeAudioData).toHaveBeenCalled());
    audio.pause();
    finish(decoded);
    await playing;
    expect(gain.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.12);
    audio.destroy();
  });
  it("aborts pending work and closes resources exactly once on teardown", async () => {
    const { context, fetchMock, source } = mockAudio();
    const audio = createRainAudio();
    await audio.play();
    audio.pause();
    audio.destroy();
    audio.destroy();
    vi.advanceTimersByTime(1000);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
    expect(source.stop).toHaveBeenCalledOnce();
    expect(context.close).toHaveBeenCalledOnce();
    expect(context.suspend).not.toHaveBeenCalled();
  });
  it("never starts a source if teardown happens during decoding", async () => {
    const { context, source, decoded } = mockAudio();
    let finish!: (value: typeof decoded) => void;
    context.decodeAudioData.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const audio = createRainAudio();
    const playing = audio.play();
    await vi.waitFor(() => expect(context.decodeAudioData).toHaveBeenCalled());
    audio.destroy();
    finish(decoded);
    await playing;
    expect(source.start).not.toHaveBeenCalled();
  });
  it("reports a missing recording instead of falling back to synthetic noise", async () => {
    const { fetchMock, source } = mockAudio();
    fetchMock.mockResolvedValue({ ok: false });
    const audio = createRainAudio();
    await expect(audio.play()).rejects.toThrow("could not be loaded");
    expect(source.start).not.toHaveBeenCalled();
    audio.destroy();
  });
});
