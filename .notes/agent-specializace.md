# Specializace AI modelů v Cursor

## Dostupné modely

### Claude modely (Anthropic)

#### claude-4.5-sonnet-thinking (default)
- **Nejlepší pro**: Komplexní úkoly, architekturu, plánování, debugging
- **Charakteristika**: Vyvážený poměr rychlost/kvalita, vynikající reasoning
- **Role**: Všestranný, výchozí volba pro většinu úkolů

#### claude-opus-5-thinking-high
- **Nejlepší pro**: Nejtěžší úkoly, hluboká analýza kódu, kritické refaktoring
- **Charakteristika**: Nejvyšší kvalita, nejpomalejší, nejdražší
- **Role**: "Senior architekt" - složité architektonické rozhodnutí

### GPT modely (OpenAI)

#### gpt-5.6-sol-medium
- **Nejlepší pro**: Náročné úkoly vyžadující reasoning, matematika, logika
- **Charakteristika**: Velmi kvalitní pro analytické úkoly
- **Role**: "Analytik" - složité výpočty, algoritmy

#### gpt-5.4-mini-medium
- **Nejlepší pro**: Rychlé úpravy, jednoduché změny, opakující se úkoly
- **Charakteristika**: Rychlý, levný, kvalitní pro běžné úkoly
- **Role**: "Junior developer" - rutinní coding práce

### Grok modely (xAI/Cursor)

#### cursor-grok-4.6-medium
- **Nejlepší pro**: Explorační úkoly, rychlé experimenty
- **Charakteristika**: Rychlý, kreativní přístup
- **Role**: "Explorer" - prozkoumávání nových konceptů

#### cursor-grok-4.5-high-fast
- **Nejlepší pro**: Rychlé iterace, prototypování
- **Charakteristika**: Velmi rychlý při zachování kvality
- **Role**: "Rapid prototyper" - rychlé MVP

### Gemini modely (Google)

#### gemini-3.6-flash-high
- **Nejlepší pro**: Rychlé odpovědi, search úkoly, dokumentace
- **Charakteristika**: Velmi rychlý, dobrý pro multimodální úkoly
- **Role**: "Documentation writer" - psaní docs, komentářů

#### gemini-3-flash
- **Nejlepší pro**: Nejrychlejší jednoduché úkoly
- **Charakteristika**: Bleskurychlý, levný, základní kvalita
- **Role**: "Code formatter" - formátování, jednoduché úpravy

### Composer model (Cursor)

#### composer-2.5-fast
- **Nejlepší pro**: Multi-file editing, refaktoring napříč soubory
- **Charakteristika**: Specializovaný na práci s více soubory najednou
- **Role**: "Refactoring specialist" - velkoplošné změny

---

## Doporučení podle typu úkolu

### Architektura & Plánování
- `claude-opus-5-thinking-high`
- `claude-4.5-sonnet-thinking`

### Debugging složitých bugů
- `claude-4.5-sonnet-thinking`
- `gpt-5.6-sol-medium`

### Běžné coding úkoly
- `claude-4.5-sonnet-thinking` (default)
- `gpt-5.4-mini-medium`

### Rychlé úpravy
- `gemini-3.6-flash-high`
- `gpt-5.4-mini-medium`

### Explorační úkoly
- `cursor-grok-4.6-medium`

### Dokumentace
- `gemini-3.6-flash-high`

### Velkoplošný refaktoring
- `composer-2.5-fast`

### Algoritmy & Math
- `gpt-5.6-sol-medium`

---

## Rychlý výběr

| Priorita | Model |
|----------|-------|
| **Kvalita** | claude-opus-5-thinking-high |
| **Vyvážené** | claude-4.5-sonnet-thinking |
| **Rychlost** | gemini-3.6-flash-high |
| **Cena** | gpt-5.4-mini-medium |
| **Refaktoring** | composer-2.5-fast |

---

## Poznámky

- **inherit** - Použije stejný model jako rodičovský agent
- Obecně platí: **Claude 4.5 Sonnet** je nejlepší výchozí volba pro většinu situací
- Pro velmi složité úkoly stojí za to investovat do **Claude Opus 5**
- Pro rychlé experimenty jsou ideální **Grok** nebo **Gemini Flash** modely

---

## vytváření rolí
- Claude 4.5 sonnet thinking ==> levnější a rychlejší než opus
- claude opus 5 thinking high ==> úplně nejlepší na to

Pro vytváření rolí potřebuješ:

Hluboké porozumění úkolu
Schopnost strukturovat instrukce
Promyslet různé situace, kdy se role použije
Vytvořit jasné, ale flexibilní guidelines

---
