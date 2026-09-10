---
title: CTO playbook - jak rozšiřovat tým projektu Fokus
author: Lukáš + CTO agent
date: 2026-08-23
poznámka k úklidu: >
  Cleaner tento soubor 2026-09-08 vyčistil. Smazána byla sekce "Tým – historický stav
  (Custom Mode / subagent éra)" a sekce "Záložní plán, kdyby Custom Mode nešel použít" —
  obě popisovaly stav týmu z doby před `99d7361`, který dvakrát zastaral: nejdřív ho
  nahradily `.mdc` pravidla, pak COO reálně začal volat skutečné subagenty v
  `.cursor/agents/` (architekt, auditor, vyvojar, vyvojar-velky-kontext, ux-expert) přes
  Task nástroj (viz `coo.mdc` sekce 1 a 4). Ponechání obou sekcí by čtenáře matlo, že
  subagenty se "aktuálně nepoužívají" — opak je pravda. Smazán byl i zastaralý seznam
  konkrétních model slugů (nahrazují ho živá čísla v `ai-orchestrace.md`) a dva mrtvé
  odkazy na neexistující `agent-specializace.md`.
---

"POZNÁMKA PRO AGENTY: Tento dokument obsahuje technické a architektonické standardy naší továrny. V případě jakéhokoliv rozporu je nadřazeným a absolutním dokumentem Ústava.md."

> **Komu je určeno:** dalšímu CTO/koordinačnímu chatu, který převezme projekt Fokus poté, co předchozímu dojde kontext.
>
> **Proč existuje:** postavení tohoto týmu předcházel průzkum projektu a dokumentace Cursoru. Tenhle dokument ten průzkum shrnuje, abys ho nemusel opakovat. Obsahuje i seznam věcí, které dokumentace **neuvádí** — to je nejcennější část, protože právě na nich se dá ztratit nejvíc času nebo si něco vymyslet.

---

## 1. Zaznamenaná rozhodnutí a jejich důvody

Nerozbíjej je bez důvodu. Každé z nich vzniklo z konkrétní úvahy, která se z výsledku sama nepozná.

**Vývojář dělá UI i logiku v jedné roli.** Featury v tomhle projektu skoro vždy sahají do obojího současně (export = tlačítko + generování; statistika = výpočet + zobrazení). Dva agenti se sdíleným checkoutem by se museli koordinovat a mohou si přepsat práci.

**Auditor má jiný model než Vývojář.** Kdo kontroluje na stejném modelu jako autor, má stejná slepá místa — křížová kontrola mezi rodinami modelů odhalí víc. Pro opravdu kritické věci (migrace schématu, velký refaktor) je `komplexni-audit.mdc`, který systematicky používá tři modely od tří různých firem.

**Architekt, Vývojář a Auditor nepíšou/nemažou nic mimo svou kompetenci.** U subagentů (`.cursor/agents/`) je `readonly: true` technické vynucení (Auditor, UX expert); u ostatních rolí je to jen instrukce v promptu.

**Role definujeme podle práce, model přiřazujeme až potom.** Opačný postup (jedna role na každý dostupný model) vyrobí role, které se nikdy nepoužijí.

**Tým je záměrně malý.** Dokumentace Cursoru doporučuje začít se dvěma až třemi rolemi a přidávat jen při jasném novém use case; jako anti-pattern uvádí „50+ subagentů s vágními instrukcemi". Přínos subagenta je izolace kontextu, ne rychlost — u jednoduchých úloh je hlavní agent rychlejší, a víc paralelních subagentů spotřebuje výrazně víc tokenů.

---

## 2. Ověřená fakta o mechanismech Cursoru

### Subagent — `.cursor/agents/<name>.md`

Markdown s YAML frontmatterem, tělo je systémový prompt. Všechna pole jsou nepovinná.

| Pole            | Typ     | Default         | Význam                                                |
| --------------- | ------- | --------------- | ------------------------------------------------------ |
| `name`          | string  | z názvu souboru | identifikátor, lowercase s pomlčkami                  |
| `description`   | string  | —               | podle tohohle se agent rozhoduje o delegaci           |
| `model`         | string  | `inherit`       | `inherit` nebo konkrétní model ID                     |
| `readonly`      | boolean | `false`         | zakáže editace souborů a stavově měnící shell příkazy |
| `is_background` | boolean | `false`         | běží na pozadí, neblokuje rodiče                      |

Umístění: `.cursor/agents/` (projekt), `~/.cursor/agents/` (uživatel). Kompatibilní i `.claude/agents/` a `.codex/agents/`. Projektoví mají přednost před uživatelskými, `.cursor/` vyhrává nad `.claude/` a `.codex/`.

Vyvolání trojí: automaticky podle `description`, explicitně přes `/name`, nebo přirozeným jazykem („použij subagenta X"), nebo — jak to dělá tenhle projekt — voláním Task nástroje z `coo.mdc`.

Zanoření: hlavní agent a jeho přímí subagenti smějí spustit další subagenty, ale subagent spuštěný subagentem už ne. Tedy jedna úroveň.

Dostupné v editoru, CLI i cloud agentech.

### Skill / Custom Mode — `.cursor/skills/<name>/SKILL.md`

Složka s `SKILL.md`. Název složky **musí** odpovídat poli `name`.

| Pole                       | Povinné | Význam                                                                                                        |
| --------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `name`                     | ano     | lowercase, čísla, pomlčky; shoduje se s názvem složky                                                         |
| `description`              | ano     | podle toho agent určuje relevanci                                                                             |
| `paths`                    | ne      | globy, na které se skill scopuje (čárkami oddělený string nebo YAML seznam)                                   |
| `disable-model-invocation` | ne      | `true` = jen explicitní `/skill-name`, agent si ho sám nevezme                                                |
| `icon`                     | ne      | ikona badge v Custom Mode: `code`, `terminal`, `bug`, `git-branch`, `book-open`, `beaker`, `shield`, `rocket` |
| `color`                    | ne      | právě jedna z: `default`, `green`, `cyan`, `blue`, `purple`, `magenta`, `orange`, `yellow`, `red`, `brand`    |
| `metadata`                 | ne      | libovolné key-value                                                                                           |

Tři způsoby aktivace:

1. automaticky podle `description` (pokud není `disable-model-invocation: true`)
2. ručně přes `/` v chatu a **Enter** — skill se připojí k jedné zprávě
3. jako **Custom Mode** — napsat `/`, vybrat skill v roletce a na zvýrazněné položce stisknout **`Alt+Enter`** (Windows) / `Option+Enter` (Mac), případně zvolit **„Use as Mode"**. Skill pak zůstává v kontextu po celou session, aktivní režim se pozná podle badge v chat inputu.

**Past, na kterou jsme narazili:** `Alt+Enter` na prázdném promptu nedělá nic. Musí se mačkat až na zvýrazněné položce v roletce po `/`. Dokumentace navíc uvádí Custom Modes jako dostupné v **Agents Window** a v **CLI** — běžný side-panel chat v tom výčtu není. Agents Window: `Ctrl+Shift+P` → „Open Agents Window".

Načtené skilly se dají zkontrolovat v sidebaru pod **Customize → Skills**. Objevování je vázané na start Cursoru, takže po přidání souboru může být potřeba reload okna.

Neplatná hodnota `icon` nebo `color` skill neskryje — badge jen spadne na výchozí ikonu blesku.

Volitelné podsložky: `scripts/`, `references/`, `assets/`. Doporučení je držet `SKILL.md` krátký a detaily odsunout do `references/`, protože se načítají progresivně.

Legacy pole `globs` se stále akceptuje jako fallback za `paths`, ale nové skills mají používat `paths`.

### Pravidlo — `.cursor/rules/<name>.mdc`

**Přípona musí být `.mdc`.** Obyčejný `.md` v téhle složce se ignoruje.

| `alwaysApply` | `description` | `globs` | Chování                                                      |
| ------------- | ------------- | ------- | -------------------------------------------------------------- |
| `true`        | —             | —       | vždy v kontextu, ostatní pole se ignorují                    |
| `false`       | —             | zadáno  | auto-attach, když je v kontextu odpovídající soubor          |
| `false`       | zadáno        | —       | agent si pravidlo vytáhne, když ho vyhodnotí jako relevantní |
| `false`       | —             | —       | jen při `@`-mention                                          |

`globs` se oddělují čárkami. Doporučená velikost pod 500 řádků. Precedence: Team → Project → User.

Pravidla neovlivňují Cursor Tab; User Rules se neaplikují na Inline Edit.

Frontmatter musí být **jeden platný YAML blok** (`alwaysApply`, `description`, `globs` v jednom `---...---`), ne dva zřetězené bloky — tuhle chybu měla v srpnu 2026 všech pět původních pravidel, oprava viz `.cursor/.notes/sablona-noveho-agenta.md`.

### Hooks — `.cursor/hooks.json`

Tenhle projekt hooky **nepoužívá**, ale kdyby byly potřeba:

Eventy: `sessionStart`, `sessionEnd`, `preToolUse`, `postToolUse`, `postToolUseFailure`, `subagentStart`, `subagentStop`, `beforeShellExecution`, `afterShellExecution`, `beforeMCPExecution`, `afterMCPExecution`, `beforeReadFile`, `afterFileEdit`, `beforeSubmitPrompt`, `preCompact`, `stop`, `afterAgentResponse`, `afterAgentThought`, plus Tab hooky a `workspaceOpen`.

Per-script pole: `command` (povinné), `type` (`command` | `prompt`), `timeout`, `loop_limit`, `failClosed`, `matcher`.

Exit kódy: `0` úspěch, `2` blokuj akci, jiné = hook selhal a akce **pokračuje** (fail-open, pokud není `failClosed: true`).

Častá past: projektový `.cursor/hooks.json` běží z rootu projektu, uživatelský `~/.cursor/hooks.json` z `~/.cursor/`.

Na Windows je enterprise cesta `C:\ProgramData\Cursor\hooks.json`.

---

## 3. Co dokumentace NEUVÁDÍ

Tohle je hlavní důvod existence tohoto dokumentu. Neodvozuj z toho závěry a nevymýšlej si — pokud něco z toho potřebuješ, ověř to experimentem a výsledek sem zapiš.

- **Subagenti nemají pole `tools`.** Allowlist ani denylist nástrojů na úrovni subagenta neexistuje. Subagenti dědí všechny nástroje od rodiče včetně MCP. Jediný přepínač je hrubé `readonly: true`. Granulární omezení jde jen přes hooks (`preToolUse`, `subagentStart`) nebo CLI permissions.
- **Subagenti nemají `icon` ani `color`.** Ta pole patří skillům.
- **Skills nemají pole `model`.** Custom Mode tedy nedokáže model vynutit — uživatel si ho vybírá v pickeru.
- **Cesta `.cursor/commands/`** se v aktuální dokumentaci nevyskytuje. Dokumentovaná je jen složka `commands/` uvnitř pluginu. Pro nová workflow piš skill, případně s `disable-model-invocation: true`, což dá stejné chování jako starý slash command.
- **Argumenty u commandů** (`$ARGUMENTS`) — nedokumentováno. U prompt-based hooků `$ARGUMENTS` dokumentované je, ale to je jiný mechanismus.
- **Kanonická tabulka model ID** se nepublikuje. Dokumentace uvádí jen příklady a formát s parametry v hranatých závorkách: `claude-opus-5[effort=high]`, `claude-opus-5[context=300k]`, `composer-2.5[fast=false]`. Sada parametrů se liší podle modelu. Aktuální seznam modelů, které tenhle tým skutečně používá, je jen v `.cursor/vize/ai-orchestrace.md` — neopisuj ho sem, mění se.

---

## 4. Kdy co použít

| Potřeba                                                                 | Mechanismus                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Role potřebuje izolovaný kontext, pinnutý model, případně běh na pozadí | **subagent** v `.cursor/agents/`                           |
| Role potřebuje dlouhý vlastní chat, kde se rozhodnutí vrství            | **Custom Mode** (skill s `disable-model-invocation: true`) |
| Opakovatelný postup na pár kroků, žádná role                            | **skill** bez `disable-model-invocation`                   |
| Konvence, kterou má znát každý, kdo sáhne na daný soubor                | **pravidlo** v `.cursor/rules/`                            |
| Vynucení, které nesmí jít obejít promptem                               | **hook**                                                   |

Dokumentace k tomu dodává: pokud zakládáš subagenta na jednoúčelovou věc typu „vygeneruj changelog", má to být skill. A pravidlo přidávej teprve, když si všimneš, že agent opakovaně dělá tutéž chybu.

---

## 5. Šablona: nový subagent

```markdown
---
name: nazev-role
description: Jedna věta co dělá. Použij ho, když <konkrétní situace>.
model: claude-sonnet-5
---

Jsi <role> projektu Fokus — studijní „deep work" aplikace na TanStack Start, React 19 a Tailwindu v4.

## Co děláš

<jedna jasná odpovědnost, žádní obecní pomocníci>

## Postup

<konkrétní kroky>

## Čeho se držet

<omezení specifická pro tuhle roli; obecné konvence projektu neopakuj,
ty se doplní automaticky z .cursor/rules/>

Než ohlásíš hotovo, spusť `npm run lint` a `npm test`.
```

Do `description` piš situaci, ne jen popis. Podle ní se agent rozhoduje o automatické delegaci. Fráze typu „use proactively" nebo „always use for" delegaci zvyšují.

## Šablona: nový Custom Mode

```markdown
---
name: nazev-role
description: Jedna věta co dělá. Spouštěj jako Custom Mode ve vlastním chatu.
disable-model-invocation: true
icon: code
color: orange
---

# <Role> projektu Fokus

> **Doporučený model:** `<slug>`. Custom Mode model nevynutí, vyber si ho v pickeru ručně.

<systémový prompt>
```

Název složky se musí shodovat s `name`.

---

## 6. Kontrolní seznam pro přidání specialisty

1. **Ověř, že role opravdu chybí.** Nepřidávej roli, kterou zvládne existující agent s lepším zadáním. Malý tým s ostrými hranicemi funguje líp než široký.
2. **Rozhodni mechanismus** podle tabulky v sekci 4.
3. **Vytvoř soubor** podle šablony. Prompt drž krátký; obecné konvence projektu do něj nekopíruj, ty už jsou v `.cursor/rules/`.
4. **Ověř vyvolání.** U subagenta zkus `/nazev` a zkontroluj, že se chová podle role a že se aplikoval zvolený model. U Custom Mode zkontroluj, že se objeví v nabídce po `Alt+Enter`. Pokud se slug modelu neaplikuje, oprav ho.
5. **Zapiš roli** do tabulky v `README.md` a (u nové modelové role) do `ai-orchestrace.md` sekce 1 — postup je popsaný v `coo.mdc` sekci 5.
6. **Zdůvodni to** v sekci 1 tohoto souboru, pokud jde o netriviální volbu. Rozhodnutí bez důvodu příští CTO rozbije.
7. **Commitni** `.cursor/` i `.notes/` společně.

---

## 7. Mapa projektu Fokus

Studijní „deep work OS" pro jednoho uživatele. Bez backendu a databáze, veškerá data v localStorage.

**Stack:** TanStack Start 1.168 + TanStack Router (file-based), React 19, TypeScript strict, Tailwind v4 (konfigurace přes `@theme` v `src/styles.css`, žádný `tailwind.config.js`), shadcn/ui style new-york, Vitest v prostředí `node`. Projekt je propojený s Lovable.

**Routy:** `/` dashboard se sérií a to-do listem, `/projekty` projekty + Vault + plánovač, `/profil` statistiky a návyky, `/hub` placeholder pro fázi 2.

**Klíčové soubory:**

```
src/lib/app-store.tsx        React Context, klíč fokus-state-v2, pure funkce mustProgress/buildWeek/todayIndex
src/lib/projects-storage.ts  klíč fokus-projects-v2, readProjects/writeProjects + událost fokus-projects-changed
src/lib/sm2.ts               SM-2 algoritmus, známky hard/medium/easy = Anki Again/Hard/Good, min ease 1.3
src/components/projects/     Action (ploché úkoly) vs Study (složky + témata se SM-2)
src/components/planner/      týdenní plánovač, drag and drop, fronta „K opakování"
src/components/ui/           46 shadcn komponent, needitovat
src/routeTree.gen.ts         generovaný, needitovat
```

**Testy:** `src/lib/app-store.test.ts`, `src/lib/sm2.test.ts`, `src/components/projects/types.test.ts`, `src/components/dashboard/StreakHeader.test.tsx` (snapshot přes `renderToStaticMarkup`).

**Konvence:** uživatelské texty a komentáře česky, identifikátory anglicky. Named exporty. Třídy přes `cn()`. Mobile-first včetně vlastního breakpointu `min-[360px]:`.

**Známá nekonzistence:** `StreakHeader.tsx` používá natvrdo psané barvy (`stroke-emerald-500`, `stroke-gray-800`) místo sémantických tokenů. Pravidlo `ui-komponenty.mdc` to označuje za pozůstatek, ne vzor.

**Git:** repozitář byl založen lokálně 2026-08-23, initní commit `05e4a6b`. Ověř před spoléháním na tenhle odstavec, jestli se mezitím nezměnilo napojení na Lovable repozitář.

---

## 8. Rozšíření, o kterých se uvažovalo a zatím se neudělala

- **Automatická delegace.** Cursor umí nechat hlavního agenta vybrat subagenta podle `description`. Dobře napsané `description` znamená, že si CEO nemusí pamatovat, koho přesně volat.
- **Skill na migraci schématu localStorage.** Odloženo, dokud první migrace reálně nenastane. Až přijde, patří sem postup: zvýšit verzi klíče, napsat migrační funkci, otestovat ji na starých datech, ošetřit poškozený JSON.
- **Hooks na automatický lint a test po editaci.** Uživatel je zatím nechtěl. Šlo by přes `afterFileEdit`.
- **Izolované worktree pro subagenty.** Cursor umí dát subagentovi vlastní git worktree. Zajímavé, až by běželo víc implementátorů paralelně; při jednom je to zbytečná režie.
