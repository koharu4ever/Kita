import type { ReactNode } from "react";

import { ReviewsExperienceShell } from "@/features/reviews/components/reviews-experience-shell";

export default function ReviewsLayout({ children }: { children: ReactNode }) {
  return <ReviewsExperienceShell>{children}</ReviewsExperienceShell>;
}
