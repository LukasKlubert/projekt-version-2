---
name: novy-ukol
description: Postup od zadání v .notes/ k hotové featuře ve Fokus - návrh, implementace, kontrola, commit. Použij při zahájení práce na nové featuře.
icon: rocket
color: green
---

# Nová featura ve Fokus

Postup, který provede zadání celým týmem. Cílem je, aby se nezapomnělo na návrh před kódem a na kontrolu po něm.

## 1. Zadání

Zadání bývá v `.notes/` ve formátu podle `.notes/sablona.md`. Přečti si ho celé, včetně sekce „Moje myšlenky a poznámky" — bývají tam omezení, která v úkolech nejsou.

Pokud zadání neexistuje nebo je jednovětné, zeptej se na chybějící části dřív, než se začne cokoli psát. Nejčastěji chybí: co se má stát s existujícími daty a jak se featura chová na úzkém displeji.

## 2. Návrh

Otevři Custom Mode **Architekt** (`Alt+Enter`) a nech si vrátit plán: datový model, kroky s konkrétními soubory, testy, rizika.

U triviální změny (přejmenování textu, úprava odsazení) tenhle krok přeskoč — návrh by trval déle než oprava.

Plán si nech schválit uživatelem, než se implementuje. Návrh, který nikdo nepřečetl, je jen zdržení.

## 3. Implementace

V hlavním chatu zavolej `/impl` a předej mu schválený plán. Ne zadání — plán. Implementátor má vědět, co má napsat, ne co si má rozmyslet.

Pokud je featura velká, rozděl ji na dvě až tři volání podle kroků z plánu, ať se dá průběžně kontrolovat.

## 4. Kontrola

Spusť `npm run lint` a `npm test`.

Otevři Custom Mode **Reviewer** (`Alt+Enter`) a nech si zkontrolovat diff. Blokující nálezy oprav přes `/impl`, pak nech zkontrolovat znovu.

Ručně otevři dotčenou obrazovku v `npm run dev` a zkus i chování, které testy nepokrývají: reload stránky (přežila data?), úzké okno, prázdný stav.

## 5. Commit

```
git add -A
git commit -m "Strucny popis toho, co featura umi"
```

Commituj až po zelených testech. Rozbitý commit je horší než žádný, protože se na něj nedá vrátit.
