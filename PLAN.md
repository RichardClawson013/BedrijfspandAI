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
technieken met techniek-eigen stops, de rondegrens per vraag,
destillatie-en-voorleggen, confrontatie in gewone taal, ondernemer beslist.
Modelkeuze als configuratie op het luik. Noodrem: 2500 beurten totaal
(SPEC.md §10) — zuiver een loop-stopper, moet in een normaal interview
nooit geraakt worden.

**Herzien tijdens de bouwsessie (deel 2):** de vaste 10-per-vraag-teller is
verfijnd naar een drietraps opbouw (waarschuwing ronde 8, destillatie
ronde 10, afsluiten met GEEN-DEKKING ronde 12) — zie SPEC.md §2 punt 5.
De teller rekent uitsluitend met beurttypen die de validator van deel 1 al
goedkeurt, nooit met een oordeel van het model zelf.

Deelstappen, elk met eigen bewijs:
1. Protocol + validator voor modelantwoorden (deel 1) — **klaar**.
2. Rondeteller en drietraps statusbepaling (deel 2) — **klaar**, bewijs:
   `npm test` groen met de nieuwe tellermodule-tests.
3. Live verbinding: chatvenster ↔ doorgeefluik ↔ controller — **klaar**,
   bewijs: 87/87 tests groen, live testgesprek bevestigd door Rob via
   Cloudflare Quick Tunnel (`/gezond` en een echt Google/Gemini-antwoord).
4. **(nieuw, tijdens de bouwsessie)** Gesprekswijze onboarding: toegangscode
   in gesprekstoon vragen i.p.v. los formulierveld; vast welkomsbericht
   (beurt 1) + antwoord ondernemer (beurt 2) als echte transcriptbeurten
   vóór de naamstap; toon-instructie in het protocol tegen drillende
   vervolgvragen; doorgeefluik-adres vast gecodeerd voor de bètafase i.p.v.
   zichtbaar veld — zie SPEC.md §2 en §6. **Klaar**, bewijs: 87/87 tests
   groen, live testgesprek door Rob bevestigd (welkomsbericht, naamstap,
   meerdere gespreksrondes).
   Aanvullingen tijdens dezelfde deelstap, ontdekt via Robs eigen
   bètatest:
   - **Knoptekst "Compileren en valideren" → "Gesprek afronden"** —
     ontwikkelaarstaal hoort niet in een MKB-gerichte interface. **Klaar.**
   - **Huisstijl site-breed** (donkerpaars/goud/donker oranje,
     ref. SBS "The Boat") — code-scherm, chatvenster, rapport. **Klaar**,
     bewijs: golden fixtures opnieuw gegenereerd en byte-gelijk, 87/87
     tests groen.
   - **Gracieus herstellen bij ongeldig modelantwoord** (zie SPEC.md §2
     punt 4) — vervangt "hard stoppen na 2 herstelpogingen". **Klaar**,
     bewijs: 88/88 tests groen (2 nieuwe gevallen).
   **Bewijs (eindstap):** `npm test` groen; Rob bevestigt in de browser
   dat het welkomsbericht, de huisstijl en de gesprekswijze code-vraag
   werken zoals hier beschreven.
5. Model-gedreven afronden (zie SPEC.md §2 punt 7) — ontdekt via Robs
   eigen bètatest: een volledig interview leverde geen uitvoer op, omdat
   niets het model liet beslissen "ik ben klaar." Bewuste keuze: het model
   beslist, maar vraagt eerst expliciet bevestiging aan de ondernemer voor
   het echt afrondt — nooit zelf in één beweging stoppen zonder dat iemand
   kan bijsturen. Bevestigt de ondernemer, dan geeft het model een vast
   `afronding`-signaal af; de site compileert en valideert dan automatisch
   — geen handmatige "Gesprek afronden"-knop meer in de echte
   interviewmodus (demo-modus behoudt de knop, daar is geen levend model).
   **Nog te doen.**
   Rob expliciet: "het fundament leggen is genoeg, uitbouwen kan later
   nog" — dit blijft dus bewust beperkt tot het afrondingssignaal zelf.
   **De 8/10/12-rondeteller (`interviewStatus.js`) live aansluiten op het
   gesprek blijft apart openstaan, geen onderdeel van deze deelstap.**
   **Bewijs:** `npm test` groen; Rob bevestigt in de browser dat een
   compleet interview automatisch naar het resultaatscherm gaat na zijn
   bevestiging, zonder handmatige knop.

**Bewijs (eindstap):** één kort echt testinterview door Rob, extern op een
laptop; uitvoer door de validator.

## Stap 6 — Volledige doorlopen

README-testinstructie afronden. Rob doorloopt een volledig echt interview;
daarna de externe GitHub-tester met alleen de README en zijn toegangscode.

**Bewijs:** twee volledige uitvoersets door de validator; de KLAAR ALS-lijst
uit SPEC §8 punt voor punt afgevinkt, met per punt de vindplaats van het
bewijs.
