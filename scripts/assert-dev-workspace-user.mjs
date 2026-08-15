import { existsSync } from "node:fs";
import process from "node:process";

import {
  findConflictingNextProcess,
  findMismatchedOwner,
  readProcessLines,
} from "./dev-workspace-inspection.mjs";

const normalizedCwd = process.cwd().replaceAll("\\", "/");
const isBindMountedDevWorkspace = normalizedCwd.startsWith("/workspaces/");
const uid = typeof process.getuid === "function" ? process.getuid() : undefined;

function fail(message) {
  console.error(`[workspace-user-guard] ${message}`);
  process.exit(1);
}

if (isBindMountedDevWorkspace && uid === 0) {
  fail(
    "Refusing to run a project command as root in the bind-mounted Dev Container workspace. Use the node terminal, or docker exec -u node -w /workspaces/Kita ...",
  );
}

if (
  isBindMountedDevWorkspace &&
  uid !== undefined &&
  process.argv.includes("--check-next") &&
  existsSync(".next")
) {
  let mismatchedPath;

  try {
    mismatchedPath = findMismatchedOwner(".next", uid);
  } catch {
    fail("Unable to verify .next ownership before running the command.");
  }

  if (mismatchedPath) {
    fail(
      `Detected a .next entry not owned by the current user: ${mismatchedPath}. Stop Next processes and follow docs/development.md.`,
    );
  }
}

const modeArgument = process.argv.find((argument) =>
  argument.startsWith("--mode="),
);
const mode = modeArgument?.slice("--mode=".length);

if (isBindMountedDevWorkspace && (mode === "build" || mode === "dev")) {
  let processLines;

  try {
    processLines = readProcessLines();
  } catch {
    fail("Unable to inspect active Next.js processes.");
  }

  const activeConflict = findConflictingNextProcess(mode, processLines);

  if (activeConflict) {
    fail(
      `Refusing to start Next.js ${mode} while a conflicting process is active: ${activeConflict}`,
    );
  }
}
