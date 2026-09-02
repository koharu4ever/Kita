import type { ToolkitItem } from "@/features/tools/types/toolkit-item";

// Development-only display samples. Never imported by /tools or written to Payload.
const samples = [
  [
    "VNDB",
    "database",
    "vndb.org",
    "Visual novel titles, releases and reference information.",
  ],
  [
    "SteamDB",
    "database",
    "steamdb.info",
    "Browse game information in a compact resource index.",
  ],
  [
    "PCGamingWiki",
    "database",
    "pcgamingwiki.com",
    "A reference shelf for PC game configuration notes.",
  ],
  ["IGDB", "database", "igdb.com", "Game discovery and catalogue references."],
  [
    "Wikidata",
    "database",
    "wikidata.org",
    "Structured information for exploring connected topics.",
  ],
  [
    "Internet Archive",
    "database",
    "archive.org",
    "A resource entry with a longer title and description to preview the extended archive layout.",
  ],
  [
    "ProtonDB",
    "database",
    "protondb.com",
    "Community compatibility reference.",
  ],
  [
    "MobyGames",
    "database",
    "mobygames.com",
    "Explore a catalogue of games and release history.",
  ],
  ["Wine", "runtime", "winehq.org", "Runtime and compatibility documentation."],
  [
    "Lutris",
    "runtime",
    "lutris.net",
    "A place for game setup and runtime resources.",
  ],
  [
    "Bottles",
    "runtime",
    "usebottles.com",
    "Runtime environments and configuration references.",
  ],
  [
    "Playnite",
    "runtime",
    "playnite.link",
    "Library organisation and launcher resources.",
  ],
  [
    "RetroArch",
    "runtime",
    "retroarch.com",
    "Runtime setup and documentation reference.",
  ],
  [
    "DOSBox",
    "runtime",
    "dosbox.com",
    "Compatibility resources for a retro collection.",
  ],
  [
    "ScummVM",
    "runtime",
    "scummvm.org",
    "Adventure game runtime documentation.",
  ],
  [
    "itch.io",
    "runtime",
    "itch.io",
    "Browse independent game and application resources.",
  ],
  [
    "OBS Studio",
    "capture",
    "obsproject.com",
    "Recording and capture workflow reference.",
  ],
  [
    "ShareX",
    "capture",
    "getsharex.com",
    "Screen capture and image workflow reference.",
  ],
  [
    "FFmpeg",
    "capture",
    "ffmpeg.org",
    "Media conversion and processing documentation.",
  ],
  ["HandBrake", "capture", "handbrake.fr", "Video encoding resources."],
  ["VLC", "capture", "videolan.org", "Playback tools and media references."],
  ["mpv", "capture", "mpv.io", "Media player configuration reference."],
  ["GIMP", "capture", "gimp.org", "Image editing and documentation resources."],
  [
    "Krita",
    "capture",
    "krita.org",
    "Digital painting and artwork workflow reference.",
  ],
  [
    "Anki",
    "text-hooking",
    "apps.ankiweb.net",
    "Language study and flashcard workflow reference.",
  ],
  ["Jisho", "text-hooking", "jisho.org", "Japanese dictionary reference."],
  [
    "Yomitan",
    "text-hooking",
    "yomitan.wiki",
    "Dictionary lookup and reading workflow.",
  ],
  [
    "Textractor",
    "text-hooking",
    "github.com/Artikash/Textractor",
    "Text extraction project reference.",
  ],
  [
    "Ren'Py",
    "text-hooking",
    "renpy.org",
    "Visual novel tooling and documentation.",
  ],
  [
    "LanguageTool",
    "text-hooking",
    "languagetool.org",
    "Writing and language tooling reference.",
  ],
];
const labels: Record<string, string> = {
  database: "Database",
  runtime: "Runtime",
  capture: "Capture",
  "text-hooking": "Text Hooking",
};

export const toolPreviewFixtures: ToolkitItem[] = samples.map(
  ([title, category, destination, summary], index) => ({
    id: `preview-tool-${index + 1}`,
    title,
    summary,
    category: labels[category],
    createdAt: new Date(Date.UTC(2026, 7, 30 - index)).toISOString(),
    addedOn: `2026-08-${String(30 - index).padStart(2, "0")}`,
    source: destination.split("/")[0],
    cover: `/tools/archive/${category}.webp`,
    links: [
      {
        href: `https://${destination}`,
        label: "Open resource",
        note: labels[category],
      },
    ],
  }),
);
