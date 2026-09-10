import { describe, expect, it } from "vitest";
import { tickTimer } from "@/components/DeepWorkTimer";
import { isValidCustomPresetMinutes } from "@/lib/app-store";

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

describe("isValidCustomPresetMinutes", () => {
  it("odmítne 0", () => {
    expect(isValidCustomPresetMinutes(0)).toBe(false);
  });

  it("odmítne záporné číslo", () => {
    expect(isValidCustomPresetMinutes(-10)).toBe(false);
  });

  it("odmítne desetinné číslo", () => {
    expect(isValidCustomPresetMinutes(25.5)).toBe(false);
  });

  it("odmítne hodnotu nad limitem 180", () => {
    expect(isValidCustomPresetMinutes(181)).toBe(false);
  });

  it("odmítne hodnotu pod limitem 5", () => {
    expect(isValidCustomPresetMinutes(4)).toBe(false);
  });

  it("přijme validní hodnotu uvnitř rozsahu", () => {
    expect(isValidCustomPresetMinutes(45)).toBe(true);
  });

  it("přijme dolní hranici 5", () => {
    expect(isValidCustomPresetMinutes(5)).toBe(true);
  });

  it("přijme horní hranici 180", () => {
    expect(isValidCustomPresetMinutes(180)).toBe(true);
  });
});
