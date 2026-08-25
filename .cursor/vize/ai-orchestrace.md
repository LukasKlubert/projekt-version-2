# SOP: Architektura a Orchestrace AI Modelů (Továrna 2026)

Tento dokument definuje absolutní mantinely pro výběr a používání LLM modelů v rámci tohoto projektu. Systém je navržen podle principu "Kombinace místo závislosti" – každý model má striktně vymezenou roli na základě svých fyzikálních limitů a silných stránek. 

Cílem je maximalizovat kvalitu kódu a minimalizovat zbytečné pálení kreditů za "overthinking".

## 1. Aktivní arzenál (Modely, které jsou TRVALE ZAPNUTÉ)
V editoru Cursor smí být pro každodenní běh továrny zapnuté **pouze tyto 4 modely**. Všechny ostatní musí být v nastavení přepnuty na OFF, aby se předešlo duplicitám a plýtvání tokeny.

| Model | Role v továrně | Nastavení (Thinking) | Hlavní úkol |
| :--- | :--- | :--- | :--- |
| **Claude Sonnet 5** | COO / Architekt | OFF pro COO / ON (Medium) pro Architekta | Správa .mdc pravidel, tvorba SOP, rozpad velkého zadání na atomické úkoly. |
| **Cursor Grok 4.6** | Hlavní Vývojář | Fast (Nativní) | Blesková exekuce, psaní logiky, backend. Perfektní přesnost diffů v Cursoru. |
| **Claude Fable 5** | Běžný Auditor | Standard | Rychlá kontrola kódu po Vývojáři, statická analýza, audit bezpečnosti tasku. |
| **Gemini 3.7 Flash** | UI / Kontext vysavač | High effort (1M kontext) | Čištění špagetového kódu (Lovable), CSS, sjednocování UI napříč desítkami souborů. |

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
**INSTRUKCE PRO CTO AGENTA:** 
Na základě tohoto dokumentu okamžitě reviduj a uprav pravidla v adresáři `.cursor` (zejména soubory pro Architekta, Vývojáře a Auditora), aby instrukce a omezení plně odpovídaly této matici.

### 5. Zlaté pravidlo pro táhla (Effort & Context Policy)
1. **Zákaz Effort: High/Max v denním provozu:** Úroveň úsilí *High/Max* je vyhrazena výhradně pro milníkový Křížový Audit. Běžná architektura běží striktně na *Effort: Medium*, běžný vývoj na *Thinking: OFF*.
2. **Kontextové okno 1M pouze pro Gemini:** 1M kontext se zapíná výhradně u Gemini 3.7 Flash při masivním čištění front-endu. Ostatní modely pracují ve standardním pásmu 200k–300k.