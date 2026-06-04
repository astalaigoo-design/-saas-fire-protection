import { describe, expect, it } from "vitest";
import {
  requiredOnboardingSteps,
  type OnboardingStep,
} from "@/lib/dashboard/onboarding";

describe("onboarding required steps", () => {
  it("excludes optional equipment from completion total", () => {
    const steps: OnboardingStep[] = [
      { id: "a", title: "A", description: "", href: "/", done: true },
      {
        id: "equipment",
        title: "Equipment",
        description: "",
        href: "/",
        done: false,
        optional: true,
      },
      { id: "b", title: "B", description: "", href: "/", done: false },
    ];
    const required = requiredOnboardingSteps(steps);
    expect(required).toHaveLength(2);
    expect(required.map((s) => s.id)).toEqual(["a", "b"]);
  });
});
