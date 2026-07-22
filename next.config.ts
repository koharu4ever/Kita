import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

import { env } from "./src/config/env";

const normalizedCwd = process.cwd().replaceAll("\\", "/");
const isBindMountedDevWorkspace = normalizedCwd.startsWith("/workspaces/");
const mediaPublicURL = env.MEDIA_R2_PUBLIC_URL?.trim();

function createMediaRemotePattern(value: string) {
  const url = new URL(value);

  if (url.protocol !== "https:") {
    throw new Error("MEDIA_R2_PUBLIC_URL must use HTTPS.");
  }

  url.hash = "";
  url.pathname = `${url.pathname.replace(/\/$/, "")}/**`;
  url.search = "";

  return url;
}

if (
  isBindMountedDevWorkspace &&
  typeof process.getuid === "function" &&
  process.getuid() === 0
) {
  throw new Error(
    "Refusing to run Next.js as root in the bind-mounted Dev Container workspace. Use the node user.",
  );
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: mediaPublicURL
      ? [createMediaRemotePattern(mediaPublicURL)]
      : [],
  },
  output: "standalone",
  typedRoutes: true,
};

export default withPayload(nextConfig);
