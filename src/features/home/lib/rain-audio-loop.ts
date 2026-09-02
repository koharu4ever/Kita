// Bake one overlap into decoded PCM, then let the audio clock loop it.
// Unlike timers or the HTML audio ended event, this has no scheduling gap.
export function crossfadeRainLoop(
  channels: readonly Float32Array[],
  sampleRate: number,
  overlapSeconds = 2,
) {
  const length = channels[0]?.length ?? 0;
  if (
    !Number.isFinite(sampleRate) ||
    sampleRate <= 0 ||
    !Number.isFinite(overlapSeconds) ||
    overlapSeconds <= 0 ||
    length < 4 ||
    channels.some((channel) => channel.length !== length)
  )
    throw new Error("Invalid rain audio buffer");

  const overlap = Math.min(
    Math.max(2, Math.round(sampleRate * overlapSeconds)),
    Math.floor(length / 2),
  );
  return channels.map((input) => {
    const output = new Float32Array(length - overlap);
    const bodyLength = length - overlap * 2;
    output.set(input.subarray(overlap, length - overlap));
    for (let index = 0; index < overlap; index += 1) {
      const angle = (index / (overlap - 1)) * (Math.PI / 2);
      // Equal-power blend keeps unrelated rain textures from dipping in volume.
      output[bodyLength + index] =
        input[length - overlap + index] * Math.cos(angle) +
        input[index] * Math.sin(angle);
    }
    // The last sample is the source sample immediately before output[0].
    // Neither boundary is faded to silence; the recording stays continuous.
    return output;
  });
}
