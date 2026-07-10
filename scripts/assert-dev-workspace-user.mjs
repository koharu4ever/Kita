import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import process from "node:process";

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
  const ownershipCheck = spawnSync(
    "find",
    [".next", "!", "-user", String(uid), "-print", "-quit"],
    { encoding: "utf8" },
  );

  if (ownershipCheck.error || ownershipCheck.status !== 0) {
    fail("Unable to verify .next ownership before running the command.");
  }

  const mismatchedPath = ownershipCheck.stdout.trim();

  if (mismatchedPath) {
    fail(
      `Detected a .next entry not owned by the current user: ${mismatchedPath}. Stop Next processes and follow docs/first-priority-next-build-gate-remediation-2026-07-10.md.`,
    );
  }
}

const modeArgument = process.argv.find((argument) =>
  argument.startsWith("--mode="),
);
const mode = modeArgument?.slice("--mode=".length);

if (isBindMountedDevWorkspace && (mode === "build" || mode === "dev")) {
  const processList = spawnSync("ps", ["-eo", "comm=,args="], {
    encoding: "utf8",
  });

  if (processList.error || processList.status !== 0) {
    fail("Unable to inspect active Next.js processes.");
  }

  const processLines = processList.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const activeConflict = processLines.find((line) => {
    if (mode === "build") {
      return (
        line.startsWith("next-server ") ||
        /\/next(?:\.js)?\s+dev(?:\s|$)/.test(line)
      );
    }

    return /\/next(?:\.js)?\s+build(?:\s|$)/.test(line);
  });

  if (activeConflict) {
    fail(
      `Refusing to start Next.js ${mode} while a conflicting process is active: ${activeConflict}`,
    );
  }
}
