import { describe, expect, it } from "vitest";
import { parseVaultSafe } from "./vault-storage";

describe("parseVaultSafe", () => {
  it("vrátí empty pro chybějící klíč", () => {
    const result = parseVaultSafe(null);
    expect(result.status).toBe("empty");
    expect(result.docs).toEqual([]);
    expect(result.raw).toBeUndefined();
  });

  it("vrátí valid pro správné pole", () => {
    const validData = JSON.stringify([
      {
        id: "d1",
        name: "poznamky.pdf",
        type: "pdf",
        size: "12 kB",
        public: false,
        tags: ["#zkouška"],
      },
    ]);
    const result = parseVaultSafe(validData);
    expect(result.status).toBe("valid");
    expect(result.docs).toHaveLength(1);
    expect(result.docs[0]?.name).toBe("poznamky.pdf");
  });

  it("vrátí corrupted pro nevalidní JSON", () => {
    const invalidJson = '[{"id": "d1", "name": "test"';
    const result = parseVaultSafe(invalidJson);
    expect(result.status).toBe("corrupted");
    expect(result.docs).toEqual([]);
    expect(result.raw).toBe(invalidJson);
  });

  it("vrátí corrupted pro pole s nevalidní položkou", () => {
    const invalidItem = JSON.stringify([
      {
        id: "d1",
        name: "ok.pdf",
        type: "pdf",
        size: "1 kB",
        public: false,
        tags: [],
      },
      { id: "d2", name: "bez typu" },
    ]);
    const result = parseVaultSafe(invalidItem);
    expect(result.status).toBe("corrupted");
    expect(result.docs).toEqual([]);
    expect(result.raw).toBe(invalidItem);
  });
});
