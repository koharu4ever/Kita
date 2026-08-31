import {
  validations,
  type TextareaFieldValidation,
  type TextFieldSingleValidation,
} from "payload";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REQUIRED_TEXT_MESSAGE =
  "Enter a value containing at least one non-whitespace character.";

function isNonBlankText(value: null | string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export const validateRequiredText: TextFieldSingleValidation = async (
  value,
  options,
) => {
  const defaultResult = await validations.text(value, options);

  if (defaultResult !== true) {
    return defaultResult;
  }

  return isNonBlankText(value) ? true : REQUIRED_TEXT_MESSAGE;
};

export const validateRequiredTextarea: TextareaFieldValidation = async (
  value,
  options,
) => {
  const defaultResult = await validations.textarea(value, options);

  if (defaultResult !== true) {
    return defaultResult;
  }

  return isNonBlankText(value) ? true : REQUIRED_TEXT_MESSAGE;
};

export const validateSlug: TextFieldSingleValidation = async (
  value,
  options,
) => {
  const requiredTextResult = await validateRequiredText(value, options);

  if (requiredTextResult !== true || !isNonBlankText(value)) {
    return requiredTextResult;
  }

  return (
    SLUG_PATTERN.test(value) ||
    "Use lowercase ASCII letters, numbers, and single hyphens between words."
  );
};

export const validateHttpUrl: TextFieldSingleValidation = async (
  value,
  options,
) => {
  const requiredTextResult = await validateRequiredText(value, options);

  if (requiredTextResult !== true || !isNonBlankText(value)) {
    return requiredTextResult;
  }

  const invalidUrlMessage =
    "Enter an absolute URL beginning with http:// or https:// without surrounding whitespace.";

  if (value !== value.trim()) {
    return invalidUrlMessage;
  }

  try {
    const url = new URL(value);

    return (
      ((url.protocol === "http:" || url.protocol === "https:") &&
        url.hostname.length > 0) ||
      invalidUrlMessage
    );
  } catch {
    return invalidUrlMessage;
  }
};
