---
name: audit
description: Komplexní audit celého systému Fokus přes více modelů. Použij pro důkladnou kontrolu před velkými změnami, před publishem nebo po dlouhé pauze v projektu.
icon: shield
color: red
---

# Komplexní audit systému Fokus

Když potřebuješ brutálně důkladnou kontrolu celého projektu — před velkým refaktorem, před nasazením na produkci, po dlouhé pauze, nebo když se nahromadilo víc featur najednou.

Na rozdíl od běžného `/auditor`, který kontroluje jednu konkrétní změnu, tohle je systematická kontrola všeho. Používá víc modelů na různé části, protože každý model má svoje silné stránky a slepá místa.

---

## Postup

### 1. Ujisti se, že máš čistý stav

```powershell
git status
```

Pokud máš necommitnuté změny, commitni je nebo je schováš přes `git stash`, ať víš, co kontroluješ.

---

### 2. První průchod — `gpt-5.6-sol-medium` na logiku a algoritmy

`/auditor` + `Alt+Enter`, vyber model `gpt-5.6-sol-medium`

```
Zkontroluj všechny výpočty v src/lib/:
- SM-2 algoritmus (sm2.ts)
- Série a týdenní progres (app-store.tsx)
- Datové transformace v projects-storage.ts

Hledej:
- hraničí případy (prázdné pole, nula úkolů, minimální ease)
- off-by-one chyby
- chybějící validace vstupu
- nekonzistentní výpočty napříč kódem
```

Poznamenej si nálezy. Pokud GPT něco najde, druhý model to buď potvrdí, nebo vyvrátí.

---

### 3. Druhý průchod — `claude-4.5-sonnet-thinking` na UI a přístupnost

Zůstaň v tom samém chatu, **přepni model** na `claude-4.5-sonnet-thinking` a pokračuj:

```
Teď zkontroluj UI komponenty v src/components/ a src/routes/:
- přístupnost (aria-label, role, navigace klávesnicí)
- responzivita (breakpointy, min-w-0, truncate)
- design tokeny vs hardcoded barvy
- named exporty
- konzistence napříč komponentami
```

---

### 4. Třetí průchod — `claude-opus-5-thinking-high` na architekturu a data

Přepni model na `claude-opus-5-thinking-high`:

```
Zkontroluj architekturu a perzistenci:
- konzistence mezi app-store a projects-storage
- SSR hydratace (čtení localStorage až v useEffect)
- migrace schématu (je verze klíče správná?)
- závislosti mezi komponentami
- místa, kde by změna jednoho souboru mohla rozbít jiný
```

---

### 5. Sjednocený report

Pořád ve stejném chatu:

```
Teď shrň všechny tři kontroly do jednoho reportu:
1. Závažné nálezy (co rozbije aplikaci nebo ztratí data)
2. Rizikové místa (zatím funguje, ale křehké)
3. Doporučené úpravy (kvalita kódu, ne bug)

U každého uvěď, který model to našel, a jestli se modely shodují.
```

---

### 6. Zapiš si to

Ulož report do `.notes/audit-YYYY-MM-DD.md`, ať víš, v jakém stavu projekt byl. Když budeš dělat další audit za měsíc, můžeš porovnat.

---

## Kdy tohle použít

**Ano:**
- Před velkým refaktorem (migrace stavu, změna routingu, přidání backendu)
- Před nasazením na produkci poprvé
- Po dlouhé pauze v projektu (měsíc+)
- Když se nahromadilo 5+ featur bez důkladné kontroly
- Před přidáním dalšího člena do týmu

**Ne:**
- Po každé jednotlivé featuře — na to stačí běžný `/auditor`
- Když spěcháš — tohle trvá
- Když máš necommitnuté změny — nejdřív commit nebo stash

---

## Poznámky

Proč tři modely a ne jeden? Protože každý má jinou perspektivu:
- GPT je silný na matematiku a edge cases
- Sonnet je rychlý a vidí vzory v UI
- Opus má nejhlubší reasoning a najde zapeklité závislosti

A protože běží v jednom chatu, každý další model vidí, co našel předchozí — takže se buď nálezy potvrdí (pak je to vážné), nebo vyvrátí (false positive).
