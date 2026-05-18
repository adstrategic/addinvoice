import { describe, expect, it } from "vitest";

import {
  FUNNEL_PATHS,
  getFunnelRedirectPath,
  resolveFunnelStep,
} from "./funnel";

describe("resolveFunnelStep", () => {
  it("returns onboarding when onboarding is not completed", () => {
    expect(
      resolveFunnelStep({
        onboardingCompleted: false,
        subscriptionActive: false,
        hasBusiness: false,
      }),
    ).toBe("onboarding");

    expect(
      resolveFunnelStep({
        onboardingCompleted: false,
        subscriptionActive: true,
        hasBusiness: true,
      }),
    ).toBe("onboarding");
  });

  it("returns subscribe when onboarding is done but subscription is inactive", () => {
    expect(
      resolveFunnelStep({
        onboardingCompleted: true,
        subscriptionActive: false,
        hasBusiness: false,
      }),
    ).toBe("subscribe");
  });

  it("returns setup when onboarding and subscription are done but no business", () => {
    expect(
      resolveFunnelStep({
        onboardingCompleted: true,
        subscriptionActive: true,
        hasBusiness: false,
      }),
    ).toBe("setup");
  });

  it("returns dashboard when all steps are complete", () => {
    expect(
      resolveFunnelStep({
        onboardingCompleted: true,
        subscriptionActive: true,
        hasBusiness: true,
      }),
    ).toBe("dashboard");
  });
});

describe("getFunnelRedirectPath", () => {
  it("returns null when actual step matches page step", () => {
    expect(getFunnelRedirectPath("subscribe", "subscribe")).toBeNull();
  });

  it("returns path for actual step when steps differ", () => {
    expect(getFunnelRedirectPath("onboarding", "setup")).toBe(
      FUNNEL_PATHS.onboarding,
    );
    expect(getFunnelRedirectPath("dashboard", "onboarding")).toBe(
      FUNNEL_PATHS.dashboard,
    );
  });
});
