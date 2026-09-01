import type { Metadata } from "next";

import { AboutPage as AboutFeaturePage } from "@/features/about/components/about-page";

export const metadata: Metadata = {
  title: "About | Kita",
  description:
    "Learn how Kita publishes a curated game catalog and long-form reviews.",
};

export default function AboutPage() {
  return <AboutFeaturePage />;
}
