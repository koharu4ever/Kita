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
      className={[
        "relative z-30 w-full px-4 pb-8 transition-opacity duration-500 sm:px-6 lg:px-8",
        isHidden ? "pointer-events-none opacity-0" : "opacity-100",
      ].join(" ")}
    >
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
