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
| **Claude Sonnet 5** | Produktový poradce | Thinking ON (Medium) | Proaktivní diskuze s CEO o vylepšeních a nápadech, předání shodnutých nápadů COO. |

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

Toto je jediný milník v celé továrně, kde je podle Zlatého pravidla (sekce 5) povoleno použít Effort: Max — proto se u něj využívá naplno.

Při tomto auditu se aktivují následující modely a provedou nezávislou inspekci:

1.  **Inspektor 1 (Anthropic - Claude Opus 5, Thinking: ON, Effort: Max):**
    *   *Zaměření:* Celková architektonická čistota, logická provázanost a striktní dodržení SOP pravidel definovaných Architektem.
    *   *Důvod modelu:* nejsilnější dostupný Anthropic model pro hlubokou architektonickou analýzu.
2.  **Inspektor 2 (OpenAI - GPT-5.6 Sol, Reasoning: Max):**
    *   *Zaměření:* Kybernetická bezpečnost, zranitelnosti (exploity), sanitizace dat a odolnost edge-cases.
    *   *Důvod modelu:* nezávislý pohled od jiné společnosti než Inspektor 1, eliminace slepých míst; subtilní zranitelnosti vyžadují maximální hloubku uvažování.
3.  **Inspektor 3 (Google - Gemini 3.7 Flash, 1M kontext, Effort: High):**
    *   *Zaměření:* Globální konzistence repozitáře. Hledání mrtvého kódu, osiřelých souborů a zbytečných duplicit napříč celou kódovou bází.
    *   *Důvod modelu a efortu:* síla je v šíři pokrytí (celý repozitář najednou díky 1M kontextu), ne v hloubce jedné úvahy

Syntéza výstupů všech tří inspektorů do jednoho opravného plánu je práce Architekta a spadá do stejné milníkové kategorie jako audit samotný — Architekt při ní smí použít **Effort: High/Max** (viz sekce 6), protože jde o slučování více nezávislých reportů, ne o běžný provoz.

**Poznámka k technické exekuci:** Inspektoři mohou být spuštěni jako subagenti (viz budoucí krok automatizace v `auditor.mdc`), což ale vyžaduje, aby CEO agentovi umožnil přístup ke Claude Opus 5, Gemini 3.7 Flash a GPT-5.6 Sol pro delegaci úkolů

---
**POZNÁMKA PRO AGENTY:**
Tato matice modelů je závazná. Architekt a COO ji sladí s pravidly v `.cursor/rules/` (coo, architekt, vyvojar, auditor, mentor) při každé revizi týmu.

### 5. Zlaté pravidlo pro táhla (Effort & Context Policy)
1. **Zákaz Effort: High/Max v denním provozu:** Úroveň úsilí *High/Max* je vyhrazena výhradně pro milníkový Křížový Audit. Běžná architektura běží striktně na *Effort: Medium*, běžný vývoj na *Thinking: OFF*.
2. **Kontextové okno 1M pouze pro Gemini:** 1M kontext se zapíná výhradně u Gemini 3.7 Flash při masivním čištění front-endu. Ostatní modely pracují ve standardním pásmu 200k–300k.

## 6. Výchozí Effort a výjimky
Standardní nastavení pro běžný provoz je **Effort: Medium** u všech rolí. CEO si výběr modelu a effortu v Cursor UI řídí sám podle svých poznámek — agenti nekontrolují ani neodhadují nastavení UI.

Explicitní výjimky ze standardu Medium:
- **Mentor** → Effort **Low** (čistě pedagogický překlad hotové věci, nulové architektonické riziko).
- **Architekt** → Effort **High** výhradně při syntéze výstupu Komplexního křížového auditu (viz sekce 4) nebo při kritickém deadlocku — ne v běžném provozu.
- **Gemini 3.7 Flash (UI / Kontext vysavač)** → High effort zůstává trvale, viz tabulka v sekci 1.

Mimo tyto výjimky žádná role effort nezvyšuje ani nesnižuje sama od sebe.