import { useEffect, useState } from "react";
import { FileText, Globe, Image as ImageIcon, Lock, Trash2, Upload } from "lucide-react";
import { readVault, writeVault, type VaultDoc } from "@/lib/vault-storage";

export function Vault() {
  const [docs, setDocs] = useState<VaultDoc[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDocs(readVault());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeVault(docs);
  }, [docs, hydrated]);

  const toggleVisibility = (id: string) =>
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, public: !d.public } : d)));

  const remove = (id: string) => setDocs((prev) => prev.filter((d) => d.id !== id));

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-input bg-surface/40 px-4 py-3 text-center transition-colors hover:border-primary/60">
        <Upload className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-sm font-medium">Nahraj studijní materiály</span>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          PDF, obrázky nebo text — max 25 MB
        </span>
        <input
          type="file"
          className="hidden"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            setDocs((prev) => [
              ...files.map((f, i) => ({
                id: `n${Date.now()}${i}`,
                name: f.name,
                type: (f.type.startsWith("image")
                  ? "img"
                  : f.name.endsWith(".pdf")
                    ? "pdf"
                    : "txt") as VaultDoc["type"],
                size: `${Math.max(1, Math.round(f.size / 1024))} kB`,
                public: false,
                tags: [],
              })),
              ...prev,
            ]);
          }}
        />
      </label>

      <ul className="overflow-hidden rounded-2xl border border-border bg-surface/40">
        {docs.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-3 border-b border-border px-3 py-2.5 transition-colors last:border-b-0 hover:bg-surface-2/50"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2">
              {d.type === "img" ? (
                <ImageIcon className="h-4 w-4 text-focus" />
              ) : (
                <FileText className="h-4 w-4 text-primary" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{d.name}</p>
              <p className="text-[11px] text-muted-foreground">{d.size}</p>
            </div>

            <div className="hidden min-w-0 flex-1 flex-wrap gap-1.5 md:flex">
              {d.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => toggleVisibility(d.id)}
                  aria-label={d.public ? "Veřejné" : "Soukromé"}
                  className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                >
                  {d.public ? (
                    <Globe className="h-4 w-4 text-success" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </button>
                <span className="pointer-events-none absolute right-0 top-full z-20 mt-1 whitespace-nowrap rounded-lg bg-surface-2 px-2 py-1 text-[11px] text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {d.public
                    ? "Veřejné — viditelné pro ostatní v Hubu"
                    : "Soukromé — vidíš pouze ty"}
                </span>
              </div>

              <button
                type="button"
                onClick={() => remove(d.id)}
                aria-label="Smazat soubor"
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
