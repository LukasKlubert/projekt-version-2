---
name: Dotažení první verze
overview: Seznam míst, kde appka Fokus slibuje víc, než dnes skutečně dělá — dotažení rozpracovaných/mock funkcí před tím, než se otevře cokoliv nového (Hub, fáze 2 apod.).
todos: []
isProject: false
---

## Proč tento plán vznikl

Po auditu a opravě chyb pod kapotou jsme probírali, co dál. Shodli jsme se, že teď nejde o nové nápady, ale o dotažení věcí, které appka uživateli navrhuje v UI, ale reálně nefungují nebo jsou mock. Cíl: aby "první verze" držela slovo v každém rohu, než se řeší cokoliv nového.

## Co dotáhnout (řazeno od nejmenšího k většímu)

- **Ikonky u řádku úkolu na Dashboardu** ([src/components/dashboard/TaskList.tsx](src/components/dashboard/TaskList.tsx)): každý úkol má dnes dvě ikonky navíc k checkboxu — tužku (disabled, "Úprava úkolů zatím není podporována") a časovač (spustí Deep Work timer pro tenhle konkrétní úkol). Obě jsou pozůstatek z dřívějšího záměru, který se nedotáhl. Rozhodnuto: **odstranit obě ikonky**.
  - Tužka pryč — Dashboard neřeší editaci úkolu (text, tier, odhad času). Plánování a přesuny mezi tiery/dny řeší Planner; plnohodnotná editace úkolu patří do Projektu, kde na to bude prostor.
  - Ikonka časovače u jednotlivého úkolu pryč — jediný vstup do Deep Work je velké tlačítko Deep Work na Dashboardu, ne časovač po jednotlivých úkolech. Ověřeno, že to nesedí ani s budoucím vzorem (viz v1.5 níže): propojení úkol↔Deep Work půjde opačným směrem (nejdřív spustit velký Deep Work, pak uvnitř vybrat úkol), ne z řádku úkolu ven.
  - Výsledek: řádek úkolu je čistě checkbox + text + odhad času, bez rozbitých/duplicitních tlačítek.
  - **Poznámka na později (v1.5, mimo tento plán):** vize je, že po spuštění velkého Deep Work tlačítka půjde uvnitř kliknout na konkrétní úkol, čímž se timer napojí na daný úkol a zobrazí se k němu navázané materiály z Vaultu + reálné statistiky (kolik času šlo na který úkol). Nejde o dotažení něčeho rozbitého, ale o novou funkci — neřeší se v tomto kole.

- **Ambientní zvuky v Deep Worku** ([src/components/](src/components/) — Deep Work overlay): výběr zvuku v UI existuje, ale nic se nepřehraje. Rozhodnuto: **schovat výběr zvuku teď, nic nemazat** — je to nová menší featura (assety/licence, přehrávání na pozadí), ne oprava rozbitého tlačítka. Reálné přehrávání se dotáhne později, kód zůstává, jen se UI dočasně skryje.

- **Časové předvolby (25/50/90 min) v Deep Worku**: doplnit možnost **přidat si vlastní čas** a **dlouhým podržením smazat** existující předvolbu. Nový nápad k času, ne oprava — zvážit rozsah společně s tímto dotažením nebo jako samostatný krok.

- **Mikrofon v Quick Capture** ([src/components/QuickCaptureModal.tsx](src/components/QuickCaptureModal.tsx)): tlačítko disabled, tooltip "Připravujeme". Rozhodnuto: **schovat ikonu teď**, nic nemazat. Hlasový vstup je technicky náročnější kus (Speech API / AI transcript) a Quick Capture funguje dobře i bez něj — patří do v2.0 (viz níže), ne do tohoto dotažení.

- **Osobní Vault — perzistence** (záložka Vault v `/projekty`): nahrávání souborů funguje jen v rámci session, po refreshi zmizí. Potřeba uložit do localStorage jako zbytek appky (nebo jasně UI oznámit, že je to dočasné/demo).

- **Vault — tlačítko "Vygenerovat kartičky" u každého souboru**: v UI existuje u každé položky zvlášť, ale nedělá nic. Rozhodnuto: **odstranit** — je to jak rozbité, tak špatně navržené (mělo by to být jedna akce s výběrem materiálu, ne opakované tlačítko u každého souboru). Náhrada za tuto featuru se neřeší v tomto dotažení, viz v1.5/v2.0 níže.

- **Profil — jméno/level, AI Mentor, návyky** ([src/routes/profil.tsx](src/routes/profil.tsx)): tři různé mock věci, tři různá rozhodnutí.
  - **"Level 7 · Deep Worker"** — natvrdo napsaný titul, žádný systém levelů v appce neexistuje. Rozhodnuto: **schovat/odstranit**. Jméno může zůstat (nebo se řešit editace jména samostatně, není součástí tohoto bodu).
  - **AI Mentor** (text s radami) — celý blok je natvrdo napsaná ukázka. Rozhodnuto: **schovat celý blok teď**, patří do v2.0 spolu s reálnou AI (viz níže).
  - **Návyky** (Ranní deep work / Čtení / Večerní review s procenty) — appka tyto konkrétní návyky nikde nesleduje, čísla jsou vymyšlená. Rozhodnuto: **schovat teď**. Nápad do budoucna (nepromyšlené, jen zapsat): jak bude appka propojenější (v1.5 — úkol↔Deep Work↔čas), půjde stavět reálné statistiky/návyky z reálných dat, ne teď.

- **Sidebar "Dnešní cíl: 3 hodiny"** ([src/components/AppShell.tsx](src/components/AppShell.tsx)): natvrdo napsaná hodnota `"3 hodiny deep work"`, bez vazby na nastavení nebo realitu. Rozhodnuto: **schovat teď** (ne smazat). Skutečný nastavitelný cíl je dobrý nápad na později, viz v1.5 níže.

## Vědomě odloženo (neřeší se v tomto kole)

- Vícetýdenní plánovač (šipky v Planneru) — už je zapsáno v [odloženo_z_auditu_8b8dddbb.plan.md](odloženo_z_auditu_8b8dddbb.plan.md) jako samostatný epic, nemíchat sem.
- Klávesnicová alternativa k drag-and-drop v Planneru — stejně, už zapsáno tam.
- Hub / komunita (fáze 2) — vědomě až po dotažení solo loopu.
- Export/import dat, notifikace, týdenní retrospektiva — nové nápady na příště, ne součást tohoto dotažení.
- **v1.5 vize: propojení Deep Work ↔ konkrétní úkol ↔ Vault materiály** — spustit velký Deep Work, uvnitř vybrat úkol, na kterém se pracuje, a navázat na něj materiály z Vaultu (vázané na projekt/téma) + statistiky odpracovaného času podle úkolu. Souvisí s bodem o ikonkách na Dashboardu výše, ale je to samostatná nová featura pro pozdější verzi, ne oprava. AI v této fázi zůstává na pozadí, bez detailu. Zahrnuje i propojení materiálu na projekt/téma jako takové (bez generování obsahu) — vidět, co k čemu patří.
- **v2.0 vize: AI jako velký pomocník** — pomáhá s úkoly, plánováním, možná automatizuje víc věcí. Zatím jen zapsaná myšlenka, bez rozpracování.
- **v2.0 vize: hlasový vstup v Quick Capture** — reálné rozpoznávání řeči místo dnešní disabled ikony mikrofonu. Zatím jen zapsaná myšlenka, bez rozpracování.
- **v2.0 vize: generování kartiček z materiálu pomocí AI** — nahradí odstraněné tlačítko "Vygenerovat kartičky"; AI přečte materiál z Vaultu a sama vytvoří obsah SM-2 kartiček. Řešit jako jednu funkci najednou s AI, ne rozdělit na mezikrok bez AI dřív.
- **v1.5 vize: napojit tlačítko kalendáře u série** ([src/components/dashboard/StreakHeader.tsx](src/components/dashboard/StreakHeader.tsx)) — ikonka "Přehled aktivity" vedle týdenního kroužku dnes nic nedělá (bez `onClick`). Zapojit na reálný přehled aktivity/kalendář.
- **v1.5 vize: skutečný nastavitelný "Dnešní cíl"** — nahradit schovanou natvrdo hodnotu ve sidebaru reálným cílem, který si uživatel nastaví (a appka ho porovná s reálně odpracovanými minutami).

## Co je jen schované, ne smazané (kontrolní seznam, ať se nezapomene)

Tyto věci zůstávají v kódu, jen se skryje jejich UI. Až se na ně dojde řada (v1.5/v2.0 výše), hledej je zpátky tady:

- Výběr ambientního zvuku v Deep Worku
- Ikona mikrofonu v Quick Capture
- "Level 7 · Deep Worker" v Profilu
- Blok AI Mentor v Profilu
- Sekce Návyky v Profilu
- Sidebar "Dnešní cíl: 3 hodiny"

## Poznámka

Toto je produktové shrnutí, ne technický plán. Až CEO potvrdí rozsah, předává se dál přes `@coo.mdc` k rozpracování Architektem.
