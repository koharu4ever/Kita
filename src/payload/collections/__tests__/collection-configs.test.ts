import type {
  Access,
  CollectionConfig,
  Field,
  TextareaField,
  TextField,
} from "payload";
import { describe, expect, it } from "vitest";

import { Games } from "../games";
import { Reviews } from "../reviews";
import { Tools } from "../tools";
import { contentEditor } from "../../fields/content-editor";
import {
  validateHttpUrl,
  validateRequiredText,
  validateRequiredTextarea,
  validateSlug,
} from "../../fields/validators";
import { Media } from "../media";

type AccessArguments = Parameters<Access>[0];

const anonymousRequest = { req: { user: null } } as AccessArguments;
const authenticatedRequest = {
  req: { user: { id: 1 } },
} as AccessArguments;

function getAccess(
  config: CollectionConfig,
  operation: keyof NonNullable<CollectionConfig["access"]>,
) {
  const access = config.access?.[operation];

  if (typeof access !== "function") {
    throw new Error(`${config.slug}.${operation} access is not configured`);
  }

  return access;
}

function getField(fields: Field[], name: string): Field {
  const field = fields.find(
    (candidate) => "name" in candidate && candidate.name === name,
  );

  if (!field) {
    throw new Error(`Field ${name} is not configured`);
  }

  return field;
}

function flattenFields(fields: Field[]): Field[] {
  return fields.flatMap((field) => {
    if ("fields" in field && Array.isArray(field.fields)) {
      return [field, ...flattenFields(field.fields)];
    }

    return [field];
  });
}

function isRequiredStringField(
  field: Field,
): field is (TextField | TextareaField) & { required: true } {
  return (
    (field.type === "text" || field.type === "textarea") &&
    field.required === true
  );
}

describe.each([Games, Media, Reviews, Tools])(
  "$slug write access",
  (config) => {
    it.each(["create", "update", "delete"] as const)(
      "rejects anonymous %s requests",
      (operation) => {
        expect(getAccess(config, operation)(anonymousRequest)).toBe(false);
      },
    );

    it.each(["create", "update", "delete"] as const)(
      "allows authenticated %s requests",
      (operation) => {
        expect(getAccess(config, operation)(authenticatedRequest)).toBe(true);
      },
    );
  },
);

describe("collection read access", () => {
  it("keeps Media publicly readable", () => {
    expect(getAccess(Media, "read")(anonymousRequest)).toBe(true);
  });

  it("keeps Tools publicly readable", () => {
    expect(getAccess(Tools, "read")(anonymousRequest)).toBe(true);
  });

  it("limits anonymous Reviews reads to published documents", () => {
    expect(getAccess(Reviews, "read")(anonymousRequest)).toEqual({
      status: { equals: "published" },
    });
    expect(getAccess(Reviews, "read")(authenticatedRequest)).toBe(true);
  });

  it("limits anonymous Games reads to published documents", () => {
    expect(getAccess(Games, "read")(anonymousRequest)).toEqual({
      publicationStatus: { equals: "published" },
    });
    expect(getAccess(Games, "read")(authenticatedRequest)).toBe(true);
  });
});

describe("collection field configuration", () => {
  it("uses the shared editor for Games and Reviews bodies", () => {
    expect(getField(Games.fields, "body")).toMatchObject({
      editor: contentEditor,
      type: "richText",
    });
    expect(getField(Reviews.fields, "body")).toMatchObject({
      editor: contentEditor,
      type: "richText",
    });
  });

  it("uses the shared slug validator for Games and Reviews", () => {
    expect(getField(Games.fields, "slug")).toMatchObject({
      validate: validateSlug,
    });
    expect(getField(Reviews.fields, "slug")).toMatchObject({
      validate: validateSlug,
    });
  });

  it("uses the HTTP URL validator for Tools and Games links", () => {
    expect(getField(Tools.fields, "url")).toMatchObject({
      validate: validateHttpUrl,
    });

    const links = getField(Games.fields, "links");
    if (!("fields" in links)) {
      throw new Error("Games links is not a field group");
    }

    expect(getField(links.fields, "href")).toMatchObject({
      validate: validateHttpUrl,
    });
  });

  it("keeps the Review rating within the supported range", () => {
    expect(getField(Reviews.fields, "rating")).toMatchObject({
      max: 10,
      min: 0,
      required: true,
      type: "number",
    });
  });
});

describe.each([Games, Media, Reviews, Tools])(
  "$slug required text validation",
  (config) => {
    it("rejects whitespace-only required text and textarea values", () => {
      const requiredStringFields = flattenFields(config.fields).filter(
        isRequiredStringField,
      );

      expect(requiredStringFields.length).toBeGreaterThan(0);

      for (const field of requiredStringFields) {
        if (field.type === "textarea") {
          expect(field.validate).toBe(validateRequiredTextarea);
        } else {
          expect([
            validateHttpUrl,
            validateRequiredText,
            validateSlug,
          ]).toContain(field.validate);
        }
      }
    });
  },
);
