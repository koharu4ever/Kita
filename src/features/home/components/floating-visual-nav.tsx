import Link from "next/link";

import type { HomeNavItem } from "@/features/home/types/home";

type FloatingVisualNavProps = {
  items: HomeNavItem[];
  isVisible: boolean;
};

export function FloatingVisualNav({
  items,
  isVisible,
}: FloatingVisualNavProps) {
  return (
    <nav
      aria-label="Floating primary"
      className={[
        "fixed top-1/2 right-0 z-50 hidden -translate-y-1/2 flex-col gap-2 transition-opacity duration-500 md:flex",
        isVisible ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    >
      {items.map((item) => (
        <Link
          className={[
            "kita-display bg-black/60 px-4 py-1 text-center text-lg leading-none text-white transition-colors duration-200 md:text-xl lg:text-2xl",
            "outline-none focus-visible:ring-2 focus-visible:ring-white/80",
            item.floatingAccentClassName,
          ].join(" ")}
          href={item.href}
          key={item.href}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
