---
name: Odloženo z auditu
overview: Přehled bodů, které se z tohoto kola auditu vědomě vynechaly nebo zůstaly jako known issue, k pozdějšímu vyřešení.
todos: []
isProject: false
---

## Co se z auditu ignorovalo / odložilo

- **B2 — klávesová alternativa pro drag-and-drop v Planneru** ([src/components/planner/Planner.tsx](src/components/planner/Planner.tsx)): hlavní plánovací workflow (přesun položky z inboxu do slotu/tieru) funguje jen myší. Vyžaduje UX rozhodnutí (klik + výběr cíle, nebo kontextové menu "Přesunout do..."), ne mechanickou opravu — odloženo jako samostatné zadání.
- **Plný multi-týdenní model** ([src/lib/app-store.tsx](src/lib/app-store.tsx), [src/components/planner/Planner.tsx](src/components/planner/Planner.tsx)): `weekOffset` byl jen deaktivovaný (šipky vypnuté, popisek pevně "Tento týden"), ne nahrazený reálným datovým modelem s `weekStart` na `Placement`. Vyžaduje migraci schématu (`fokus-state-v2` → `v3`) a přepočet `itemsIn`/`onDrop` podle týdne — samostatný epic pro Architekta.
- **Typové chyby v `app-store.tsx` (pre-existující, ne z tohoto kola):** `npm exec tsc -- --noEmit` hlásí:
  - TS4111 (`noPropertyAccessFromIndexSignature`) ve `validatePersisted`
  - TS2698 (invalid spread) u `...(hasRolloverChanges && ...)`
  Nejsou blokující, `npm test`/`npm run lint` procházejí, ale build/`tsc` je hlásí. Auditor doporučil je řešit jako samostatný úklidový úkol.
- **Zastaralý řádek v `predani-ceo.md`** (řádek ~353, kopie tabulky rolí z README): stále odkazuje na starou formulaci role Produktového poradce, protože sladění dokumentace (Kolo 5) se explicitně omezilo jen na kopii pravidla a řádek v README, ne na tuto kopii tabulky.

Žádné z těchto bodů se teď neřeší — jen se zapisují, ať se neztratí, než na ně přijde čas.