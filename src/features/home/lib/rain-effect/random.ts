export function random(
  from = 0,
  to = 1,
  interpolation: (value: number) => number = (value) => value,
) {
  return from + interpolation(Math.random()) * (to - from);
}

export function chance(value: number) {
  return random() <= value;
}

export function times(count: number, callback: (index: number) => void) {
  for (let index = 0; index < count; index += 1) {
    callback(index);
  }
}
