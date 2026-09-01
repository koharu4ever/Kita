export default function SiteLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070c] px-6 text-white">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_34%),linear-gradient(180deg,#05070c,#020617)]"
      />
      <div className="relative z-10 text-center">
        <p className="kita-display text-6xl leading-none">KITA</p>
        <p
          role="status"
          className="mt-5 animate-pulse text-xs tracking-[0.32em] text-white/55 uppercase motion-reduce:animate-none"
        >
          Loading content
        </p>
      </div>
    </main>
  );
}
