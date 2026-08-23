---
name: pred-commitem
description: Kontrolní seznam před commitem ve Fokus - lint, testy, typy, ruční ověření. Použij před každým commitem.
icon: beaker
color: cyan
---

# Před commitem

Projdi postupně. Když něco selže, oprav to a začni znovu od začátku — oprava umí rozbít krok, který už prošel.

## 1. Co se vlastně mění

```
git status
git diff
```

Projdi diff řádek po řádku. Hledáš hlavně věci, které tam nemají co dělat: ladicí `console.log`, zakomentovaný kód, náhodně přeformátované soubory, které s úkolem nesouvisí.

Zkontroluj, že nepřibyl `src/routeTree.gen.ts` s ručními úpravami a že se nezměnily soubory v `src/components/ui/`.

## 2. Lint

```
npm run lint
```

Musí projít bez chyb. Varování `react-refresh/only-export-components` se toleruje u souborů, které záměrně exportují i něco jiného než komponentu.

## 3. Testy

```
npm test
```

Všechny musí být zelené. Pokud selhal snapshot, **podívej se do diffu** a rozhodni, jestli je změna zamýšlená. Teprve pak `npx vitest run -u`. Aktualizovat snapshot naslepo znamená zahodit jedinou vizuální kontrolu, kterou projekt má.

Přibyla pure funkce bez testu? Doplň ho teď.

## 4. Typy

Lint typy nekontroluje. Projdi diagnostiku v editoru u změněných souborů a hlídej si běžné pasti tohoto projektu: indexace pole vrací `T | undefined`, optional property nesmí dostat explicitní `undefined`.

## 5. Ruční ověření

```
npm run dev
```

Otevři dotčenou obrazovku a zkus:

- **Reload stránky** — přežila data v localStorage?
- **Úzké okno** (kolem 360 px) — nepřetéká layout?
- **Prázdný stav** — co se zobrazí, když žádná data nejsou?

## 6. Commit

```
git add -A
git commit -m "Strucny popis zmeny"
```

Zpráva popisuje, co se změnilo a proč, ne které soubory. „Oprava vypoctu serie pri odskrtnuti ukolu" je dobrá, „upraveny soubory" ne.
