---
title: Návod — Šablona AI továrny
author: COO / Architekt
date: 2026-08-26
---

> Tohle je přenositelná startovací sada celé "digitální továrny" `.cursor/`. Zkopíruj ji do nového projektu, dosaď placeholdery a máš funkční systém rolí a procesů během několika minut — nemusíš znát historii vzniku ani nic vymýšlet od nuly.

## Co tu je

```
sablona-tovarny/
  NAVOD.md                           <- tento soubor
  README-template.md                 <- vzor pro .cursor/README.md (uvítací brána do systému)
  vize/
    Ustava-template.md                <- vzor pro .cursor/vize/Ústava.md (filozofie systému)
    ai-orchestrace-template.md        <- vzor pro .cursor/vize/ai-orchestrace.md (modelová politika)
    vize-byznysu-template.md          <- prázdná kostra pro .cursor/vize/vize_byznysu.md (tvoje vize)
  rules/
    coo-template.mdc                  <- 6 hotových rolí, jen s placeholder modely
    architekt-template.mdc
    vyvojar-template.mdc
    auditor-template.mdc
    mentor-template.mdc
    produktovy-poradce-template.mdc
  skills/
    komplexni-audit-template.mdc      <- 1 ukázková skill (procedura se 3 subagenty)
  notes/
    sablona-noveho-agenta.md          <- šablona pro vytvoření DALŠÍ role
    sablona-nove-skill.md             <- šablona pro vytvoření DALŠÍ skill
```

## Rozdíl mezi `rules/` a `skills/`

- **`rules/`** = trvalé role/identity — "kdo v továrně pracuje". Každá role má vlastní odpovědnost, zákazy a nadřízeného (COO, Architekt, Vývojář, Auditor, Mentor, Produktový poradce).
- **`skills/`** = jednorázové/opakovatelné procedury, které si libovolná role zavolá na konkrétní úkol — "co továrna umí spustit na zavolání" (např. Komplexní audit — není to osoba, je to proces).
- **`notes/`** = šablony pro vytváření dalších rolí a skills, až budeš systém rozšiřovat.
- **`vize/`** = vizionářské, chráněné dokumenty — určují směr celé firmy, needitují se bez explicitního svolení majitele.

## Postup nasazení

1. **Zkopíruj obsah** této složky jako `.cursor/` do kořene nového projektu (tj. `vize/`, `rules/`, `skills/`, `notes/` se stanou přímo podsložkami `.cursor/`).
2. **Najdi a nahraď placeholdery** napříč všemi soubory:
   - `[NÁZEV_PROJEKTU]` — jméno tvého produktu/firmy
   - `[CEO_JMÉNO]` — tvoje jméno (nebo jméno člověka, co řídí Vrstvu 1)
   - `[MODEL_A]`, `[MODEL_B]`, `[MODEL_C]`, `[MODEL_D]` — 4 modely, které chceš mít trvale zapnuté (dosaď konkrétní modely dostupné v Cursoru v době, kdy sadu nasazuješ — poznámky v hranatých závorkách u každého říkají, jakou sílu má mít)
   - `[MODEL_ZALOHA_1]`, `[MODEL_ZALOHA_2]` — modely pro milníkové audity/deadlocky
3. **Přejmenuj soubory** — odeber příponu `-template` (např. `coo-template.mdc` → `coo.mdc`, `Ustava-template.md` → `Ústava.md`).
4. **Vytvoř `.cursor/rules/sop/`** s vlastními technickými standardy projektu (tech stack, jazykové konvence, testování) — tahle vrstva je vždy specifická pro konkrétní projekt a šablona ji záměrně neobsahuje.
5. **Napiš vlastní vizi** do `vize_byznysu.md` podle kostry v `vize-byznysu-template.md`.
6. **Smaž složku `sablona-tovarny/`** po dokončení nasazení, ať v `.cursor/` nezůstane duplicitní obsah.

## Co šablona záměrně neobsahuje

- Žádné SOP/technické standardy — každý projekt má jiný stack, napiš si vlastní do `rules/sop/`.
- Žádný obsah `vize_byznysu.md` — jen kostru s otázkami, protože byznys vize je nepřenositelná mezi projekty.
