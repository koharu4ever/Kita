import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  findConflictingNextProcess,
  findMismatchedOwner,
} from "../dev-workspace-inspection.mjs";

const temporaryDirectories = [];

afterEach(() => {
  for (const temporaryDirectory of temporaryDirectories.splice(0)) {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  }
});

describe("findMismatchedOwner", () => {
  it("accepts matching ownership and reports the first mismatch", () => {
    const temporaryDirectory = mkdtempSync(
      path.join(tmpdir(), "kita-workspace-guard-"),
    );
    temporaryDirectories.push(temporaryDirectory);

    const nestedDirectory = path.join(temporaryDirectory, "nested");
    mkdirSync(nestedDirectory);
    writeFileSync(path.join(nestedDirectory, "artifact"), "test");

    const currentUid = process.getuid();

    expect(findMismatchedOwner(temporaryDirectory, currentUid)).toBeUndefined();
    expect(findMismatchedOwner(temporaryDirectory, currentUid + 1)).toBe(
      temporaryDirectory,
    );
  });
});

describe("findConflictingNextProcess", () => {
  it("detects a development server before a build", () => {
    expect(
      findConflictingNextProcess("build", [
        "next-server next-server (v16.2.7)",
      ]),
    ).toBe("next-server next-server (v16.2.7)");
    expect(
      findConflictingNextProcess("build", [
        "node /workspaces/Kita/node_modules/.bin/next dev",
      ]),
    ).toContain("next dev");
    expect(
      findConflictingNextProcess("build", [
        "node /workspaces/Kita/node_modules/.bin/next build",
      ]),
    ).toBeUndefined();
  });

  it("detects a build before starting a development server", () => {
    expect(
      findConflictingNextProcess("dev", [
        "node /workspaces/Kita/node_modules/.bin/next build",
      ]),
    ).toContain("next build");
    expect(
      findConflictingNextProcess("dev", [
        "node /workspaces/Kita/node_modules/.bin/next dev",
      ]),
    ).toBeUndefined();
  });
});
