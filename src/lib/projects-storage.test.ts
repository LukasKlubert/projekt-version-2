import { describe, expect, it } from "vitest";
import { parseProjectsSafe } from "./projects-storage";

describe("parseProjectsSafe", () => {
  it("vrátí empty pro chybějící klíč", () => {
    const result = parseProjectsSafe(null);
    expect(result.status).toBe("empty");
    expect(result.projects).toEqual([]);
    expect(result.raw).toBeUndefined();
  });

  it("vrátí valid pro správná data", () => {
    const validData = JSON.stringify([
      {
        id: "abc",
        name: "Testovací projekt",
        kind: "action",
        color: "bg-primary",
        tasks: [],
        folders: [],
      },
    ]);
    const result = parseProjectsSafe(validData);
    expect(result.status).toBe("valid");
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]?.name).toBe("Testovací projekt");
  });

  it("vrátí corrupted pro nevalidní JSON", () => {
    const invalidJson = '{"projects": [{"id": "abc", "name": "test"';
    const result = parseProjectsSafe(invalidJson);
    expect(result.status).toBe("corrupted");
    expect(result.projects).toEqual([]);
    expect(result.raw).toBe(invalidJson);
  });

  it("vrátí corrupted pro JSON, který není pole", () => {
    const notArray = JSON.stringify({ projects: 5 });
    const result = parseProjectsSafe(notArray);
    expect(result.status).toBe("corrupted");
    expect(result.projects).toEqual([]);
    expect(result.raw).toBe(notArray);
  });

  it("vrátí corrupted pro pole s objekty bez povinných polí", () => {
    const missingFields = JSON.stringify([{ name: "Test" }]);
    const result = parseProjectsSafe(missingFields);
    expect(result.status).toBe("corrupted");
    expect(result.projects).toEqual([]);
  });

  it("vrátí corrupted pro projekty s nevalidním kind", () => {
    const invalidKind = JSON.stringify([
      {
        id: "abc",
        name: "Test",
        kind: "invalid-type",
        tasks: [],
        folders: [],
      },
    ]);
    const result = parseProjectsSafe(invalidKind);
    expect(result.status).toBe("corrupted");
    expect(result.projects).toEqual([]);
  });

  it("normalizuje validní projekty s chybějícími volitelnými poli", () => {
    const minimalProject = JSON.stringify([
      {
        id: "xyz",
        name: "Minimální",
        kind: "study",
      },
    ]);
    const result = parseProjectsSafe(minimalProject);
    expect(result.status).toBe("valid");
    expect(result.projects[0]?.tasks).toEqual([]);
    expect(result.projects[0]?.folders).toEqual([]);
  });

  it("vrátí corrupted pro prázdný string jako id", () => {
    const emptyId = JSON.stringify([
      {
        id: "",
        name: "Test",
        kind: "action",
        tasks: [],
        folders: [],
      },
    ]);
    const result = parseProjectsSafe(emptyId);
    expect(result.status).toBe("corrupted");
  });

  it("zpracuje více projektů najednou", () => {
    const multipleProjects = JSON.stringify([
      { id: "1", name: "Projekt 1", kind: "action", tasks: [], folders: [] },
      { id: "2", name: "Projekt 2", kind: "study", tasks: [], folders: [] },
      { id: "3", name: "Projekt 3", kind: "action", tasks: [], folders: [] },
    ]);
    const result = parseProjectsSafe(multipleProjects);
    expect(result.status).toBe("valid");
    expect(result.projects).toHaveLength(3);
  });

  it("vrátí corrupted pokud jeden z více projektů je nevalidní", () => {
    const mixedValidity = JSON.stringify([
      { id: "1", name: "Validní", kind: "action", tasks: [], folders: [] },
      { id: "", name: "Nevalidní", kind: "action", tasks: [], folders: [] },
    ]);
    const result = parseProjectsSafe(mixedValidity);
    expect(result.status).toBe("corrupted");
  });
});
