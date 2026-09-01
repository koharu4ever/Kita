import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070c] px-6 text-white">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.14),transparent_34%),linear-gradient(180deg,#05070c,#020617)]"
      />
      <section className="relative z-10 max-w-lg text-center">
        <p className="kita-display text-8xl leading-none text-white/16">404</p>
        <h1 className="mt-3 text-4xl font-semibold">Page not found</h1>
        <p className="mt-4 leading-7 text-white/60">
          This page may have moved, or the requested entry is not published.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/games"
            className="rounded border border-sky-100/35 bg-sky-100/10 px-5 py-3 text-sm tracking-[0.12em] uppercase transition hover:bg-sky-100/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-100"
          >
            Browse games
          </Link>
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
