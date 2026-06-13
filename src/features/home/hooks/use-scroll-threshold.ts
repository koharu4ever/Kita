"use client";

import { useEffect, useState } from "react";

export function useScrollThreshold(viewportRatio: number) {
  const [hasPassedThreshold, setHasPassedThreshold] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasPassedThreshold(
        window.scrollY > window.innerHeight * viewportRatio,
      );
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [viewportRatio]);

  return hasPassedThreshold;
}
