import type { Route } from "next";
import Link from "next/link";

const navItems: Array<{
  href: Route;
  label: string;
}> = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/tools", label: "Tools" },
  { href: "/about", label: "About" },
];

export function ReviewsTopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/8 bg-[#05050a]/62 backdrop-blur-md">
      <nav
        aria-label="Reviews section navigation"
        className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3"
      >
        <Link
          href="/reviews"
          className="kita-display text-xl leading-none text-white/80 transition hover:text-white"
        >
          REVIEWS
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-2 py-1 text-xs tracking-[0.22em] text-white/48 uppercase transition hover:text-purple-100 focus-visible:text-purple-100 focus-visible:outline-none sm:px-3"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
