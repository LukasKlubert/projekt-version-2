import { describe, expect, it } from "vitest";
import { tickTimer } from "@/components/DeepWorkTimer";

describe("tickTimer", () => {
  it("při zbývající 1 s dokončí interval", () => {
    expect(tickTimer(1)).toEqual({ remaining: 0, justCompleted: true });
  });

  it("při zbývající 0 s nedokončí znovu", () => {
    expect(tickTimer(0)).toEqual({ remaining: 0, justCompleted: false });
  });

  it("při zbývající 30 s odečte sekundu", () => {
    expect(tickTimer(30)).toEqual({ remaining: 29, justCompleted: false });
  });
});
