import type { ReactNode } from "react";

import { AboutOverlayNav } from "@/features/about/components/about-overlay-nav";

type ContentSectionProps = {
  title: string;
  children: ReactNode;
};

function ContentSection({ title, children }: ContentSectionProps) {
  return (
    <section>
      <h2 className="mb-4 border-b border-[#b768aa] pb-2 text-2xl font-semibold text-[#d79a7e]">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function AboutPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 bg-cover bg-fixed bg-center"
        style={{ backgroundImage: "url('/about-bg.jpg')" }}
      />

      <AboutOverlayNav />

      <main className="relative z-10 mx-auto my-16 max-w-4xl rounded-lg border border-black/50 bg-[#35020990] p-6 shadow-2xl sm:my-24 sm:p-10">
        <div className="space-y-12">
          <h1 className="text-4xl font-bold text-gray-100">ABOUT ME</h1>

          <ContentSection title="1. GOAL OF THE SITE">
            <div className="space-y-4 text-[#fa4347]">
              <p>
                This page is a quiet note about the shape of the site. It is a
                place for visual novels, memories, experiments, and the small
                feelings that are easy to lose if nobody writes them down.
              </p>
              <p>
                The current text is only a placeholder. Later, this area can be
                replaced by a short introduction from Payload CMS while keeping
                the same front-end layout.
              </p>
            </div>
          </ContentSection>

          <ContentSection title="2. WHAT THIS SITE COLLECTS">
            <ul className="list-inside list-disc space-y-2 text-[#fa4347]">
              <li>Personal notes about games, stories, and atmosphere.</li>
              <li>Small reviews that focus on feeling before scoring.</li>
              <li>Tools and experiments that help preserve a memory.</li>
              <li>Fragments that do not fit neatly into a formal article.</li>
            </ul>
          </ContentSection>

          <ContentSection title="3. CURRENT STATUS">
            <div className="space-y-4 text-[#fa4347]">
              <p>
                This first version is intentionally simple. The page is static,
                the navigation is local, and the content is written directly in
                the component so the visual direction can be checked before the
                CMS layer is introduced.
              </p>
            </div>
          </ContentSection>
        </div>
      </main>
    </div>
  );
}
