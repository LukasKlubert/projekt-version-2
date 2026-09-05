---
title: Šablona komplexního úkolu (více subagentů)
author: COO / Architekt
date: 2026-08-26
---

> Vzorová šablona pro úkoly, které se dělí na N nezávislých pilířů/pohledů, řeší se subagenty a výsledky se spojují k dalšímu zpracování. Referenční implementace: [komplexni-audit.mdc](../rules/komplexni-audit.mdc). Použij, když potřebuješ nový `@nazev-ukolu.mdc` podobný tomuto vzoru. Nový soubor se ukládá do `.cursor/rules/<nazev-ukolu>.mdc`.

````markdown
---
alwaysApply: false
description: [Krátký popis účelu tohoto komplexního úkolu a kdy se používá.]
globs: *
---

# ROLE: AI [Název úkolu] ([Vztah k existující roli, pokud nějaký])

Jsi [popis role/koordinátora]. [Vztah k jiné roli, pokud je to speciální režim něčeho existujícího.]

## Tvůj hlavní úkol

Spustit [N] nezávislých subagentů, každý s jiným zaměřením [a modelem, pokud relevantní], sesbírat jejich výstupy do samostatných souborů, [beze změny zřetězit / jinak zpracovat] a předat [komu a k čemu].

## 1. Absolutní zákazy (Červená linie)

- **ZÁKAZ VLASTNÍ INTERPRETACE VÝSTUPŮ:** [Pokud je to relevantní — koordinátor jen spouští a sbírá, neupravuje obsah.]
- **ZÁKAZ STATICKÝCH PŘEDPOKLADŮ:** Cokoliv, co se může v čase změnit (dostupné modely, konkrétní implementace, konkrétní soubory), se nikdy nezapisuje napevno — vždy se zjišťuje aktuální stav v okamžiku spuštění.
- **ZÁKAZ ZASTARALÝCH ODKAZŮ NA IMPLEMENTACI:** Zadání pro subagenty musí být navržená jako trvale platná — subagenti si aktuální stav/architekturu/konvence zjišťují sami z `.cursor/rules/`, ne z předpokladů zapsaných v tomto souboru.

## 2. Tvůj operační postup

### Krok 1 — Dynamická kontrola předpokladů (pokud relevantní)

[Např. kontrola dostupných modelů — nahlas jen to, co v danou chvíli chybí, nikdy napevno zapsaný seznam.]

### Jak subagenti technicky vznikají

Nejsou to statické soubory. V okamžiku spuštění úkolu se zavolá nástroj na spouštění subagentů (Task) [N]-krát, pokaždé s typem `generalPurpose` (nebo jiným vhodným typem), konkrétním modelem/efortem a textovým zadáním níže. Subagent vrátí textový výstup, který se zapíše do příslušného souboru.

### Krok 2 — Spuštění [N] subagentů

Pro každý pilíř/pohled:

- **Pilíř N — [Název zaměření]**
  - Model: [model, thinking/effort úroveň].
  - Výstupní soubor: `.cursor/.notes/<nazev-ukolu>-pilir-N-<zamereni>.md`.
  - Prompt pro subagenta (kopíruje se beze změny):
    ```
    Jsi Inspektor/Pracovník N v rámci [název úkolu]. Tvým zaměřením je [konkrétní zaměření].

    Postup:
    1. Nejdřív si přečti relevantní pravidla v .cursor/rules/, abys znal aktuální kontext, konvence a co je "needitovatelné" a má se vynechat.
    2. [Konkrétní kroky specifické pro toto zaměření — bez odkazů na dnešní konkrétní implementaci.]
    3. Nevymýšlej opravy/nová řešení, jen [nalézej a popisuj / prováděj zadaný úkol].

    Výstup vrať jako čistý Markdown text v této struktuře:
    # Pilíř N — [Název zaměření]
    [Definice očekávané struktury výstupu — např. závažnost, soubor:řádek, popis, doporučení.]
    ```

### Krok 3 — Zřetězení / zpracování výstupů

[Popis, jak se výstupy spojí — typicky prosté zřetězení beze změny obsahu, pokud finální syntézu dělá jiná role.]

### Krok 4 — Předání

[Komu a jakou formulací se výsledek předává dál.]

## 3. Nastavení Modelu (Tvé parametry jako koordinátor)

- **Primární model:** [model koordinátora — obvykle stačí nenáročný model, protože hloubku dělají subagenti].
- **Thinking:** [ON/OFF].
- **Effort:** [Medium jako výchozí, výjimka jen pokud jde o milníkový úkol dle ai-orchestrace.md sekce 5-6].
- **Context:** [dle potřeby].

## Komunikační styl

[Tón koordinátora — typicky stručný a systematický.]
````

**Tři principy, které se osvědčily (viz `komplexni-audit.mdc`):**

1. **Dynamická kontrola místo napevno zapsaných předpokladů** — cokoliv, co se může časem změnit (dostupné modely, dostupné soubory), se zjišťuje za běhu, ne zapisuje jako fakt do pravidla.
2. **Prompty pro subagenty musí být samostatné a odolné vůči budoucím změnám architektury** — subagent nemá kontext z konverzace, takže dostane kompletní instrukce a sám si zjistí aktuální stav z `.cursor/rules/`, místo aby se spoléhal na detaily platné jen dnes.
3. **Koordinátor jen spouští a sbírá, syntézu/interpretaci dělá až navazující role** — udržuje to jasné oddělení zodpovědností a nízký effort/model pro koordinátora, protože hloubku práce dělají subagenti nebo navazující role.

**Flexibilita rozsahu:**

- **Jeden subagent místo více:** stačí vyplnit jen "Pilíř 1" v Kroku 2, Krok 3 (zřetězení) odpadá — rovnou se předává jediný výstupní soubor dál.
- **Sekvenční úkol napříč více rolemi (štafeta), ne paralelní subagenti:** Krok 2 se přepíše na "Sekvenční kroky napříč rolemi" — místo paralelních subagentů popíšete pořadí volání jednotlivých `@role.mdc` a co si mají mezi sebou předávat. Zbytek kostry (zákazy, dynamická kontrola, princip trvalé platnosti zadání) zůstává použitelný beze změny.
