import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const normalizedCwd = process.cwd().replaceAll("\\", "/");
const isBindMountedDevWorkspace = normalizedCwd.startsWith("/workspaces/");

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
  output: "standalone",
  typedRoutes: true,
};

export default withPayload(nextConfig);
