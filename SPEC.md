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

**Herzien tijdens de bouwsessie (Stap 5, deelstap 4):** de toegangscode en
de intro zijn omgezet van een statisch formulier naar gesprekswijze — zie
de punten hieronder.

1. Opent de site. De assistent vraagt in gesprekswijze om de toegangscode
   (door Rob uitgegeven) — geen los formulierveld met technisch label.
2. **Welkomsbericht (beurt 1, vast, niet modelgegenereerd):** na een
   geldige code toont de site een vaste openingszin van de assistent, die
   vraagt wie de ondernemer is, wat zijn bedrijf doet, en waarom hij denkt
   dat AI hem zou kunnen helpen — een open ijsbreker, geen drilvraag. Dit
   bericht en het antwoord van de ondernemer zijn **echte, genummerde
   transcriptbeurten** (beurt 1 = vast welkomsbericht van de interviewer,
   beurt 2 = vrij antwoord van de ondernemer) — herleidbaar en bruikbaar
   als bron, net als elke andere beurt. Reden: het antwoord is inhoud, geen
   versiering; zonder beurtnummer zou het niet citeerbaar zijn, in strijd
   met de herleidbaarheidseis elders in dit document.
3. **Naamstap:** de eerste **modelgegenereerde** beurt — dus ná het vaste
   welkomsbericht en het antwoord van de ondernemer, niet meer letterlijk
   beurt 1 van het transcript — is het kiezen van een naam voor de
   digitale werknemer. De naam is permanent en verschijnt in alle
   bestandsnamen en teksten.
4. Het interview. Drie technieken, elk met een eigen stopcriterium
   (laddering tot een terminale waarde; CDM na zijn sweeps; exception
   probing tot de grens van de regel gevonden is) — nooit een vast aantal
   vragen. **Toon:** nieuwsgierig en volgend, niet drillend — de
   technieken dienen om de denkwijze van de ondernemer te leren kennen,
   niet om te verhoren.

   **Ongeldige modelantwoorden (herzien tijdens de bouwsessie, Stap 5
   deelstap 4):** oorspronkelijk gold "max. 2 herstelpogingen, daarna hard
   stoppen" — dat draaide het hele interview onherstelbaar dood bij één
   hapering van het model, ook diep in een gesprek. Nu: na de 2
   herstelpogingen (ongewijzigd) volgt één laatste, sterk vereenvoudigde
   vraag aan het model — niet de volledige protocol-opdracht opnieuw, maar
   uitsluitend gewone tekst waarin het aan de ondernemer uitlegt dat het
   vastliep en vraagt zijn laatste antwoord anders te verwoorden. Mislukt
   zelfs dat (netwerkfout of leeg antwoord), dan valt het terug op een
   vaste, niet-modelgegenereerde tekst met dezelfde strekking. In alle
   gevallen blijft het antwoordveld actief — het gesprek stopt nooit meer
   onherstelbaar door een modelhapering.
5. **Verduidelijkingsgrens:** per interviewvraag een drietraps opbouw,
   herzien tijdens de bouwsessie van Stap 5 (deel 2) — bewust niet één
   harde afkap, maar een oplopende grens (confrontatierondes tellen overal
   in mee):
   - **Ronde 8:** vaste waarschuwing dat de grens nadert, met de suggestie
     het antwoord eerst aan te scherpen voordat het gesprek verdergaat.
   - **Ronde 10:** het systeem destilleert de beste lezing uit de rondes
     tot dusver en legt die expliciet voor: *"Dit maak ik ervan — klopt
     dit?"* De ondernemer bevestigt, past aan, of laat het bewust open.
   - **Ronde 12:** is het punt dan nog niet afgerond, dan sluit het
     systeem af met een vaste dankbetuiging en legt het vast als
     GEEN-DEKKING — dit komt vanzelf terug in
     `open_onderwerpen_trainingbot_<naam>.md` (§4 punt 7), de
     trainingsagenda van de digitale werknemer.

   De rondeteller is deterministisch en client-side: hij telt
   interviewer-dialoogbeurten sinds de laatste `taak`- of `edge`-extractie
   — nooit een oordeel van het model zelf over wat "een nieuwe vraag" is.
6. **Tegenstrijdigheid:** wordt in gewone taal benoemd ("U zei eerder X, nu
   Y — wat klopt?"). De ondernemer beslist altijd. Kiest hij niet, dan
   blijft het punt bewust open (GEEN-DEKKING).
7. **Afronden (herzien tijdens de bouwsessie, Stap 5 deelstap 5): het
   model beslist, niet een handmatige knop.** Vindt het model dat het
   voldoende heeft voor een goed fundament, dan vraagt het dat eerst
   expliciet aan de ondernemer als gewone dialoogbeurt — bijvoorbeeld "Ik
   denk dat ik voldoende heb. Wil je nog iets toevoegen, of mag ik
   afronden?" — nooit in één beweging zelf beslissen en stoppen. Bevestigt
   de ondernemer, dan geeft het model op de eerstvolgende beurt een vast
   `afronding`-signaal af (nieuw beurttype, geen extra velden nodig) samen
   met een kort afscheidsbericht. De site compileert en valideert dan
   automatisch — geen handmatige knop meer in de echte interviewmodus. Wil
   de ondernemer nog iets toevoegen, dan gaat het gesprek gewoon door;
   er is geen aparte afhandeling nodig, dat is al hoe een normale beurt
   werkt.
   Compileren, valideren, downloadknoppen voor alle bestanden. Keurt de
   validator af, dan toont de site wat er ontbreekt — er wordt nooit stil
   gerepareerd of opgevuld.

## 3. De lagen en de determinismegrens

| Laag | LLM? | Doet |
|---|---|---|
| Interview | **ja — de enige** | gespreksvoering, naamstap, technieken, destillatie, confrontatie |
| Compiler | nee | transcript → alle uitvoerbestanden; zelfde transcript = byte-gelijke uitvoer |
| Validator | nee | schema, herleidbaarheid (`source_turns`), dekkingslabels, graafconsistentie (edges verwijzen naar bestaande taken, geen cykels) |
| Doorgeefluik | nee | toegangscode controleren, gesprek doorsturen naar de geconfigureerde provider, niets bewaren |

De validator toetst **vorm en herleidbaarheid**, niet inhoudelijke
juistheid. Inhoudelijke juistheid keurt de ondernemer: tijdens het interview
(bevestigen, beslissen bij tegenstrijdigheid) en bij het lezen van het
rapport.

De compiler serialiseert canoniek (vaste sleutelvolgorde, inspringing 2,
UTF-8, afsluitende newline) en krijgt klok en interview-id aangeleverd, zodat
golden tests byte-gelijk kunnen zijn. De werknemersnaam komt uit het
transcript en is daarmee deterministisch.

## 4. De uitvoer: zeven bestanden plus het bronbestand

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

7. **`open_onderwerpen_trainingbot_<naam>.md`** — **(toegevoegd tijdens de
   bouwsessie, op Robs instructie)** een expliciete lijst van elke taak en
   edge met dekking **GEEN-DEKKING**: waar (welke beurt), waarom bewust open
   gelaten, en wat ervan afhangt (gekoppelde taken/edges via `edges` en
   `afhankelijk_van`). Dit is stap 1 van de trainingsagenda van de digitale
   werknemer zelf — vergelijkbaar met een net afgestudeerde junior die de
   theorie kent en nu de praktijklacunes moet invullen. Doel na oplevering:
   binnen drie maanden operationeel gebruik zijn deze lacunes dicht.
   **Geen aparte validatorcategorie nodig:** dit bestand wordt door de
   compiler berekend uit exact dezelfde manifestgegevens die de validator al
   controleert (welke taken/edges op GEEN-DEKKING staan) — het kan dus per
   ontwerp niet uit de pas lopen met het manifest. Getest via golden output
   plus losse eenheidstests (`test/buildOpenOnderwerpen.test.js`).

Plus, altijd: **`transcript.json`** — het volledige interview, beurt voor
beurt genummerd. Verplicht onderdeel van de uitvoer: alle `source_turns`
verwijzen hiernaar; zonder transcript is herleidbaarheid een dode letter.

## 5. LLM-laag: provider-agnostisch, meerdere adapters

**Herzien tijdens de bouwsessie van Stap 4 (deel 3):** oorspronkelijk was
"agnostisch" hier gedefinieerd als één adapter via OpenRouter (modelwissel
als configuratieregel, geen code). Op Robs expliciete instructie is dit
verbreed naar echte provider-onafhankelijkheid: het doorgeefluik moet ook
kunnen doorwerken als OpenRouter zelf uitvalt of blokkeert. Dat vraagt een
adapter per provider, niet enkel een modelnaam-parameter op één adapter.

- **Eén gemeenschappelijk contract:** elke adapter accepteert dezelfde
  invoer (OpenAI-stijl `messages`: `[{role, content}]`, plus `model` en
  `apiKeys`) en levert dezelfde uitvoer (`{content: "..."}`). De aanroeper
  (site/interviewlaag) hoeft niet te weten welke provider antwoordde.
- **`PROVIDER`** kiest de actieve adapter (`openrouter` of `google`) — puur
  configuratie op het doorgeefluik.
- **OpenRouter-adapter:** OpenAI-compatibel endpoint
  (`https://openrouter.ai/api/v1`), één sleutel voor honderden modellen van
  meerdere aanbieders; modelwissel blijft configuratie (bron:
  openrouter.ai-documentatie en -blog).
- **Google-adapter:** rechtstreeks naar de Gemini Developer API
  (`https://generativelanguage.googleapis.com`), sleutel als
  `?key=`-query-parameter. Vertaalt `messages` naar Google's
  `contents`/`systemInstruction`-formaat.
- **Meerdere sleutels per provider (toegevoegd tijdens de bouwsessie van
  Stap 4):** elke adapter accepteert een komma-gescheiden lijst van
  sleutels (`OPENROUTER_API_KEYS` resp. `GOOGLE_API_KEYS`) — de eerste is
  primair, de rest zijn backups. Bij een sleutel-gerelateerde fout
  (401/403/429) of een netwerkfout probeert het doorgeefluik automatisch de
  volgende sleutel. Bij een andere fout (bijvoorbeeld een ongeldig verzoek,
  400) wordt niet opnieuw geprobeerd, want een andere sleutel lost dat niet
  op.
- De sleutel(s) bestaan uitsluitend op de doorgeefluik-machine, in `.env`,
  door Rob zelf ingevuld. Nooit in de site, de repo, de CI of een chat.
- Welk model en welke provider milestone 1 gebruikt: configuratie; Rob
  kiest en kan wisselen.

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
  doorsturen naar de geconfigureerde provider (§5) → antwoord terug. Het
  bewaart niets: geen gespreksinhoud in logs.
- **Toegangscodes:** Rob maakt ze aan en trekt ze in, in één bestand op de
  doorgeefluik-machine. Rob stuurt testers zelf hun code.
- Consequentie, bewust aanvaard: staat de pc uit of herstart hij, dan is
  het interview onbereikbaar. De site zelf blijft staan en toont dan een
  nette melding.
- **Bètafase, tijdelijk (toegevoegd tijdens de bouwsessie, Stap 5 deelstap
  4):** tot de permanente tunnel/domein-oplossing er is (Stap 4, punt 4 —
  Cloudflare-account/domein, nog te doen), draait een **Cloudflare Quick
  Tunnel** (`cloudflared tunnel --url`, geen account nodig). Het adres
  daarvan verandert bij elke herstart. Voor de bètatest staat dit adres
  **vast gecodeerd op één plek** in de site (geen zichtbaar invoerveld voor
  de tester) — dit moet dus handmatig bijgewerkt en opnieuw gepusht worden
  bij elke herstart van de tunnel, tot de permanente oplossing dit
  overbodig maakt.

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
   niet-bestaande beurt, ongeldig autonomieniveau, edge naar een
   niet-bestaande taak, cyclische afhankelijkheid) worden elk afgekeurd met
   reden, gerapporteerd per categorie.
4. Gitleaks: nul bevindingen op werkboom en historie.
5. Doorgeefluik-test: aanroep zonder geldige code wordt geweigerd; met code
   komt er antwoord van de geconfigureerde provider terug (curl-bewijs,
   letterlijke uitvoer, voor elke aangesloten provider).
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
  meer dan dit — verwerkersrelatie met elke aangesloten provider (§5) en de
  onderliggende modelaanbieders, een privacyverklaring op de site, en het
  nalopen van hun retentie-instellingen. Dat is milestone 2-werk; het staat
  hier zodat het niet zoekraakt.
- Geen inhoudelijk beurtenplafond dat het interview vroegtijdig afkapt —
  diepte volgt de 10-per-vraag-grens en de techniek-eigen stops. Wel een
  technische **noodrem van 2500 beurten totaal** (vastgelegd tijdens de
  bouwsessie), zuiver als vangnet tegen doorlussen (een bug, geen normaal
  gebruik): een realistisch complexe MKB-zaak (10 domeinen × ~15 items,
  elk in het slechtste geval tot de 10-per-vraag-grens) blijft ruim onder
  de 1500 beurten; 2500 ligt daar met marge boven, zodat de noodrem alleen
  bij een defect gesprek triggert, nooit bij een grondig interview.
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
