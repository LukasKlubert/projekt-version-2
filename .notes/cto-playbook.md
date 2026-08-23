---
title: CTO playbook - jak rozšiřovat tým projektu Fokus
author: Lukáš + CTO agent
date: 2026-08-23
---

# CTO playbook

> **Komu je určeno:** dalšímu CTO/koordinačnímu chatu, který převezme projekt Fokus poté, co předchozímu dojde kontext.
>
> **Proč existuje:** postavení tohoto týmu předcházel průzkum projektu a dokumentace Cursoru. Tenhle dokument ten průzkum shrnuje, abys ho nemusel opakovat. Obsahuje i seznam věcí, které dokumentace **neuvádí** — to je nejcennější část, protože právě na nich se dá ztratit nejvíc času nebo si něco vymyslet.

---

## 1. Současný tým

| Role | Mechanismus | Soubor | Vyvolání | Model |
|---|---|---|---|---|
| Architekt | Custom Mode (skill) | `.cursor/skills/architekt/SKILL.md` | `Alt+Enter` → Architekt | ruční výběr, doporučeno `claude-opus-5-thinking-high` |
| Implementátor | subagent | `.cursor/agents/impl.md` | `/impl` v chatu | pinnuto `claude-4.5-sonnet-thinking` |
| Reviewer | Custom Mode (skill) | `.cursor/skills/reviewer/SKILL.md` | `Alt+Enter` → Reviewer | ruční výběr, doporučeno `claude-opus-5-thinking-high` |

Plus dva workflow skills (`novy-ukol`, `pred-commitem`) a pět pravidel v `.cursor/rules/`.

---

## 2. Zaznamenaná rozhodnutí a jejich důvody

Nerozbíjej je bez důvodu. Každé z nich vzniklo z konkrétní úvahy, která se z výsledku sama nepozná.

**Implementátor dělá UI i logiku v jedné roli.** Původní návrh měl dva agenty (`ui-designer`, `logika-tester`). Sloučeny záměrně: featury v tomhle projektu skoro vždy sahají do obojího současně (export = tlačítko + generování; statistika = výpočet + zobrazení). Dva agenti se sdíleným checkoutem by se museli koordinovat a mohou si přepsat práci.

**Architekt a Reviewer jsou Custom Modes, ne subagenti.** Obě role těží z dlouhého vlastního chatu, kde se rozhodnutí a připomínky vrství. Architekt má držet nit („kam patří stav" má platit i pro navazující featury), Reviewer má poznat vracející se chybu. Subagent volaný přes `/` startuje pokaždé s čistým kontextem.

**Reviewer má jiný model než Implementátor.** Recenzent na stejném modelu jako autor má stejná slepá místa. Proto Implementátor Sonnet, Reviewer Opus.

**Architekt ani Reviewer needitují soubory.** Vynucené promptem, ne technicky. U subagenta by šlo použít `readonly: true`; u Custom Mode takové pole neexistuje, takže je to jen instrukce v promptu.

**Role definujeme podle práce, model přiřazujeme až potom.** Opačný postup (jedna role na každý dostupný model) vyrobí role, které se nikdy nepoužijí. Viz `agent-specializace.md` — ta tabulka je referenční přehled modelů, ne návrh týmu.

**Tým je záměrně malý.** Dokumentace Cursoru doporučuje začít se dvěma až třemi rolemi a přidávat jen při jasném novém use case; jako anti-pattern uvádí „50+ subagentů s vágními instrukcemi". Přínos subagenta je izolace kontextu, ne rychlost — u jednoduchých úloh je hlavní agent rychlejší, a pět paralelních subagentů spotřebuje zhruba pětinásobek tokenů.

---

## 3. Ověřená fakta o mechanismech Cursoru

### Subagent — `.cursor/agents/<name>.md`

Markdown s YAML frontmatterem, tělo je systémový prompt. Všechna pole jsou nepovinná.

| Pole | Typ | Default | Význam |
|---|---|---|---|
| `name` | string | z názvu souboru | identifikátor, lowercase s pomlčkami |
| `description` | string | — | podle tohohle se agent rozhoduje o delegaci |
| `model` | string | `inherit` | `inherit` nebo konkrétní model ID |
| `readonly` | boolean | `false` | zakáže editace souborů a stavově měnící shell příkazy |
| `is_background` | boolean | `false` | běží na pozadí, neblokuje rodiče |

Umístění: `.cursor/agents/` (projekt), `~/.cursor/agents/` (uživatel). Kompatibilní i `.claude/agents/` a `.codex/agents/`. Projektoví mají přednost před uživatelskými, `.cursor/` vyhrává nad `.claude/` a `.codex/`.

Vyvolání trojí: automaticky podle `description`, explicitně přes `/name`, nebo přirozeným jazykem („použij subagenta X").

Zanoření: hlavní agent a jeho přímí subagenti smějí spustit další subagenty, ale subagent spuštěný subagentem už ne. Tedy jedna úroveň.

Dostupné v editoru, CLI i cloud agentech.

### Skill / Custom Mode — `.cursor/skills/<name>/SKILL.md`

Složka s `SKILL.md`. Název složky **musí** odpovídat poli `name`.

| Pole | Povinné | Význam |
|---|---|---|
| `name` | ano | lowercase, čísla, pomlčky; shoduje se s názvem složky |
| `description` | ano | podle toho agent určuje relevanci |
| `paths` | ne | globy, na které se skill scopuje (čárkami oddělený string nebo YAML seznam) |
| `disable-model-invocation` | ne | `true` = jen explicitní `/skill-name`, agent si ho sám nevezme |
| `icon` | ne | ikona badge v Custom Mode: `code`, `terminal`, `bug`, `git-branch`, `book-open`, `beaker`, `shield`, `rocket` |
| `color` | ne | právě jedna z: `default`, `green`, `cyan`, `blue`, `purple`, `magenta`, `orange`, `yellow`, `red`, `brand` |
| `metadata` | ne | libovolné key-value |

Tři způsoby aktivace: automaticky podle `description`; ručně přes `/` v chatu (připojí se k jedné zprávě); jako **Custom Mode** přes `Alt+Enter` (Windows) / `Option+Enter` (Mac) — pak skill zůstává v kontextu po celou session.

Volitelné podsložky: `scripts/`, `references/`, `assets/`. Doporučení je držet `SKILL.md` krátký a detaily odsunout do `references/`, protože se načítají progresivně.

Legacy pole `globs` se stále akceptuje jako fallback za `paths`, ale nové skills mají používat `paths`.

### Pravidlo — `.cursor/rules/<name>.mdc`

**Přípona musí být `.mdc`.** Obyčejný `.md` v téhle složce se ignoruje.

| `alwaysApply` | `description` | `globs` | Chování |
|---|---|---|---|
| `true` | — | — | vždy v kontextu, ostatní pole se ignorují |
| `false` | — | zadáno | auto-attach, když je v kontextu odpovídající soubor |
| `false` | zadáno | — | agent si pravidlo vytáhne, když ho vyhodnotí jako relevantní |
| `false` | — | — | jen při `@`-mention |

`globs` se oddělují čárkami. Doporučená velikost pod 500 řádků. Precedence: Team → Project → User.

Pravidla neovlivňují Cursor Tab; User Rules se neaplikují na Inline Edit.

### Hooks — `.cursor/hooks.json`

Tenhle projekt hooky **nepoužívá**, ale kdyby byly potřeba:

Eventy: `sessionStart`, `sessionEnd`, `preToolUse`, `postToolUse`, `postToolUseFailure`, `subagentStart`, `subagentStop`, `beforeShellExecution`, `afterShellExecution`, `beforeMCPExecution`, `afterMCPExecution`, `beforeReadFile`, `afterFileEdit`, `beforeSubmitPrompt`, `preCompact`, `stop`, `afterAgentResponse`, `afterAgentThought`, plus Tab hooky a `workspaceOpen`.

Per-script pole: `command` (povinné), `type` (`command` | `prompt`), `timeout`, `loop_limit`, `failClosed`, `matcher`.

Exit kódy: `0` úspěch, `2` blokuj akci, jiné = hook selhal a akce **pokračuje** (fail-open, pokud není `failClosed: true`).

Častá past: projektový `.cursor/hooks.json` běží z rootu projektu, uživatelský `~/.cursor/hooks.json` z `~/.cursor/`.

Na Windows je enterprise cesta `C:\ProgramData\Cursor\hooks.json`.

---

## 4. Co dokumentace NEUVÁDÍ

Tohle je hlavní důvod existence tohoto dokumentu. Neodvozuj z toho závěry a nevymýšlej si — pokud něco z toho potřebuješ, ověř to experimentem a výsledek sem zapiš.

- **Subagenti nemají pole `tools`.** Allowlist ani denylist nástrojů na úrovni subagenta neexistuje. Subagenti dědí všechny nástroje od rodiče včetně MCP. Jediný přepínač je hrubé `readonly: true`. Granulární omezení jde jen přes hooks (`preToolUse`, `subagentStart`) nebo CLI permissions.
- **Subagenti nemají `icon` ani `color`.** Ta pole patří skillům.
- **Skills nemají pole `model`.** Custom Mode tedy nedokáže model vynutit — uživatel si ho vybírá v pickeru. Proto je u Architekta a Reviewera doporučený model napsaný v těle skillu jako poznámka.
- **Cesta `.cursor/commands/`** se v aktuální dokumentaci nevyskytuje. Dokumentovaná je jen složka `commands/` uvnitř pluginu. Pro nová workflow piš skill, případně s `disable-model-invocation: true`, což dá stejné chování jako starý slash command.
- **Argumenty u commandů** (`$ARGUMENTS`) — nedokumentováno. U prompt-based hooků `$ARGUMENTS` dokumentované je, ale to je jiný mechanismus.
- **Kanonická tabulka model ID** se nepublikuje. Dokumentace uvádí jen příklady a formát s parametry v hranatých závorkách: `claude-opus-5[effort=high]`, `claude-opus-5[context=300k]`, `composer-2.5[fast=false]`. Sada parametrů se liší podle modelu.

### Model slugy použitelné v tomto prostředí

Ověřeno v době psaní (`inherit` je default):

```
claude-4.5-sonnet-thinking
claude-opus-5-thinking-high
composer-2.5-fast
cursor-grok-4.5-high-fast
cursor-grok-4.6-medium
gemini-3-flash
gemini-3.6-flash-high
gpt-5.4-mini-medium
gpt-5.6-sol-medium
```

Popis silných stránek jednotlivých modelů je v `agent-specializace.md`.

---

## 5. Kdy co použít

| Potřeba | Mechanismus |
|---|---|
| Role potřebuje izolovaný kontext, pinnutý model, případně běh na pozadí | **subagent** v `.cursor/agents/` |
| Role potřebuje dlouhý vlastní chat, kde se rozhodnutí vrství | **Custom Mode** (skill s `disable-model-invocation: true`) |
| Opakovatelný postup na pár kroků, žádná role | **skill** bez `disable-model-invocation` |
| Konvence, kterou má znát každý, kdo sáhne na daný soubor | **pravidlo** v `.cursor/rules/` |
| Vynucení, které nesmí jít obejít promptem | **hook** |

Dokumentace k tomu dodává: pokud zakládáš subagenta na jednoúčelovou věc typu „vygeneruj changelog", má to být skill. A pravidlo přidávej teprve, když si všimneš, že agent opakovaně dělá tutéž chybu.

---

## 6. Šablona: nový subagent

```markdown
---
name: nazev-role
description: Jedna věta co dělá. Použij ho, když <konkrétní situace>.
model: claude-4.5-sonnet-thinking
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

## 7. Kontrolní seznam pro přidání specialisty

1. **Ověř, že role opravdu chybí.** Nepřidávej roli, kterou zvládne existující agent s lepším zadáním. Malý tým s ostrými hranicemi funguje líp než široký.
2. **Rozhodni mechanismus** podle tabulky v sekci 5.
3. **Vytvoř soubor** podle šablony. Prompt drž krátký; obecné konvence projektu do něj nekopíruj, ty už jsou v `.cursor/rules/`.
4. **Ověř vyvolání.** U subagenta zkus `/nazev` a zkontroluj, že se chová podle role a že se aplikoval zvolený model. U Custom Mode zkontroluj, že se objeví v nabídce po `Alt+Enter`. Pokud se slug modelu neaplikuje, oprav ho a **zapiš správný tvar do sekce 4** tohoto dokumentu.
5. **Zapiš roli** do tabulky v sekci 1 a do `jak-pouzivat-tym.md`.
6. **Zdůvodni to** v sekci 2, pokud jde o netriviální volbu. Rozhodnutí bez důvodu příští CTO rozbije.
7. **Commitni** `.cursor/` i `.notes/` společně.

---

## 8. Mapa projektu Fokus

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

**Git:** repozitář byl založen lokálně 2026-08-23, initní commit `05e4a6b`. Tenhle adresář **není** naklonovaný Lovable repozitář, takže se s Lovable nesynchronizuje — je to lokální záchranná síť. Pokud bude potřeba skutečný sync, je nutné naklonovat propojený repozitář a pracovat v něm.

---

## 9. Rozšíření, o kterých se uvažovalo a zatím se neudělala

- **Automatická delegace.** Cursor umí nechat hlavního agenta vybrat subagenta podle `description`. Tenhle tým to nevyužívá, protože se třemi rolemi je explicitní `/impl` přehlednější. Až rolí přibude, dobře napsané `description` znamená, že si uživatel nemusí pamatovat, koho volat.
- **Skill na migraci schématu localStorage.** Odloženo, dokud první migrace reálně nenastane. Až přijde, patří sem postup: zvýšit verzi klíče, napsat migrační funkci, otestovat ji na starých datech, ošetřit poškozený JSON.
- **Hooks na automatický lint a test po editaci.** Uživatel je zatím nechtěl. Šlo by přes `afterFileEdit`.
- **Izolované worktree pro subagenty.** Cursor umí dát subagentovi vlastní git worktree. Zajímavé, až by běželo víc implementátorů paralelně; při jednom je to zbytečná režie.
