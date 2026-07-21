# SPEC.md — BedrijfspandAI milestone 1 (v1.0)

**Status:** alle besluiten van Rob verwerkt. Eén punt staat open: de bron van
het SKILLS-bestand (§4.4). Tot Rob anders beslist geldt daar optie A.
Na akkoord is dit document de maat: wijkt code of gedrag af, dan is de
afwijking fout.

---

## 1. Doel

Een openbare GitHub-repository met een GitHub Pages-website waarop een
MKB-ondernemer, na het invoeren van een toegangscode, in een chatvenster een
interview doorloopt. In de eerste stap kiest de ondernemer een **naam** voor
zijn nieuwe digitale werknemer; die naam is permanent en komt terug in alle
uitvoer. Het interview legt stilzwijgende bedrijfskennis vast; de site
compileert het gesprek in de browser tot **zes inhoudelijke bestanden plus
het transcript** (§4), allemaal downloadbaar. Niets wordt op een server
opgeslagen.

Milestone 1 is af als Rob (extern, op een laptop) en één externe
GitHub-tester elk via de live site een volledig interview doorlopen dat
uitvoer oplevert die door de validator komt.

## 2. Wat de bezoeker meemaakt

1. Opent de site, voert een toegangscode in (door Rob uitgegeven).
2. Korte uitleg in gewone taal, startknop.
3. **Naamstap:** de eerste interviewstap is het kiezen van een naam voor de
   digitale werknemer. De naam is permanent en verschijnt in alle
   bestandsnamen en teksten.
4. Het interview. Drie technieken, elk met een eigen stopcriterium
   (laddering tot een terminale waarde; CDM na zijn sweeps; exception
   probing tot de grens van de regel gevonden is) — nooit een vast aantal
   vragen.
5. **Verduidelijkingsgrens:** per interviewvraag maximaal 10
   verduidelijkingsrondes (confrontatierondes tellen mee). Daarna
   destilleert het systeem uit die rondes de beste lezing en legt die
   expliciet voor: *"Dit maak ik ervan — klopt dit?"* De ondernemer
   bevestigt, past aan, of laat het punt open.
6. **Tegenstrijdigheid:** wordt in gewone taal benoemd ("U zei eerder X, nu
   Y — wat klopt?"). De ondernemer beslist altijd. Kiest hij niet, dan
   blijft het punt bewust open (GEEN-DEKKING).
7. Afronden: compileren, valideren, downloadknoppen voor alle bestanden.
   Keurt de validator af, dan toont de site wat er ontbreekt — er wordt
   nooit stil gerepareerd of opgevuld.

## 3. De lagen en de determinismegrens

| Laag | LLM? | Doet |
|---|---|---|
| Interview | **ja — de enige** | gespreksvoering, naamstap, technieken, destillatie, confrontatie |
| Compiler | nee | transcript → alle uitvoerbestanden; zelfde transcript = byte-gelijke uitvoer |
| Validator | nee | schema, herleidbaarheid (`source_turns`), dekkingslabels |
| Doorgeefluik | nee | toegangscode controleren, gesprek doorsturen naar OpenRouter, niets bewaren |

De validator toetst **vorm en herleidbaarheid**, niet inhoudelijke
juistheid. Inhoudelijke juistheid keurt de ondernemer: tijdens het interview
(bevestigen, beslissen bij tegenstrijdigheid) en bij het lezen van het
rapport.

De compiler serialiseert canoniek (vaste sleutelvolgorde, inspringing 2,
UTF-8, afsluitende newline) en krijgt klok en interview-id aangeleverd, zodat
golden tests byte-gelijk kunnen zijn. De werknemersnaam komt uit het
transcript en is daarmee deterministisch.

## 4. De uitvoer: zes bestanden plus het bronbestand

`<naam>` is de gekozen werknemersnaam, in kleine letters.

1. **`wereldmodel_<naam>.json`** — het manifest: taken als nodes,
   randvoorwaarden, afhankelijkheden, autonomie en escalatie per taak,
   dekkingslabel en `source_turns` per node en edge. Schema: bijlage A.
2. **`ziel_<naam>.md`** — identiteit en werkgrondwet van de werknemer, in de
   woorden van de eigenaar: waarom het bedrijf bestaat, wat goed werk is,
   welke principes gelden en waarom — geschreven in constitution-stijl:
   principes mét hun reden, zodat gedrag ook voorspelbaar is in situaties
   die niet letterlijk besproken zijn. Elke uitspraak draagt een
   dekkingslabel en beurtverwijzing.
3. **`agents_<naam>.md`** — het operationele profiel: rol; wat de werknemer
   zelfstandig doet; waar hij eerst vraagt; wat hij nooit aanraakt;
   escalatieregels met drempels. Afgeleid uit het manifest.
4. **`skills_<naam>.md`** — vaardigheden per domein en taak.
   **OPEN PUNT — Rob beslist:**
   **A)** alleen uit het interview: vaardigheden die de ondernemer zelf
   noemt of die aantoonbaar uit zijn taken volgen (advies voor milestone 1);
   **B)** met de O*NET/ESCO-koppeling terug — dan wordt die koppeling
   opnieuw opgebouwd vanaf de publieke bronnen, nooit uit de oude
   repo-data (eigen harde regel), en is het een extra bouwstap.
   Tot het besluit geldt A.
5. **`tools_<naam>.md`** — gereedschap, gekoppeld aan de taken: wat de
   ondernemer nu gebruikt (GEDEKT, uit het interview) en AI-toolsuggesties
   per taak (altijd AFGELEID, met de redenering erbij — nooit als feit
   gebracht).
6. **`rapport_<naam>.html`** — het **voorstelrapport**: "Maak kennis met
   <naam>." Een onboarding-profiel in menselijke taal, zoals je een nieuwe
   collega voorstelt: wie hij is en waarom hij er is (uit ZIEL), wat hij
   zelfstandig oppakt, waar hij eerst komt vragen, wat hij nooit doet, hoe
   en wanneer hij escaleert, en wat er op het spel staat als taken
   misgaan (faalgevolgen uit het interview). Dekkingslabels zichtbaar,
   printbaar, met leeswijzer naar de andere vijf bestanden.

Plus, altijd: **`transcript.json`** — het volledige interview, beurt voor
beurt genummerd. Verplicht onderdeel van de uitvoer: alle `source_turns`
verwijzen hiernaar; zonder transcript is herleidbaarheid een dode letter.

## 5. LLM-laag: één adapter, via OpenRouter

- Robs sleutel is een OpenRouter-sleutel. OpenRouter biedt één
  OpenAI-compatibel endpoint (`https://openrouter.ai/api/v1`) met één
  sleutel voor honderden modellen van meerdere aanbieders; het model wordt
  per aanroep gekozen via de modelnaam (bron: openrouter.ai-documentatie
  en -blog).
- Daarmee is "agnostisch" één adapter: modelwissel is een
  configuratieregel op het doorgeefluik, geen code.
- De sleutel bestaat uitsluitend op de doorgeefluik-machine, in `.env`,
  door Rob zelf ingevuld. Nooit in de site, de repo, de CI of een chat.
- Welk model milestone 1 gebruikt: configuratie; Rob kiest en kan wisselen.

## 6. BESLUIT — sleutelarchitectuur: B, op Robs eigen pc

- Het doorgeefluik is een klein Node-endpoint op Robs altijd-aan-Windows-pc,
  draaiend in **WSL2 (Ubuntu)** — Robs voorkeur "linux-ready".
- Bereikbaar via een **beveiligde tunnel** (voorstel: Cloudflare Tunnel;
  alternatief: Tailscale Funnel). Geen open poorten op de router; de tunnel
  levert een publiek https-adres. De exacte installatie- en
  autostartstappen (WSL en tunnel automatisch mee met Windows-start)
  verifieert de bouwsessie tegen de actuele documentatie — hier bewust niet
  uit het hoofd voorgeschreven.
- Gedrag van het doorgeefluik: toegangscode controleren → gesprek
  doorsturen naar OpenRouter → antwoord terug. Het bewaart niets: geen
  gespreksinhoud in logs.
- **Toegangscodes:** Rob maakt ze aan en trekt ze in, in één bestand op de
  doorgeefluik-machine. Rob stuurt testers zelf hun code.
- Consequentie, bewust aanvaard: staat de pc uit of herstart hij, dan is
  het interview onbereikbaar. De site zelf blijft staan en toont dan een
  nette melding.

## 7. Repo-inrichting

- Statische site (HTML/CSS/JS) plus de deterministische kern (compiler,
  validator, schema) als losse JS-modules, los van de UI — dezelfde modules
  zijn later serverzijde herbruikbaar (WhatsApp-route, milestone 2+).
- Doorgeefluik als aparte map in dezelfde repo (`relay/`), met eigen
  `.env.example` (zonder echte waarden).
- Tests via `npm test`; CI op elke push: `npm test` + gitleaks. Pre-commit
  lokaal: idem.
- README met: wat dit is; hoe de externe tester het interview doorloopt
  (stap voor stap, met toegangscode, zonder hulp van Rob); hoe de tests
  draaien.

## 8. KLAAR ALS

1. CI groen: alle unit-tests en golden tests.
2. Golden run: twee vaste, gescripte transcripten door de compiler geven
   **alle uitvoerbestanden** byte-gelijk met `tests/golden/` — geen LLM.
3. Validator-afkeurset: manifesten met bekende fouten (ontbrekende
   `source_turns`, onbekend veld, ongeldig label, verwijzing naar
   niet-bestaande beurt, ongeldig autonomieniveau) worden elk afgekeurd met
   reden, gerapporteerd per categorie.
4. Gitleaks: nul bevindingen op werkboom en historie.
5. Doorgeefluik-test: aanroep zonder geldige code wordt geweigerd; met code
   komt er antwoord van OpenRouter terug (curl-bewijs, letterlijke uitvoer).
6. Rob doorloopt extern, op een laptop, via de live site een volledig echt
   interview; alle uitvoer passeert de validator.
7. De externe GitHub-tester doet hetzelfde, met alleen de README en zijn
   toegangscode.

Punten 1–5 zijn mechanisch; 6 en 7 zijn menselijke doorlopen — bewust, want
inhoudelijke juistheid is niet mechanisch vast te stellen.

## 9. BUITEN SCOPE

WhatsApp-koppeling; een runtime of orkestrator die taken uitvoert;
tool/MCP-integraties; koppeling met Gary of Tsukuyomi; accounts, opslag of
databases aan de serverkant; meertaligheid (alleen Nederlands); mobiele
perfectie (bruikbaar is genoeg); hergebruik van code, data of tekst uit
eerdere repositories. O*NET/ESCO: buiten scope bij SKILLS-optie A; bij
optie B als nieuwbouw vanaf de publieke bronnen erin.

## 10. AVG en aannames

- **Dataminimalisatie als ontwerpprincipe:** niets wordt opgeslagen; het
  doorgeefluik logt geen gespreksinhoud; de ondernemer downloadt zelf.
- **Eerlijk benoemd:** "AVG-proof" richting echte klanten vraagt later
  meer dan dit — verwerkersrelatie met OpenRouter en de onderliggende
  modelaanbieders, een privacyverklaring op de site, en het nalopen van
  OpenRouters retentie-instellingen. Dat is milestone 2-werk; het staat
  hier zodat het niet zoekraakt.
- Geen globaal beurtenplafond; alleen de 10-per-vraag-grens en de
  techniek-eigen stops.
- Een door de ondernemer bevestigde destillatie is GEDEKT, met de
  bevestigingsbeurt als bron. Afgewezen zonder alternatief = GEEN-DEKKING.
- ZIEL volgt een vaste sectiestructuur in de geest van het oude
  SOUL-ontwerp: het concept en de geleerde les mogen over, de oude tekst en
  code niet.
- Bestandsformaten zoals in §4 (json / md / html).

---

## Bijlage A — manifestschema (technisch)

```json
{
  "schema_version": "1.0",
  "generated": "2026-07-21T14:00:00Z",
  "werknemer": { "naam": "nova" },
  "interview": {
    "id": "iv-20260721-001",
    "turns_total": 87,
    "provider": "openrouter",
    "model": "voorbeeld/modelnaam"
  },
  "tasks": [
    {
      "id": "T-0001",
      "naam": "Factuur versturen",
      "beschrijving": "Zelfde dag als de klus klaar is, pdf naar klant, kopie naar eigen map.",
      "trigger": "klus afgerond",
      "afhankelijk_van": ["T-0002"],
      "autonomie": "eerst-vragen",
      "escalatie": [
        { "als": "klant in betalingsgeschil", "dan": "altijd eerst aan eigenaar voorleggen" }
      ],
      "faalgevolg": "cashflowprobleem; eigenaar schiet loon voor",
      "dekking": "GEDEKT",
      "source_turns": [12, 14, 15]
    }
  ],
  "edges": [
    {
      "van": "T-0002",
      "naar": "T-0001",
      "soort": "volgt-op",
      "dekking": "GEDEKT",
      "source_turns": [15]
    }
  ]
}
```

Regels:

- `autonomie` ∈ { `autonoom`, `eerst-vragen`, `nooit` }.
- `dekking` ∈ { `GEDEKT`, `AFGELEID`, `GEEN-DEKKING` }. Eén label per node
  en per edge; verschillen de velden binnen een node, dan geldt het laagste
  (GEEN-DEKKING < AFGELEID < GEDEKT).
- Een veld dat de ondernemer niet heeft ingevuld ontbreekt of is leeg — het
  wordt nooit opgevuld. Een ontbrekend veld is geen fout; een verzonnen
  veld wel.
- Elke waarde in `source_turns` moet bestaan in `transcript.json`; de
  validator controleert dit.
- ZIEL, AGENTS, SKILLS en TOOLS dragen dezelfde dekkingslabels en
  beurtverwijzingen, in leesbare vorm (label plus beurtnummers per
  onderdeel).
