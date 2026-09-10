/** Ukládají se jen metadata souboru, ne binární obsah — chování uploadu se nemění. */

export const VAULT_STORAGE_KEY = "fokus-vault-v1";

export type VaultDoc = {
  id: string;
  name: string;
  type: "pdf" | "img" | "txt";
  size: string;
  public: boolean;
  tags: string[];
};

function isVaultDoc(d: unknown): d is VaultDoc {
  if (typeof d !== "object" || !d) return false;
  const doc = d as VaultDoc;
  return (
    typeof doc.id === "string" &&
    typeof doc.name === "string" &&
    (doc.type === "pdf" || doc.type === "img" || doc.type === "txt") &&
    typeof doc.size === "string" &&
    typeof doc.public === "boolean" &&
    Array.isArray(doc.tags) &&
    doc.tags.every((t) => typeof t === "string")
  );
}

/** Bezpečné parsování metadat Vaultu s rozlišením empty/valid/corrupted. */
export function parseVaultSafe(raw: string | null): {
  docs: VaultDoc[];
  status: "empty" | "valid" | "corrupted";
  raw?: string;
} {
  if (!raw) return { docs: [], status: "empty" };

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return { docs: [], status: "corrupted", raw };
    }

    if (!parsed.every(isVaultDoc)) {
      return { docs: [], status: "corrupted", raw };
    }

    return { docs: parsed, status: "valid" };
  } catch {
    return { docs: [], status: "corrupted", raw };
  }
}

/** Načte metadata Vaultu z localStorage. */
export function readVault(): VaultDoc[] {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    return parseVaultSafe(raw).docs;
  } catch {
    return [];
  }
}

export function writeVault(docs: VaultDoc[]): void {
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(docs));
  } catch {
    /* localStorage plný nebo nedostupný */
  }
}
