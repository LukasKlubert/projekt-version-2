# Komplexní audit Fokusu — 2026-08-24

## Rozsah a ověření

Audit proběhl ve třech nezávislých průchodech:

- GPT 5.6 Sol: logika, algoritmy, strict TypeScript a edge cases
- Claude 4.5 Sonnet: UI, přístupnost, responzivita a design systém
- Claude Opus 5: architektura, persistence, hydratace a vazby mezi moduly

Stav automatických kontrol:

- `npm test`: 29/29 testů prošlo
- `npm run lint`: 0 chyb, 15 existujících varování `react-refresh/only-export-components`
- `npm exec tsc -- --noEmit`: prošlo bez typových chyb
- `src/routeTree.gen.ts` ani `src/components/ui/**` nemají necommitnuté změny
- jediná původní necommitnutá změna byla uživatelská poznámka v `.notes/moje-napady.md`; aplikační kód neovlivňuje

## Závažné nálezy

### 1. Poškozená projektová data se mohou nevratně přepsat prázdným polem

**Závažnost:** kritická  
**Modely:** GPT + Opus, shoda  
**Soubory:** `src/components/projects/Projects.tsx:26–38`, `src/lib/projects-storage.ts:12–17`

Při chybě parsování nebo normalizace zůstane lokální stav projektů jako `[]`, hydratace se přesto označí za dokončenou a následující efekt zapíše `[]` do stejného klíče. Původní data jsou tím bez zálohy ztracena. Stejný výsledek nastane u validního JSON, který není pole.

**Doporučení:** rozlišit chybějící data od chyby načtení, při chybě zablokovat zápisový efekt a původní hodnotu případně uložit pod záložní klíč.

### 2. Stav `done` je navázán na týdenní placement, ne na konkrétní datum

**Závažnost:** kritická pro integritu série  
**Modely:** Opus, následně ručně ověřeno  
**Soubor:** `src/lib/app-store.tsx:67,110–128,180–190,234–238,279–304`

Dokončení placementu se nikdy neresetuje. Položka ve slotu `anytime`, dokončená v pondělí, je proto dokončená i v úterý. Efekt série může po otevření aplikace přidat další den série bez nové práce. U slotů `Po`–`Ne` se chybný stav opakuje další týden.

**Doporučení:** ukládat dokončení podle lokálního datumového klíče, případně dát placementu konkrétní datum. Série musí vycházet z dokončení aktuálního dne.

### 3. Týdenní historie se nikdy nezapisuje

**Závažnost:** vysoká  
**Modely:** GPT + Opus, shoda  
**Soubor:** `src/lib/app-store.tsx:52–59,74–75,90–99,306`

Pole `history` se inicializuje a čte, ale nikde se neaktualizuje. Po změně dne se včerejší kroužek vrátí na nulu, takže týdenní tracker trvale zobrazuje jen živý dnešek.

**Doporučení:** při přechodu dne uložit konečný Must Do progres pod datumový klíč a z něj sestavovat týden. Pevné indexy Po–Ne jsou bez informace o týdnu křehké.

### 4. App-store přijímá libovolný tvar JSON bez runtime validace

**Závažnost:** vysoká  
**Modely:** GPT + Opus, shoda  
**Soubor:** `src/lib/app-store.tsx:158–178,261–267`

Type assertion `as Partial<Persisted>` neověřuje data za běhu. Hodnoty jako `{"inbox":null}` nebo `{"placements":5}` projdou hydratací a aplikace následně spadne při `.filter` nebo indexaci. Provider obaluje všechny routy, takže uživatel se nedostane ani na profil s resetem.

**Doporučení:** validovat a normalizovat každé pole pomocí Zodu nebo ručních guardů. Při nevalidním stavu použít bezpečné výchozí hodnoty a nabídnout obnovu.

### 5. Smazání Study tématu poruší vazbu na naplánované opakování

**Závažnost:** vysoká  
**Modely:** Opus, následně ručně ověřeno  
**Soubory:** `src/components/dashboard/TaskList.tsx:52–84`, `src/components/projects/Projects.tsx:108`, `src/components/projects/StudyFolder.tsx:91–93`

`InboxItem.sourceTopicId` odkazuje do odděleného projektového úložiště, ale při smazání tématu nebo projektu se vazba nekontroluje. Grade modal pak úkol označí jako hotový i tehdy, když téma už neexistuje a známka se nikam nezapsala.

**Doporučení:** při mazání uklidit související inbox položky a v `handleGrade` považovat chybějící téma za chybu, ne za úspěch.

## Riziková místa

### 6. Otevřená aplikace sama nepřejde na nový den

**Závažnost:** střední  
**Modely:** GPT + Opus, shoda  
**Soubory:** `src/lib/app-store.tsx:261–267,279–306`, `src/components/planner/useRepetitionTopics.ts:67–85`

Datum se počítá uvnitř memoizací a efektu bez časové invalidace. Po půlnoci zůstane dashboard na starém dni, zatímco fronta opakování se při focusu aktualizuje. Části UI se tak mohou rozcházet.

**Doporučení:** udržovat reaktivní `today` ve stavu, obnovovat jej při půlnoci, focusu a `visibilitychange` a předávat ho pure funkcím jako parametr.

### 7. Série po vynechaném dni zůstává zobrazena jako aktivní

**Závažnost:** střední  
**Modely:** GPT + Opus, shoda  
**Soubor:** `src/lib/app-store.tsx:279–304`

Pokud je `lastStreakDate` starší než včera a dnešek ještě není dokončený, efekt nic nezmění. Dashboard i profil proto zobrazují starou sérii až do dalšího dokončení.

**Doporučení:** při hydrataci a změně dne přepočítat sérii v testovatelné pure funkci.

### 8. Odečet včerejška přes 86 400 000 ms selhává kolem přechodu na letní čas

**Závažnost:** nízká až střední  
**Modely:** GPT + Opus, shoda  
**Soubor:** `src/lib/app-store.tsx:287,299`

Kalendářní den nemusí mít 24 hodin. V časovém pásmu Europe/Prague může odečet milisekund krátce po jarním přechodu přeskočit datum a chybně resetovat sérii.

**Doporučení:** odečítat kalendářní den přes `setDate(getDate() - 1)` nebo existující `addDays`.

### 9. Projekty v jiné kartě mohou přepsat novější SM-2 stav

**Závažnost:** střední  
**Modely:** Opus  
**Soubory:** `src/components/projects/Projects.tsx:18–38`, `src/components/planner/useRepetitionTopics.ts:74–85`

`Projects` drží vlastní kopii stavu a neposlouchá `fokus-projects-changed` ani `storage`. Pokud jiná karta zapíše hodnocení tématu, stará karta může při další editaci uložit svou zastaralou kopii přes novější data.

**Doporučení:** přidat odběr událostí nebo přesunout projekty pod jednoho vlastníka stavu a zápisu.

### 10. Side effect uvnitř React state updateru může připsat čas vícekrát

**Závažnost:** střední  
**Modely:** Opus  
**Soubor:** `src/components/DeepWorkTimer.tsx:38–51`

`addFocusMinutes(minutes)` a `setRunning(false)` běží uvnitř updateru `setRemaining`. React očekává čistou updater funkci a může ji při ověřování volat opakovaně. Statistiky Deep Work se tak mohou navýšit vícekrát.

**Doporučení:** updaterem pouze změnit `remaining`; dokončení a zápis minut provést v samostatném efektu s ochranou proti opakování.

### 11. Přepínač týdnů mění pouze popisek

**Závažnost:** střední produktové riziko  
**Modely:** Opus  
**Soubor:** `src/components/planner/Planner.tsx:46,90–95,303–324`

`weekOffset` neovlivňuje placements ani sloty, pouze text „Tento týden / týden vpřed“. Uživatel tedy při přepnutí vidí a upravuje stejný plán, i když UI tvrdí, že jde o jiný týden.

**Doporučení:** buď doplnit datum/týden do datového modelu, nebo navigaci dočasně odstranit či označit jako neaktivní.

### 12. Opakování lze ohodnotit vícekrát ve stejný den

**Závažnost:** střední  
**Modely:** Opus  
**Soubor:** `src/components/dashboard/TaskList.tsx:31–80`

Po odškrtnutí a opětovném zaškrtnutí stejné položky se Grade modal otevře znovu a SM-2 stav se znovu posune.

**Doporučení:** evidovat dnešní review podle tématu a datumového klíče a druhé hodnocení buď blokovat, nebo výslovně potvrdit jako opravu známky.

## Doporučené úpravy

### Přístupnost

Nálezy z UI průchodu byly ručně potvrzeny:

- `src/components/planner/GradeModal.tsx:29–49` a `src/components/planner/Planner.tsx:387–405`: vlastním dialogům chybí plná správa focusu, `aria-modal`, vazba na nadpis a u GradeModal také Escape handler.
- `src/components/planner/Planner.tsx:143–175,211–273`: drag and drop nemá klávesovou alternativu, takže hlavní plánovací workflow není dostupné bez myši.
- `src/components/projects/NewProjectDialog.tsx:61–82`: volba typu projektu nemá sémantiku radio group a název projektu spoléhá jen na placeholder.
- `src/components/QuickCaptureModal.tsx:116–155`: textarea nemá explicitní přístupný název a tagovým toggle tlačítkům chybí `aria-pressed`.
- `src/components/dashboard/StreakHeader.tsx:18–52`: SVG týdenního progresu nemá textovou alternativu s hodnotou progresu.
- `src/components/planner/Planner.tsx:330–380`: slot s `role="button"` není pojmenován pro screen reader a reaguje jen na Enter, ne Space.
- ikonovým tlačítkům na více místech chybí `title`, přestože projektové pravidlo vyžaduje současně `aria-label` i `title`.

### Jazyk a design systém

- `src/routes/__root.tsx:16–74`: 404 a globální error UI obsahují anglické uživatelské texty.
- `src/components/dashboard/StreakHeader.tsx:25–45`: zůstaly hardcoded barvy `gray` a `emerald` místo sémantických tokenů.
- `src/components/QuickCaptureModal.tsx:131–137`: tlačítko „Hlasový vstup“ nemá žádnou akci; pokud funkce není implementovaná, má být disabled nebo odstraněná.
- `src/components/dashboard/TaskList.tsx:224–231`: tlačítko „Upravit úkol“ nemá žádnou akci.

### Testovací mezery

- `src/lib/projects-storage.ts` nemá testy poškozených a částečně validních dat.
- `src/lib/app-store.test.ts` nepokrývá přechod dne, DST, reset série, přetrvávající `done`, historii ani odemykání tierů.
- Chybí integrační test vazby `sourceTopicId` při smazání tématu a opakovaném hodnocení.
- Chybí test dokončení Deep Work časovače a jednorázového připsání minut.

## Co je v pořádku

- SM-2 výpočty pro validní stav, intervaly a minimální ease 1.3 jsou konzistentní.
- `toDateKey` a `dateKey` používají lokální datum; nikde se pro datumový klíč nepoužívá `toISOString().slice(0, 10)`.
- App-store čte `localStorage` až v `useEffect` a zápis podmiňuje hydratací.
- Zápisy projektů jdou přes `writeProjects()`, které vysílá `fokus-projects-changed`.
- Strict TypeScript kontrola prochází.
- Aplikační komponenty používají named exporty.
- Responzivní základy jsou silné: mobile-first breakpointy, `min-w-0`, `truncate` a omezení overflow jsou používány konzistentně.
- Generované `src/routeTree.gen.ts` a shadcn `src/components/ui/**` nebyly v aktuální práci upraveny.

## Doporučené pořadí opravy

1. Zabránit přepsání poškozených projektových dat.
2. Přestavět denní dokončení placementů a sérii na datumové klíče.
3. V jednom kroku vyřešit reaktivní změnu dne, týdenní historii, stale sérii a DST.
4. Doplnit runtime validaci obou úložišť.
5. Zajistit referenční integritu Study témat a inboxu.
6. Opravit Deep Work zápis a falešnou navigaci mezi týdny.
7. Doplnit přístupnost a testy.

## Celkový verdikt

Projekt se sestaví typově čistě a současné testy procházejí, ale testovací sada nepokrývá životní cyklus dne a uložených dat. Před publikací je nutné vyřešit dva kritické problémy: možnou ztrátu projektových dat a přenášení dokončených placementů mezi dny. Týdenní historie je navíc v současném stavu funkčně nehotová.
