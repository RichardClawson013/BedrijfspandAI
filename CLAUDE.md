# CLAUDE.md

## Wie ik ben

Rob. Ik codeer niet, ik beoordeel in gewoon Nederlands. Ik keur goed op basis
van letterlijke bewijsstukken (testuitvoer, validatorresultaat) — nooit op
basis van een claim dat iets werkt. Rood is niet af.

Werkwijze: één stap, expliciete GO, dan pas de volgende stap. Een stap is
één planstap uit PLAN.md — niet kleiner (anders verlamming door te veel
losse bevestigingen) en niet groter (anders te grote sprongen zonder
controle). Geen voortgang tonen om productief te lijken. Loop je twee keer
vast op hetzelfde punt: stoppen en voorleggen, niet blijven proberen.

## Wat BedrijfspandAI is

Een lokaal programma dat de stilzwijgende bedrijfskennis van een
MKB-ondernemer vastlegt door een interview, en dat compileert tot een
gevalideerd JSON-manifest: taken als nodes, met randvoorwaarden,
afhankelijkheden, en per taak een autonomieniveau en escalatieregels.

Alleen de interviewlaag gebruikt een LLM. Compiler en validator zijn
deterministisch en toetsen vorm en herleidbaarheid: schema-geldigheid, en of
elke node en edge een `source_turns`-verwijzing en dekkingslabel draagt. De
validator oordeelt niet over inhoudelijke juistheid — een fout-maar-netjes-
herleidbaar manifest komt door elke schemacheck heen. Inhoudelijke
juistheid keurt Rob bij oplevering.

## Niet-onderhandelbaar

- Elke node en edge draagt `source_turns` (verwijzing naar interviewbeurten)
  en één dekkingslabel: **GEDEKT** (letterlijk terug te voeren op een
  geciteerde bron), **AFGELEID** (redenering op gedekte feiten, geen directe
  bron), of **GEEN-DEKKING** (bewust open gelaten). Zonder bronverwijzing
  keurt de validator het manifest af — geen uitzondering, geen stille
  fallback.
- Nooit fabriceren. Een zichtbaar gat is correct gedrag, geen fout.
- Geen hergebruik van code, data of tekst uit oudere eigen repositories
  (modelworld, mkb-configurator-demo, ModelWordSME-NL, ModelWorldSME,
  MODELWORLDNL) of van derden. Wat overgenomen mag worden: de geleerde les,
  het architectuurinzicht, de bevestiging dat de aanpak werkt — nooit de
  letterlijke code of data. Dit project bouwt vanaf nul.
- Sleutels bestaan uitsluitend op de doorgeefluik-machine, in
  `relay/.env` (`OPENROUTER_API_KEYS` resp. `GOOGLE_API_KEYS`, afhankelijk
  van `PROVIDER` — zie SPEC.md §5), door Rob zelf ingevuld. Nooit een
  sleutel in de site, de repo, de CI of de chat. Toegangscodes voor
  testers beheert Rob in één bestand op het doorgeefluik.

## Methodologische basis (bron voor de interviewlaag)

- **Laddering** — Kelly (1955); means-end chain volgens Reynolds & Gutman
  (1988). Attribuut → gevolg → waarde. Stopt bij een terminale waarde (een
  niet-instrumentele kernwaarde), niet bij een vast aantal vragen.
- **Critical Decision Method** — Klein, Calderwood & Macgregor (1989).
  Reconstrueert een beslismoment in sweeps: vrij verhaal → tijdlijn →
  gerichte probes (signaal, doel, opties, onderbouwing).
- **Exception probing** — Beyer & Holtzblatt (1997), contextual design;
  Cynefin/Snowden-grensanalyse. Zoekt het punt waar de normale regel
  breekt — daar zitten de aannames zonder bron.

Diepte per techniek wordt bepaald door het eigen stopcriterium van die
techniek, nooit door een vast aantal vragen. Naast dat techniek-eigen
stopcriterium geldt een harde bovengrens als noodrem, zuiver als vangnet
tegen doorlussen (nooit als sturing van een normaal interview) — **2500
beurten totaal**, vastgelegd in SPEC.md §10 tijdens de bouwsessie.

## Bronnen voor domeinkennis

Nederlandse wetgeving (wetten.overheid.nl — met artikelnummer en
geldigheidsdatum), O*NET (US DoL), ESCO (Europese Commissie), ISCO-08
(ILO), SBI (CBS). Een bewering zonder citaat naar een van deze bronnen is
AFGELEID of GEEN-DEKKING, nooit GEDEKT.

## Stack

- `npm test` groen vóór elke commit. CI draait `npm test` + gitleaks
  op elke push.
