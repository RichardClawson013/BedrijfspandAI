import { compile } from "../compiler/compile.js";
import { validateManifest } from "../validator/validateManifest.js";
import { demoGeldig, demoFout } from "./demoTranscripts.js";
import { renderTurn, renderGeslaagd, renderAfkeuring } from "./render.js";
import { INTERVIEW_SYSTEEM_PROMPT } from "../interview/systemPrompt.js";
import { vraagModelBeurt } from "../interview/interviewClient.js";

const DEMOS = { geldig: demoGeldig, fout: demoFout };

const FOUTMELDINGEN = {
  "doorgeefluik-onbereikbaar":
    "Het doorgeefluik is niet bereikbaar. Controleer of het draait en probeer het opnieuw.",
  "doorgeefluik-fout": "Het doorgeefluik wees het verzoek af.",
  "ongeldig-antwoord-na-herstelpogingen":
    "Het model bleef ongeldige antwoorden geven, ook na herstelpogingen. Het interview is gestopt.",
};

function els() {
  return {
    schermCode: document.getElementById("scherm-code"),
    schermIntro: document.getElementById("scherm-intro"),
    schermInterview: document.getElementById("scherm-interview"),
    schermResultaat: document.getElementById("scherm-resultaat"),
    formCode: document.getElementById("form-code"),
    inputCode: document.getElementById("input-code"),
    inputApi: document.getElementById("input-api"),
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

  el.formCode.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = el.inputCode.value.trim();
    const apiUrl = el.inputApi.value.trim();
    if (code) {
      startEchteInterview(code, apiUrl);
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

  function startEchteInterview(code, apiUrl) {
    state.modus = "echt";
    state.code = code;
    state.apiUrl = apiUrl;
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
    haalVolgendeModelBeurtOp();
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
