import { describe, expect, it } from "vitest";
import { formatCharacterCount } from "./format";

describe("formatCharacterCount", () => {
  it("uses singular grammar for one character", () => {
    expect(formatCharacterCount(1)).toBe("1 character");
  });

  it("uses plural grammar otherwise", () => {
    expect(formatCharacterCount(0)).toBe("0 characters");
    expect(formatCharacterCount(2)).toBe("2 characters");
  });
});
