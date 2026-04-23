import { describe, expect, it } from "vitest";

import {
  hasVoiceAccess,
  isSubscriptionActive,
} from "../subscription-access.js";

describe("subscription-access", () => {
  it("allows voice access only for AI_PRO and LIFETIME plans", () => {
    expect(hasVoiceAccess("AI_PRO")).toBe(true);
    expect(hasVoiceAccess("LIFETIME")).toBe(true);
    expect(hasVoiceAccess("CORE")).toBe(false);
    expect(hasVoiceAccess(null)).toBe(false);
  });

  it("treats ACTIVE and TRIALING as active subscription statuses", () => {
    expect(isSubscriptionActive("ACTIVE")).toBe(true);
    expect(isSubscriptionActive("TRIALING")).toBe(true);
    expect(isSubscriptionActive("PAST_DUE")).toBe(false);
    expect(isSubscriptionActive("CANCELED")).toBe(false);
    expect(isSubscriptionActive(null)).toBe(false);
  });
});
