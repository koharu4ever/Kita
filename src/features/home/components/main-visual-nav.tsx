import Link from "next/link";

import type { HomeNavItem } from "@/features/home/types/home";

type MainVisualNavProps = {
  items: HomeNavItem[];
  isHidden: boolean;
};

export function MainVisualNav({ items, isHidden }: MainVisualNavProps) {
  return (
    <nav
      aria-label="Primary"
      aria-hidden={isHidden}
      className={[
        "relative z-30 w-full px-4 pb-8 transition-opacity duration-500 motion-reduce:transition-none sm:px-6 lg:px-8",
        isHidden ? "pointer-events-none opacity-0" : "opacity-100",
      ].join(" ")}
      inert={isHidden}
    >
      <div className="mb-7 text-center text-white sm:mb-9">
        <h1 className="kita-display text-6xl leading-none sm:text-7xl lg:text-8xl">
          KITA
        </h1>
        <p className="mt-3 text-xs tracking-[0.24em] text-white/72 uppercase sm:text-sm">
          A self-hosted game catalog and review publishing platform
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              className={[
                "kita-display block text-center text-4xl leading-none text-white transition-colors duration-200 md:text-6xl lg:text-8xl",
                "outline-none focus-visible:ring-2 focus-visible:ring-white/80",
                item.mainAccentClassName,
              ].join(" ")}
              href={item.href}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
