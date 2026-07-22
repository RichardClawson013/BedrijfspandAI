import { compile } from "../compiler/compile.js";
import { validateManifest } from "../validator/validateManifest.js";
import { demoGeldig, demoFout } from "./demoTranscripts.js";
import { renderTurn, renderGeslaagd, renderAfkeuring } from "./render.js";
import { INTERVIEW_SYSTEEM_PROMPT } from "../interview/systemPrompt.js";
import { vraagModelBeurt } from "../interview/interviewClient.js";

const DEMOS = { geldig: demoGeldig, fout: demoFout };

// Bètafase (Stap 5, deelstap 4, SPEC.md §6): tijdelijk hardcoded, tot de
// permanente tunnel/domein-oplossing er is. Bij elke herstart van de
// Cloudflare Quick Tunnel moet dit adres hier bijgewerkt en opnieuw
// gepusht worden.
const RELAY_API_URL = "https://fitness-bowl-startup-preliminary.trycloudflare.com/interview";

// Vast welkomsbericht (SPEC.md §2 punt 2) — geen model-uitvoer, altijd
// transcriptbeurt 1.
const WELKOMSBERICHT =
  "Hi, Ik ben de Assistent van DakanAI, leuk dat je de tijd neemt om met me in gesprek te gaan. Vertel me, wie ben jij? Wat doet je bedrijf, en waarom denk je dat AI je zou kunnen helpen?";

const FOUTMELDINGEN = {
  "doorgeefluik-onbereikbaar":
    "Het doorgeefluik is niet bereikbaar. Controleer of het draait en probeer het opnieuw.",
  "doorgeefluik-fout": "Het doorgeefluik wees het verzoek af.",
};

function els() {
  return {
    schermCode: document.getElementById("scherm-code"),
    schermIntro: document.getElementById("scherm-intro"),
    schermInterview: document.getElementById("scherm-interview"),
    schermResultaat: document.getElementById("scherm-resultaat"),
    formCode: document.getElementById("form-code"),
    inputCode: document.getElementById("input-code"),
    codeGesprek: document.getElementById("code-gesprek"),
    btnDemo: document.getElementById("btn-demo"),
    demoKnoppen: document.querySelectorAll("[data-demo]"),
    interviewNaam: document.getElementById("interview-naam"),
    transcriptLog: document.getElementById("transcript-log"),
    formAntwoord: document.getElementById("form-antwoord"),
    inputAntwoord: document.getElementById("input-antwoord"),
    interviewFout: document.getElementById("interview-fout"),
    btnVolgende: document.getElementById("btn-volgende"),
    btnCompileer: document.getElementById("btn-compileer"),
    resultaatInhoud: document.getElementById("resultaat-inhoud"),
    btnOpnieuw: document.getElementById("btn-opnieuw"),
  };
}

function toonScherm(el, alleSchermen) {
  for (const scherm of alleSchermen) {
    scherm.hidden = scherm !== el;
  }
}

export function initApp() {
  const el = els();
  const alleSchermen = [el.schermCode, el.schermIntro, el.schermInterview, el.schermResultaat];

  const state = { modus: "demo", transcript: [], turnIndex: 0, wisselingen: [] };

  el.codeGesprek.append(
    renderTurn({
      type: "dialoog",
      spreker: "interviewer",
      tekst: "Hoi! Fijn dat je er bent. Heb je een toegangscode? Vul 'm hieronder in om te beginnen.",
    }),
  );

  el.formCode.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = el.inputCode.value.trim();
    if (code) {
      startEchteInterview(code);
    } else {
      toonScherm(el.schermIntro, alleSchermen);
    }
  });

  el.btnDemo.addEventListener("click", () => {
    toonScherm(el.schermIntro, alleSchermen);
  });

  for (const knop of el.demoKnoppen) {
    knop.addEventListener("click", () => {
      startDemo(knop.dataset.demo);
    });
  }

  el.btnVolgende.addEventListener("click", volgendeBeurt);
  el.btnCompileer.addEventListener("click", compileerEnValideer);
  el.btnOpnieuw.addEventListener("click", () => {
    toonScherm(el.schermCode, alleSchermen);
  });

  el.formAntwoord.addEventListener("submit", (event) => {
    event.preventDefault();
    verstuurAntwoord();
  });

  function startDemo(sleutel) {
    const demo = DEMOS[sleutel];
    state.modus = "demo";
    state.transcript = demo.transcript;
    state.turnIndex = 0;
    el.transcriptLog.replaceChildren();
    el.interviewNaam.textContent = "";
    el.formAntwoord.hidden = true;
    el.interviewFout.hidden = true;
    el.btnVolgende.hidden = false;
    el.btnCompileer.hidden = true;
    toonScherm(el.schermInterview, alleSchermen);
    volgendeBeurt();
  }

  function volgendeBeurt() {
    if (state.turnIndex >= state.transcript.length) return;

    const beurt = state.transcript[state.turnIndex];
    el.transcriptLog.append(renderTurn(beurt));
    if (beurt.type === "naamstap") {
      el.interviewNaam.textContent = `— ${beurt.naam}`;
    }
    state.turnIndex += 1;

    if (state.turnIndex >= state.transcript.length) {
      el.btnVolgende.hidden = true;
      el.btnCompileer.hidden = false;
    }
  }

  function startEchteInterview(code) {
    state.modus = "echt";
    state.code = code;
    state.apiUrl = RELAY_API_URL;
    state.transcript = [];
    state.wisselingen = [];
    state.provider = undefined;
    state.model = undefined;

    el.transcriptLog.replaceChildren();
    el.interviewNaam.textContent = "";
    el.interviewFout.hidden = true;
    el.btnVolgende.hidden = true;
    el.btnCompileer.hidden = true;
    el.formAntwoord.hidden = false;

    toonScherm(el.schermInterview, alleSchermen);

    // Welkomsbericht is vast (geen model-uitvoer) en altijd beurt 1
    // (SPEC.md §2 punt 2). Het antwoord van de ondernemer wordt beurt 2
    // via het normale antwoordformulier — pas daarna gaat de eerste echte
    // modelaanroep uit.
    const welkomstBeurt = { turn: 1, type: "dialoog", spreker: "interviewer", tekst: WELKOMSBERICHT };
    state.transcript.push(welkomstBeurt);
    el.transcriptLog.append(renderTurn(welkomstBeurt));
    state.wisselingen.push({ rol: "model", inhoud: JSON.stringify([welkomstBeurt]) });

    zetAntwoordveldActief(true);
  }

  function verstuurAntwoord() {
    const tekst = el.inputAntwoord.value.trim();
    if (!tekst) return;

    const beurt = { turn: state.transcript.length + 1, type: "dialoog", spreker: "ondernemer", tekst };
    state.transcript.push(beurt);
    el.transcriptLog.append(renderTurn(beurt));
    state.wisselingen.push({ rol: "ondernemer", inhoud: tekst });
    el.inputAntwoord.value = "";

    haalVolgendeModelBeurtOp();
  }

  async function haalVolgendeModelBeurtOp() {
    zetAntwoordveldActief(false);

    const resultaat = await vraagModelBeurt({
      apiUrl: state.apiUrl,
      code: state.code,
      systeemPrompt: INTERVIEW_SYSTEEM_PROMPT,
      wisselingen: state.wisselingen,
      fetchImpl: fetch,
    });

    if (!resultaat.ok) {
      toonInterviewFout(resultaat);
      return;
    }

    if (resultaat.gracieusHersteld) {
      // Model liep vast, ook na herstelpogingen (SPEC.md §2 punt 4).
      // Antwoordveld blijft actief — het gesprek stopt nooit onherstelbaar
      // door een modelhapering.
      const beurt = {
        turn: state.transcript.length + 1,
        type: "dialoog",
        spreker: "interviewer",
        tekst: resultaat.uitlegTekst,
      };
      state.transcript.push(beurt);
      el.transcriptLog.append(renderTurn(beurt));
      state.wisselingen.push({ rol: "model", inhoud: JSON.stringify([beurt]) });
      zetAntwoordveldActief(true);
      return;
    }

    state.provider = resultaat.provider;
    state.model = resultaat.model;
    state.wisselingen.push({ rol: "model", inhoud: resultaat.ruweTekst });

    for (const beurt of resultaat.beurten) {
      state.transcript.push(beurt);
      el.transcriptLog.append(renderTurn(beurt));
      if (beurt.type === "naamstap") {
        el.interviewNaam.textContent = `— ${beurt.naam}`;
      }
    }

    el.btnCompileer.hidden = false;
    zetAntwoordveldActief(true);
  }

  function zetAntwoordveldActief(actief) {
    el.inputAntwoord.disabled = !actief;
    el.formAntwoord.querySelector("button").disabled = !actief;
    if (actief) el.inputAntwoord.focus();
  }

  function toonInterviewFout(resultaat) {
    const basis = FOUTMELDINGEN[resultaat.reden] ?? `Onverwachte fout: ${resultaat.reden}`;
    el.interviewFout.textContent = resultaat.detail ? `${basis} (${resultaat.detail})` : basis;
    el.interviewFout.hidden = false;
    zetAntwoordveldActief(false);
  }

  function compileerEnValideer() {
    const meta =
      state.modus === "echt"
        ? {
            generated: new Date().toISOString(),
            interviewId: `echt-${Date.now()}`,
            provider: state.provider ?? "onbekend",
            model: state.model ?? "onbekend",
          }
        : {
            generated: new Date().toISOString(),
            interviewId: `demo-${Date.now()}`,
            provider: "demo",
            model: "geen — dit is een afgespeeld transcript, geen live interview",
          };

    const uitvoer = compile(state.transcript, meta);
    const manifestBestand = Object.keys(uitvoer).find((f) => f.startsWith("wereldmodel_"));
    const manifest = JSON.parse(uitvoer[manifestBestand]);
    const resultaat = validateManifest(manifest, state.transcript);

    el.resultaatInhoud.replaceChildren(
      resultaat.valid ? renderGeslaagd(uitvoer) : renderAfkeuring(resultaat.errors),
    );
    toonScherm(el.schermResultaat, alleSchermen);
  }
}
