# SOP: Architektura a Orchestrace AI Modelů (Továrna 2026)

Tento dokument definuje absolutní mantinely pro výběr a používání LLM modelů v rámci tohoto projektu. Systém je navržen podle principu "Kombinace místo závislosti" – každý model má striktně vymezenou roli na základě svých fyzikálních limitů a silných stránek. 

Cílem je maximalizovat kvalitu kódu a minimalizovat zbytečné pálení kreditů za "overthinking".

## 1. Aktivní arzenál (Modely, které jsou TRVALE ZAPNUTÉ)
V editoru Cursor smí být pro každodenní běh továrny zapnuté **pouze tyto 4 modely**. Všechny ostatní musí být v nastavení přepnuty na OFF, aby se předešlo duplicitám a plýtvání tokeny.

Tato tabulka je základní přehled všech rolí v továrně. Když COO nabírá novou specializovanou roli (viz `coo.mdc`, sekce 4), přidá pro ni nový řádek přímo sem — je to jediný zápis do tohoto souboru, který má COO povolený.

| Model | Role v továrně | Nastavení (Thinking) | Hlavní úkol |
| :--- | :--- | :--- | :--- |
| **Claude Sonnet 5** | COO / Architekt | OFF pro COO / ON (Medium) pro Architekta | Správa .mdc pravidel, tvorba SOP, rozpad velkého zadání na atomické úkoly. |
| **Cursor Grok 4.6** | Hlavní Vývojář | Fast (Nativní) | Blesková exekuce, psaní logiky, backend. Perfektní přesnost diffů v Cursoru. |
| **Claude Fable 5** | Běžný Auditor | Standard | Rychlá kontrola kódu po Vývojáři, statická analýza, audit bezpečnosti tasku. |
| **Gemini 3.7 Flash** | UI / Kontext vysavač | High effort (1M kontext) | Čištění špagetového kódu (Lovable), CSS, sjednocování UI napříč desítkami souborů. |

Mimo tento pool stojí **Mentor** (Claude Sonnet 5, Thinking OFF) — nekóduje, nevymýšlí architekturu, jen lidsky vysvětluje CEO, co dělá kód/architektura vytvořená ostatními rolemi. Nepočítá se do "4 zapnutých modelů", protože nepracuje s repozitářem.

## 2. Strategické zálohy (TRVALE VYPNUTÉ, zapínají se manuálně)
Následující modely jsou zakázány pro běžný provoz. Architekt/Uživatel je zapíná pouze na specifické milníky.

*   **Claude Opus 5:** ZAPNUT POUZE pro Komplexní křížový audit před spuštěním projektu (prevence extrémní spotřeby kreditů).
*   **GPT-5.6 Sol:** ZAPNUT POUZE při architektonickém "deadlocku", který Sonnet/Grok nedokáže vyřešit, nebo jako inspektor pro Křížový audit.
*   **GPT-5.6 Terra:** ZAPNUT POUZE jako nouzová záloha při případném výpadku serverů pro Grok 4.6.

---

## 3. Pravidlo pro Vývojáře: Self-Assessment (Sebehodnocení)
Před započetím jakéhokoliv kódování musí agent Vývojář zhodnotit povahu úkolu a doporučit Architektovi/Uživateli správný model pro exekuci:

1.  **Úroveň A (Rutina a přesnost):** Běžné funkce, API, úpravy izolovaných komponent.
    *   *Akce:* Vývojář používá **Cursor Grok 4.6** (kontext 256k bohatě stačí, maximální rychlost).
2.  **Úroveň B (Masivní kontext):** Zásah do globálního design systému, refaktoring velkých bloků kódu z Lovable, kde je nutné načíst 10+ velkých souborů najednou.
    *   *Akce:* Vývojář explicitně zahlásí: *"Tento úkol vyžaduje obří kontext. Přepni mě na **Gemini 3.7 Flash**."*
3.  **Úroveň C (Kritická chyba / Deadlock):** Neřešitelný logický problém nebo selhání při opakovaných pokusech.
    *   *Akce:* Vývojář zahlásí: *"Zásadní architektonický blok. Přepni na **GPT-5.6 Sol** pro hlubokou analýzu."*

---

## 4. Komplexní Křížový Audit (Milník: Před Releasem)
Před finálním nasazením projektu (nebo jeho velké části) se nespouští běžný Fable 5, ale provádí se "Komplexní Křížový Audit". Cílem je využít tři špičkové modely od tří různých společností, aby se eliminovala slepá místa (dataset bias).

Při tomto auditu se aktivují následující modely a provedou nezávislou inspekci:

1.  **Inspektor 1 (Anthropic - Claude Opus 5 s Thinking: High):**
    *   *Zaměření:* Celková architektonická čistota, logická provázanost a striktní dodržení SOP pravidel definovaných Architektem.
2.  **Inspektor 2 (OpenAI - GPT-5.6 Sol s Medium Reasoning):**
    *   *Zaměření:* Kybernetická bezpečnost, zranitelnosti (exploity), sanitizace dat a odolnost edge-cases.
3.  **Inspektor 3 (Google - Gemini 3.7 Flash s 1M kontextem):**
    *   *Zaměření:* Globální konzistence repozitáře. Hledání mrtvého kódu, osiřelých souborů a zbytečných duplicit napříč celou kódovou bází.

---
**POZNÁMKA PRO AGENTY:**
Tato matice modelů je závazná. Architekt a COO ji sladí s pravidly v `.cursor/rules/` (coo, architekt, vyvojar, auditor, mentor) při každé revizi týmu.

### 5. Zlaté pravidlo pro táhla (Effort & Context Policy)
1. **Zákaz Effort: High/Max v denním provozu:** Úroveň úsilí *High/Max* je vyhrazena výhradně pro milníkový Křížový Audit. Běžná architektura běží striktně na *Effort: Medium*, běžný vývoj na *Thinking: OFF*.
2. **Kontextové okno 1M pouze pro Gemini:** 1M kontext se zapíná výhradně u Gemini 3.7 Flash při masivním čištění front-endu. Ostatní modely pracují ve standardním pásmu 200k–300k.

## 6. Model Self-Check Protocol (Kontrola modelu na startu)
Na začátku KAŽDÉHO nového chatu, hned po přečtení své role a **PŘED jakoukoliv analýzou nebo prací na úkolu**, musí agent zkontrolovat, jaký model/Thinking/Effort/Context má uživatel aktuálně nastavený v Cursoru, a porovnat ho se svou vlastní sekcí "Nastavení Modelu" v příslušném `.mdc` souboru.

- **Pokud nastavení nesedí:** Agent to napíše jako úplně první věc v odpovědi (např. *"Máš zapnutý model X, doporučený je Y. Chceš přepnout, nebo mi napiš důvod, proč zůstat na X."*) a počká na rozhodnutí CEO, než se pustí do samotného úkolu.
- **Pokud nastavení sedí:** Agent nic nehlásí a rovnou pokračuje.
- Toto pravidlo platí pro všechny role bez výjimky — i pro Mentora a pro jakoukoliv budoucí novou roli zapsanou do tabulky v sekci 1.

## 7. Effort Reflection (Sebehodnocení náročnosti úkolu)
U každého příchozího úkolu agent v jedné krátké větě na začátku odpovědi (hned po případném Model Self-Checku) uvede odhad náročnosti a doporučený Effort s důvodem — cílem je úspora kreditů a transparentnost nákladu ještě předtím, než se spustí samotná práce.

- Příklad: *"Effort: Medium (rutinní úprava, nevyžaduje High/Max)."*
- Nejde o dotaz navíc ani o blokující krok — je to jen jedna transparentní věta v odpovědi. Práce pokračuje ihned dál, pokud CEO nezasáhne.
- Toto pravidlo doplňuje bod 5 (Zlaté pravidlo pro táhla) — dělá self-assessment viditelným pro CEO u každého jednotlivého úkolu, ne jen jako obecnou politiku.