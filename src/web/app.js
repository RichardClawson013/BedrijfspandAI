import { compile } from "../compiler/compile.js";
import { validateManifest } from "../validator/validateManifest.js";
import { demoGeldig, demoFout } from "./demoTranscripts.js";
import { renderTurn, renderGeslaagd, renderAfkeuring } from "./render.js";

const DEMOS = { geldig: demoGeldig, fout: demoFout };

function els() {
  return {
    schermCode: document.getElementById("scherm-code"),
    schermIntro: document.getElementById("scherm-intro"),
    schermInterview: document.getElementById("scherm-interview"),
    schermResultaat: document.getElementById("scherm-resultaat"),
    formCode: document.getElementById("form-code"),
    btnDemo: document.getElementById("btn-demo"),
    demoKnoppen: document.querySelectorAll("[data-demo]"),
    interviewNaam: document.getElementById("interview-naam"),
    transcriptLog: document.getElementById("transcript-log"),
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

  const state = { transcript: [], turnIndex: 0 };

  el.formCode.addEventListener("submit", (event) => {
    event.preventDefault();
    toonScherm(el.schermIntro, alleSchermen);
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

  function startDemo(sleutel) {
    const demo = DEMOS[sleutel];
    state.transcript = demo.transcript;
    state.turnIndex = 0;
    el.transcriptLog.replaceChildren();
    el.interviewNaam.textContent = "";
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

  function compileerEnValideer() {
    const meta = {
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
