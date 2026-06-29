const reviewDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

export function formatReviewDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return reviewDateFormatter.format(date).toUpperCase();
}

export function formatReviewScore(rating: number) {
  return `SCORE ${rating.toFixed(1)} / 10`;
}

export function formatReviewReadingTime(value: string) {
  const readingTime = value.trim();

  if (/^\d+$/.test(readingTime)) {
    return `${readingTime} MIN READ`;
  }

  return readingTime.toUpperCase();
}
