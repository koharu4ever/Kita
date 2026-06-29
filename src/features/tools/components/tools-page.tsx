import type { ToolkitItem } from "@/features/tools/types/toolkit-item";

import { ToolsMobileNav, ToolsSidebar } from "./tools-sidebar";

type ToolsPageProps = {
  items: ToolkitItem[];
};

export function ToolsPage({ items }: ToolsPageProps) {
  return (
    <div className="kita-retro flex min-h-screen flex-col bg-[#101827] text-[#9aff00] lg:flex-row">
      <ToolsMobileNav />

      <main className="relative min-h-screen flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(154,255,0,0.08),transparent_28%),linear-gradient(135deg,rgba(6,12,22,0.95),rgba(12,22,35,0.98))]" />
        <div className="relative z-10 p-8 md:p-16">
          <header className="mb-16 text-center">
            <h1 className="mb-2 text-5xl leading-none md:text-6xl">
              [ My Toolkit ]
            </h1>
            <p className="text-xl text-lime-300/80">
              A collection of visual novel utilities and notes.
            </p>
          </header>

          <div className="space-y-12">
            {items.map((item) => (
              <article key={item.id} id={item.id} className="scroll-mt-12">
                <h2 className="inline-block p-1 text-3xl leading-tight text-[#9aff00] transition-colors hover:bg-lime-900/50">
                  <a href={`#${item.id}`}>
                    {">"} {item.title}
                  </a>
                </h2>
                <p className="mt-2 pl-4 text-sm text-lime-400/65 uppercase">
                  POSTED ON: {item.postedOn}
                </p>
                <p className="mt-4 max-w-5xl pl-4 text-lg leading-relaxed text-lime-300/90">
                  {item.summary}
                </p>
                <ul className="mt-4 space-y-2 pl-4">
                  {item.links.map((link) => (
                    <li key={link.href} className="text-lg leading-relaxed">
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="border-b border-lime-300/40 text-lime-200 hover:bg-lime-300 hover:text-[#101827]"
                      >
                        {link.label}
                      </a>
                      <span className="text-lime-400/75"> :: {link.note}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <footer className="mt-20 border-t border-lime-400/25 pt-8 text-center text-sm text-lime-400/60">
            KITA TOOLKIT / STATIC FRONT-END DRAFT
          </footer>
        </div>
      </main>

      <ToolsSidebar />
    </div>
  );
}
