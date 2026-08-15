import { lstatSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export function findMismatchedOwner(rootPath, expectedUid) {
  const pendingPaths = [rootPath];

  while (pendingPaths.length > 0) {
    const currentPath = pendingPaths.pop();
    const stats = lstatSync(currentPath);

    if (stats.uid !== expectedUid) {
      return currentPath;
    }

    if (!stats.isDirectory()) {
      continue;
    }

    const childNames = readdirSync(currentPath);

    for (let index = childNames.length - 1; index >= 0; index -= 1) {
      pendingPaths.push(path.join(currentPath, childNames[index]));
    }
  }

  return undefined;
}

export function readProcessLines(procRoot = "/proc") {
  const processLines = [];

  for (const entry of readdirSync(procRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^\d+$/.test(entry.name)) {
      continue;
    }

    try {
      const processPath = path.join(procRoot, entry.name);
      const command = readFileSync(
        path.join(processPath, "comm"),
        "utf8",
      ).trim();
      const argumentsText = readFileSync(
        path.join(processPath, "cmdline"),
        "utf8",
      )
        .split("\0")
        .filter(Boolean)
        .join(" ");
      const processLine = `${command} ${argumentsText}`.trim();

      if (processLine) {
        processLines.push(processLine);
      }
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        ["EACCES", "ENOENT", "EPERM"].includes(error.code)
      ) {
        continue;
      }

      throw error;
    }
  }

  return processLines;
}

export function findConflictingNextProcess(mode, processLines) {
  return processLines.find((processLine) => {
    if (mode === "build") {
      return (
        processLine.startsWith("next-server ") ||
        /\/next(?:\.js)?\s+dev(?:\s|$)/.test(processLine)
      );
    }

    return /\/next(?:\.js)?\s+build(?:\s|$)/.test(processLine);
  });
}
