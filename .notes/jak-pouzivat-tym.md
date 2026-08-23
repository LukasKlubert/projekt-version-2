---
title: Jak používat vývojový tým
author: Lukáš
date: 2026-08-23
---

# Jak používat vývojový tým

Máš tři agenty. Každý umí něco jiného a voláš je jinak.

---

## Jak se zapíná Custom Mode

Architekt a Reviewer běží jako Custom Mode — režim, ve kterém agent zůstane v roli po celý chat. Zapíná se takhle:

1. Napiš do chatu `/` a název role, třeba `/architekt`
2. V roletce nechej položku **zvýrazněnou** — Enter nemačkej
3. Stiskni **`Alt+Enter`**, nebo v položce vyber **„Use as Mode"**

Poznáš to podle **badge v chat inputu**. Enter místo Alt+Enter by roli připojil jen k jedné zprávě, ne k celému chatu.

`Alt+Enter` na prázdném promptu nedělá nic — musí se mačkat až na zvýrazněné položce v roletce.

**Když to nefunguje:**

- Custom Modes jsou dokumentované jako dostupné v **Agents Window** a v CLI. Agents Window otevřeš přes `Ctrl+Shift+P` → „Open Agents Window", zpátky do editoru přes „Open IDE".
- Pokud se role neobjeví ani v roletce po `/`, podívej se v sidebaru do **Customize → Skills**, jestli ji Cursor načetl. Skilly se objevují při startu Cursoru, takže po přidání nového souboru může být potřeba reload okna.

---

## Kdo je kdo

### Architekt — vlastní chat

**Kdy:** Chceš novou featuru a nevíš, jak na to, nebo chceš mít jistotu, že to nerozbije stávající data.

**Jak:**

1. `/architekt` → `Alt+Enter` na zvýrazněné položce
2. V pickeru modelů vyber `claude-opus-5-thinking-high`
3. Napiš, co chceš

**Co dostaneš:** Plán — co se mění, jaká data, kroky s konkrétními soubory, testy, rizika. **Žádný kód.**

Ten chat si nech otevřený a vracej se do něj. Architekt si tak pamatuje svoje předchozí rozhodnutí a nebude si odporovat.

---

### Implementátor — v běžném chatu

**Kdy:** Máš plán a chceš ho realizovat. Nebo jde o drobnost, u které je návrh zbytečný.

**Jak:** V normálním chatu napiš `/impl` a za to zadání.

```
/impl Přidej do profilu kartu s počtem splněných úkolů za tento týden
```

**Co dostaneš:** Napsaný kód, spuštěný lint a testy, na konci shrnutí, co ověřit v prohlížeči.

Umí UI i logiku, sám pozná, o co jde. Model má napevno nastavený, nemusíš nic vybírat.

---

### Reviewer — vlastní chat

**Kdy:** Featura je hotová a chceš kontrolu, než to commitneš.

**Jak:**

1. `/reviewer` → `Alt+Enter` na zvýrazněné položce
2. Vyber model `claude-opus-5-thinking-high`
3. Napiš „zkontroluj změny"

**Co dostaneš:** Nálezy roztříděné na blokující, doporučené a drobnosti. **Nic neopraví** — opravu zadáš Implementátorovi přes `/impl`.

Taky si nech chat otevřený. Reviewer pak pozná, když se stejná chyba vrací.

---

## Dvě zkratky navíc

Napiš v chatu `/` a vyber:

- **`/novy-ukol`** — provede tě celým postupem od zadání po commit, ať na nic nezapomeneš
- **`/pred-commitem`** — kontrolní seznam: lint, testy, typy, ruční ověření

---

## Typický průběh featury

```
1. /architekt + Alt+Enter (režim)
   "Chci přidat export projektů do souboru"
   → dostaneš plán

2. Přečteš plán, souhlasíš

3. V běžném chatu:
   /impl Udělej export podle plánu od architekta
   → napíše kód

4. /reviewer + Alt+Enter (režim)
   "Zkontroluj export"
   → nálezy

5. Případné opravy:
   /impl Oprav chybějící aria-label u tlačítka Export

6. git add -A
   git commit -m "Export projektu do souboru"
```

U drobností (překlep v textu, jiná barva) kroky 1 a 4 klidně přeskoč a jdi rovnou na `/impl`.

---

## Git — co budeš potřebovat

Git je časová osa projektu. Každý commit je bod, na který se dá vrátit.

```powershell
git status                  # co je změněné od posledního commitu
git add -A                  # připrav všechny změny
git commit -m "Popis"       # ulož bod na časové ose
git log --oneline           # historie commitů
```

**Když agent něco pokazí a chceš to vrátit:**

```powershell
git reset --hard HEAD        # zahoď necommitnuté změny, vrať se na poslední commit
git reset --hard HEAD~1      # vrať se o jeden commit zpátky
```

Pozor, `--hard` zahazuje neuloženou práci nenávratně. Proto commituj často — po každé věci, která funguje.

**Nikdy nedělej** `git push --force`, `git rebase` ani `git commit --amend` na už pushnuté commity. Projekt je propojený s Lovable a přepsaná historie tam znamená ztrátu.

---

## Kde co leží

```
.cursor/
├── agents/impl.md              Implementátor
├── skills/
│   ├── architekt/              Custom Mode
│   ├── reviewer/               Custom Mode
│   ├── novy-ukol/              /novy-ukol
│   └── pred-commitem/          /pred-commitem
└── rules/                      konvence projektu, aplikují se samy

.notes/
├── jak-pouzivat-tym.md         tenhle soubor
├── cto-playbook.md             pro CTO chat, když bude přidávat další agenty
├── agent-specializace.md       přehled modelů
└── sablona.md                  šablona pro zadání
```

Pravidla v `.cursor/rules/` se agentům přidávají **automaticky**. Nemusíš je nikam připojovat přes `@`.

---

## Chci dalšího specialistu

Řekni to CTO chatu (tomu hlavnímu, kde jsme tým stavěli, nebo novému) a odkaž ho na `cto-playbook.md`. Je tam všechno, co potřebuje — formáty souborů, šablony a důvody dosavadních rozhodnutí. Nemusí nic dohledávat.
