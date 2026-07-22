import { describe, expect, it } from "vitest";

import { isAuthenticated } from "../is-authenticated";

type AccessArguments = Parameters<typeof isAuthenticated>[0];

describe("isAuthenticated", () => {
  it("rejects anonymous requests", () => {
    expect(isAuthenticated({ req: { user: null } } as AccessArguments)).toBe(
      false,
    );
  });

  it("allows authenticated requests", () => {
    expect(
      isAuthenticated({ req: { user: { id: 1 } } } as AccessArguments),
    ).toBe(true);
  });
});
