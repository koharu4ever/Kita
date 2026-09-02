import { type NextRequest, NextResponse } from "next/server";

import { getRandomReviewSlug } from "@/server/reviews/get-reviews";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const excludedSlug = request.nextUrl.searchParams.get("exclude") ?? undefined;
  const slug = await getRandomReviewSlug(excludedSlug);
  const destination = slug ? `/reviews/${slug}` : "/reviews";

  return NextResponse.redirect(new URL(destination, request.url));
}
