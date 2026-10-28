import { pageMetadata } from "@/config/metadata";

import { AboutPage as AboutFeaturePage } from "@/features/about/components/about-page";

export const metadata = pageMetadata(
  "About | Kita",
  "Meet Kita, a personal space for games, visual novels, reviews, and useful finds.",
  "/about",
);

export default function AboutPage() {
  return <AboutFeaturePage />;
}
