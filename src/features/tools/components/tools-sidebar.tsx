import Link from "next/link";

const navItems = [
  { href: "/reviews", label: "REVIEWS" },
  { href: "/games", label: "GAMES" },
  { href: "/", label: "HOME" },
  { href: "/about", label: "ABOUT" },
] as const;

export function ToolsMobileNav() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-[#315d00] bg-[#101827]/95 px-3 py-3 backdrop-blur lg:hidden">
      <nav aria-label="Tools section navigation">
        <ul className="grid grid-cols-4 gap-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block border border-[#9aff00]/45 bg-black px-1 py-2 text-center text-xs leading-none font-bold text-[#9aff00] transition-colors active:bg-[#9aff00] active:text-black sm:text-sm"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function ToolsSidebar() {
  return (
    <aside className="hidden min-h-screen w-[280px] shrink-0 items-center justify-center bg-[#315d00] p-4 lg:flex">
      <nav aria-label="Tools section navigation">
        <ul className="flex flex-col items-start gap-[2.5vmin]">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="group inline-flex bg-black">
                <span className="block border-[3px] border-black bg-white px-4 py-2 text-[5vmin] leading-none font-extrabold text-black transition-transform duration-200 ease-out group-hover:-translate-x-1.5 group-hover:-translate-y-1.5 group-active:translate-x-0 group-active:translate-y-0 md:text-4xl">
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
