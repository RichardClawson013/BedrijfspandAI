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

Het schema uit SPEC bijlage A als code. Validator: schemacontrole,
`source_turns`-bestaan tegen het transcript, dekkingslabels,
autonomiewaarden. Afkeurset: per foutcategorie minstens één manifest dat
aantoonbaar wordt afgekeurd, met reden.

**Bewijs:** `npm test`-uitvoer, afkeurresultaten per categorie.

## Stap 2 — Compiler (deterministisch, geen LLM)

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

Node-endpoint in `relay/`: toegangscode controleren, doorsturen naar
OpenRouter, niets loggen. Codesbestand voor Rob. `.env.example`. Beveiligde
tunnel inrichten (Cloudflare Tunnel of vergelijkbaar; installatie- en
autostartstappen eerst verifiëren tegen de actuele documentatie). Rob zet
zelf de OpenRouter-sleutel in `.env` — nooit via de chat.

**Bewijs:** curl zonder geldige code = geweigerd; curl met code = antwoord
van OpenRouter; beide letterlijk getoond. Herstarttest: pc-herstart, luik
komt vanzelf terug.

## Stap 5 — Interviewlaag (nu pas het model)

De site praat met het doorgeefluik. Interviewlogica: naamstap, drie
technieken met techniek-eigen stops, de 10-per-vraag-teller,
destillatie-en-voorleggen, confrontatie in gewone taal, ondernemer beslist.
Modelkeuze als configuratie op het luik.

**Bewijs:** één kort echt testinterview door Rob, extern op een laptop;
uitvoer door de validator.

## Stap 6 — Volledige doorlopen

README-testinstructie afronden. Rob doorloopt een volledig echt interview;
daarna de externe GitHub-tester met alleen de README en zijn toegangscode.

**Bewijs:** twee volledige uitvoersets door de validator; de KLAAR ALS-lijst
uit SPEC §8 punt voor punt afgevinkt, met per punt de vindplaats van het
bewijs.
