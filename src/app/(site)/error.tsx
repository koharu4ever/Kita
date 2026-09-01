"use client";

import Link from "next/link";

type SiteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SiteError({ reset }: SiteErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070c] px-6 text-white">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_34%),linear-gradient(180deg,#05070c,#020617)]"
      />
      <section className="relative z-10 max-w-lg rounded-lg border border-white/10 bg-slate-950/75 p-8 text-center shadow-2xl shadow-black/40">
        <p className="text-xs tracking-[0.32em] text-sky-100/60 uppercase">
          Request interrupted
        </p>
        <h1 className="mt-4 text-4xl font-semibold">Content is unavailable</h1>
        <p className="mt-4 leading-7 text-white/65">
          Kita could not load this page right now. You can retry the request or
          return to the home page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded border border-sky-100/35 bg-sky-100/10 px-5 py-3 text-sm tracking-[0.12em] uppercase transition hover:bg-sky-100/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-100"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded border border-white/15 px-5 py-3 text-sm tracking-[0.12em] text-white/70 uppercase transition hover:border-white/35 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
