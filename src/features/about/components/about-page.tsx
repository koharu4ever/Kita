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
          <h1 className="text-4xl font-bold text-gray-100">ABOUT KITA</h1>

          <ContentSection title="1. WHAT KITA IS">
            <div className="space-y-4 text-[#fa4347]">
              <p>
                Kita is a self-hosted game catalog and review publishing
                platform. It keeps a focused record of games, the atmosphere
                around them, and the longer notes that remain after finishing a
                story.
              </p>
              <p>
                Visitors browse published entries. The private editorial side
                stays with the site owner, so the public experience remains a
                small, curated archive rather than an open community platform.
              </p>
            </div>
          </ContentSection>

          <ContentSection title="2. WHAT YOU WILL FIND">
            <ul className="list-inside list-disc space-y-2 text-[#fa4347]">
              <li>
                Game entries with release details, status, and references.
              </li>
              <li>Long-form reviews that preserve a personal point of view.</li>
              <li>Media selected for each catalog entry.</li>
              <li>A small toolkit of useful external resources.</li>
            </ul>
          </ContentSection>

          <ContentSection title="3. HOW IT IS BUILT">
            <div className="space-y-4 text-[#fa4347]">
              <p>
                Next.js and React render the public site. Payload CMS provides
                the authenticated Admin and content foundation, PostgreSQL
                stores the catalog, and Cloudflare R2 serves production media.
                Only published Games and Reviews are available to anonymous
                visitors.
              </p>
            </div>
          </ContentSection>
        </div>
      </main>
    </div>
  );
}
