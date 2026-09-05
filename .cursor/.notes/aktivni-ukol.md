---
title: Stav aktivního produkčního úkolu (lock)
účel: >
  Zabraňuje souběhu dvou produkčních smyček (Architekt→Vývojář→Auditor)
  najednou. COO tento soubor čte před spuštěním smyčky a zapisuje do něj
  po každé změně stavu. Když je Status "VOLNO", smí se spustit nový úkol.
  Kdykoliv jinak, COO nový produkční cyklus odmítne a řekne CEO proč.
---

## Aktuální stav

Status: VOLNO
Zadání: —
Aktuální krok: —
Kolo (Vývojář↔Auditor): 0/5
Spuštěno: —
Poznámka: —

---

## Možné hodnoty Status

- `VOLNO` — nic neběží, lze spustit nový úkol
- `BĚŽÍ` — produkční smyčka je v procesu (Architekt / Vývojář / Auditor)
- `ČEKÁ_NA_ROLI` — smyčka je blokovaná, čeká na vytvoření nové role v jiném chatu (viz aktuální `navrh-nove-role-<datum>.md`)
- `ROLE_VYTVOŘENA` — COO v druhém chatu roli vytvořil, čeká se, až CEO v původním chatu napíše "pokračuj"
- `ZABLOKOVÁNO_MAX_KOL` — Auditor 5× zamítl, smyčka se zastavila, čeká na rozhodnutí CEO v původním chatu
- `ZABLOKOVÁNO_ESKALACE` — Vývojář nahlásil potřebu jiného modelu nebo kritický deadlock, čeká na ruční rozhodnutí CEO
