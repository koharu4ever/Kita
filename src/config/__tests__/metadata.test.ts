import { describe, expect, it } from "vitest";

import { pageMetadata } from "@/config/metadata";

describe("page metadata", () => {
  it("keeps a detail page's canonical and social identity aligned", () => {
    const metadata = pageMetadata(
      "Persona 3 | Kita",
      "A personal review.",
      "/reviews/P3F",
      "/P3F.jpg",
      "article",
    );
    expect(metadata.alternates?.canonical).toBe(
      "https://kita.kral-koharu.com/reviews/P3F",
    );
    expect(metadata.openGraph).toMatchObject({
      title: "Persona 3 | Kita",
      description: "A personal review.",
      url: "https://kita.kral-koharu.com/reviews/P3F",
      type: "article",
      images: ["https://kita.kral-koharu.com/P3F.jpg"],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("preserves pagination in canonical URLs without inventing an image", () => {
    const metadata = pageMetadata(
      "Reviews — Page 2 | Kita",
      "Reviews",
      "/reviews?page=2",
    );
    expect(metadata.alternates?.canonical).toBe(
      "https://kita.kral-koharu.com/reviews?page=2",
    );
    expect(metadata.openGraph).not.toHaveProperty("images");
  });
});
