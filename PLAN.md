# PLAN.md — bouwvolgorde milestone 1 (v1.0)

Vaste regels: één stap tegelijk; elke stap eindigt met het genoemde bewijs
(letterlijke uitvoer, geen samenvatting); daarna expliciete GO van Rob; dan
pas de volgende stap. Stappen niet omwisselen: het model komt als laatste.
Twee keer vastlopen op hetzelfde punt = stoppen en voorleggen met opties.
Kleine commits, per stap. SPEC.md is de maat.

## Stap 0 — Fundament

npm-project, `.gitignore`, pre-commit met gitleaks + linter, CI-workflow
(`npm test` + gitleaks op elke push), Pages-deploy-workflow met kale
placeholderpagina.

**Bewijs:** groene CI-run (link), live Pages-URL met placeholder,
gitleaks-uitvoer met nul bevindingen.

## Stap 1 — Schema en validator (deterministisch, geen LLM)

**Herzien tijdens de bouwsessie (na oorspronkelijke oplevering):**
graafconsistentie toegevoegd aan de validator — `onbestaande-taak-referentie`
(edge verwijst naar een niet-bestaand taak-id) en `cyclische-afhankelijkheid`
(cykel in de taken-graaf). Bewijs: `npm test` groen, twee nieuwe
afkeurset-fixtures (`edge-naar-onbestaande-taak.json`,
`cyclische-afhankelijkheid.json`), elk met eigen categorie afgekeurd.

Het schema uit SPEC bijlage A als code. Validator: schemacontrole,
`source_turns`-bestaan tegen het transcript, dekkingslabels,
autonomiewaarden. Afkeurset: per foutcategorie minstens één manifest dat
aantoonbaar wordt afgekeurd, met reden.

**Bewijs:** `npm test`-uitvoer, afkeurresultaten per categorie.

## Stap 2 — Compiler (deterministisch, geen LLM)

**Herzien tijdens de bouwsessie (na oorspronkelijke oplevering):** 7e
uitvoerbestand toegevoegd, `open_onderwerpen_trainingbot_<naam>.md` — zie
SPEC.md §4 punt 7. Bewijs: `npm test` groen, losse eenheidstests
(`test/buildOpenOnderwerpen.test.js`, 5 gevallen) plus bijgewerkte golden
fixtures (mila/nova) met het nieuwe bestand in de lege-staat.

Transcriptformaat vastleggen (genummerde beurten, naamstap als beurt 1).
Compiler: transcript → **alle zeven uitvoerbestanden** (wereldmodel, ziel,
agents, skills, tools, rapport, transcript), canonieke serialisatie, klok en
interview-id geïnjecteerd. Twee golden fixtures: gescripte transcripten met
hun verwachte uitvoer, byte-gelijk.

**Bewijs:** golden tests groen in `npm test`-uitvoer.

## Stap 3 — Site zonder LLM (demo-modus)

Statische site: toegangscodescherm (in demo-modus overslaanbaar),
chatvenster dat een gescript transcript afspeelt inclusief naamstap,
compileren en valideren in de browser, downloadknoppen voor alle bestanden,
afkeurweergave van de validator.

**Bewijs:** doorloop van de demo-modus op de live Pages-site; Rob klikt het
zelf na.

## Stap 4 — Doorgeefluik (op Robs pc, WSL2)

Node-endpoint in `relay/`: toegangscode controleren, doorsturen naar de
geconfigureerde provider, niets loggen. Codesbestand voor Rob.
`.env.example`. Beveiligde tunnel inrichten (Cloudflare Tunnel of
vergelijkbaar; installatie- en autostartstappen eerst verifiëren tegen de
actuele documentatie). Rob zet zelf de sleutels in `.env` — nooit via de
chat.

**Herzien tijdens de bouwsessie (deel 3):** oorspronkelijk enkel OpenRouter.
Op Robs instructie verbreed naar provider-agnostisch (§5 SPEC.md) — meerdere
adapters achter één contract, `PROVIDER` kiest de actieve. Reden:
elasticiteit — kunnen doorwerken als één provider uitvalt of blokkeert.

Deelstappen, elk met eigen bewijs:
1. Doorgeefluik-fundament + OpenRouter-adapter (deel 1) — **klaar**.
2. Multi-key-failover per sleutel (deel 2) — **klaar**.
3. Provider-adapter voor Google + dispatch-laag (deel 3) — **klaar**,
   testbewijs: volledige `npm test`-run groen (42/42, incl. 6 nieuwe
   Google-adaptertests, 2 nieuwe dispatch-tests in server.test.js).
4. Tunnel-inrichting — **nog te doen**.

**Bewijs (eindstap):** curl zonder geldige code = geweigerd; curl met code =
antwoord van de geconfigureerde provider; beide letterlijk getoond, voor
elke aangesloten provider. Herstarttest: pc-herstart, luik komt vanzelf
terug.

## Stap 5 — Interviewlaag (nu pas het model)

De site praat met het doorgeefluik. Interviewlogica: naamstap, drie
technieken met techniek-eigen stops, de 10-per-vraag-teller,
destillatie-en-voorleggen, confrontatie in gewone taal, ondernemer beslist.
Modelkeuze als configuratie op het luik. Noodrem: 2500 beurten totaal
(SPEC.md §10) — zuiver een loop-stopper, moet in een normaal interview
nooit geraakt worden.

**Bewijs:** één kort echt testinterview door Rob, extern op een laptop;
uitvoer door de validator.

## Stap 6 — Volledige doorlopen

README-testinstructie afronden. Rob doorloopt een volledig echt interview;
daarna de externe GitHub-tester met alleen de README en zijn toegangscode.

**Bewijs:** twee volledige uitvoersets door de validator; de KLAAR ALS-lijst
uit SPEC §8 punt voor punt afgevinkt, met per punt de vindplaats van het
bewijs.
