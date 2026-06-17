import { GamesGallery } from "./games-gallery";

export function GamesPage() {
  return (
    <main className="min-h-screen bg-[#05070c] text-white">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/home-night-sky.jpg')" }}
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_34%),linear-gradient(180deg,rgba(2,6,23,0.72),rgba(2,6,23,0.96))]"
      />

      <section className="relative z-10 mx-auto max-w-[1960px] p-4">
        <GamesGallery />
      </section>
    </main>
  );
}
