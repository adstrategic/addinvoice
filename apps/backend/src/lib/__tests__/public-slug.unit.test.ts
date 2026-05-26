import { describe, expect, it } from "vitest";
import { buildPublicSlug, parsePublicSlug } from "../public-slug.js";

describe("public-slug", () => {
  describe("buildPublicSlug", () => {
    it("builds inv- prefixed slug for invoice", () => {
      const slug = buildPublicSlug("invoice");
      expect(slug.startsWith("inv-")).toBe(true);
      expect(slug.length).toBeGreaterThan(10);
    });

    it("builds est- prefixed slug for estimate", () => {
      const slug = buildPublicSlug("estimate");
      expect(slug.startsWith("est-")).toBe(true);
    });

    it("builds prop- prefixed slug for proposal", () => {
      const slug = buildPublicSlug("proposal");
      expect(slug.startsWith("prop-")).toBe(true);
    });
  });

  describe("parsePublicSlug", () => {
    it("parses valid invoice slug", () => {
      const slug = "inv-550e8400-e29b-41d4-a716-446655440000";
      expect(parsePublicSlug(slug)).toEqual({
        type: "invoice",
        idPart: "550e8400-e29b-41d4-a716-446655440000",
      });
    });

    it("parses valid estimate slug", () => {
      const slug = "est-abc-def";
      expect(parsePublicSlug(slug)).toEqual({
        type: "estimate",
        idPart: "abc-def",
      });
    });

    it("returns null for unknown prefix", () => {
      expect(parsePublicSlug("xyz-123")).toBeNull();
    });

    it("returns null for missing id part", () => {
      expect(parsePublicSlug("inv-")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parsePublicSlug("")).toBeNull();
    });
  });
});
