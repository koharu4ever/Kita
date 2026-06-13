import type { HomeVerse } from "@/features/home/types/home";

type VersePanelProps = {
  verse: HomeVerse | null;
};

export function VersePanel({ verse }: VersePanelProps) {
  if (!verse) {
    return null;
  }

  return (
    <figure className="mx-auto max-w-3xl text-center">
      <blockquote className="text-2xl leading-relaxed font-light text-balance text-white/85 sm:text-3xl">
        <span className="typewriter-caret">{verse.text}</span>
      </blockquote>

      {verse.author || verse.source ? (
        <figcaption className="mt-6 text-sm text-white/55 uppercase">
          {verse.author}
          {verse.author && verse.source ? " / " : ""}
          {verse.source}
        </figcaption>
      ) : null}
    </figure>
  );
}
