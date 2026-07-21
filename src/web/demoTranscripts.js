export const demoGeldig = {
  label: "Geldig interview (Sam)",
  beschrijving: "Een volledig interview dat door de validator komt — downloadbare uitvoer aan het eind.",
  transcript: [
    { turn: 1, type: "naamstap", naam: "Sam" },
    { turn: 2, type: "dialoog", spreker: "interviewer", tekst: "Vertel eens over een taak die je elke week doet." },
    { turn: 3, type: "dialoog", spreker: "ondernemer", tekst: "Ik maak elke vrijdag de weekplanning voor het team." },
    { turn: 4, type: "dialoog", spreker: "interviewer", tekst: "Wat gebeurt er als iemand zich ziek meldt vlak voor het weekend?" },
    { turn: 5, type: "dialoog", spreker: "ondernemer", tekst: "Dan bel ik zelf even rond wie kan bijspringen, dat vertrouw ik niemand anders toe." },
    {
      turn: 6,
      type: "taak",
      data: {
        id: "T-0001",
        naam: "Weekplanning maken",
        beschrijving: "Elke vrijdag het team voor de week indelen.",
        trigger: "vrijdagmiddag",
        autonomie: "eerst-vragen",
        escalatie: [
          { als: "iemand meldt zich ziek vlak voor het weekend", dan: "eigenaar regelt vervanging zelf" },
        ],
        faalgevolg: "planning klopt niet, klant staat voor een dichte deur",
        dekking: "GEDEKT",
        source_turns: [3, 4, 5],
      },
    },
    { turn: 7, type: "dialoog", spreker: "interviewer", tekst: "Waarom is dat zo belangrijk voor je?" },
    { turn: 8, type: "dialoog", spreker: "ondernemer", tekst: "Omdat een klant die voor een dichte deur staat, nooit meer terugkomt." },
    {
      turn: 9,
      type: "ziel_principe",
      data: {
        titel: "Betrouwbaarheid boven alles",
        tekst: "Een klant mag nooit voor een dichte deur staan.",
        reden: "Vertrouwen verlies je in één keer en win je nooit meer helemaal terug.",
        dekking: "GEDEKT",
        source_turns: [8],
      },
    },
    { turn: 10, type: "dialoog", spreker: "interviewer", tekst: "Welk gereedschap gebruik je nu voor de planning?" },
    { turn: 11, type: "dialoog", spreker: "ondernemer", tekst: "Een whiteboard in de kantine, eerlijk gezegd." },
    {
      turn: 12,
      type: "tool",
      data: {
        naam: "Whiteboard",
        taak_id: "T-0001",
        soort: "huidig",
        dekking: "GEDEKT",
        source_turns: [11],
      },
    },
    {
      turn: 13,
      type: "tool",
      data: {
        naam: "Digitaal planbord met belafspraken",
        taak_id: "T-0001",
        soort: "suggestie",
        redenering: "Een whiteboard is niet zichtbaar buiten de kantine; een digitaal planbord maakt bijspringen sneller vindbaar.",
        dekking: "AFGELEID",
        source_turns: [11],
      },
    },
    {
      turn: 14,
      type: "skill",
      data: {
        naam: "Team plannen",
        domein: "Operatie",
        dekking: "GEDEKT",
        source_turns: [3],
      },
    },
  ],
};

export const demoFout = {
  label: "Interview met een fout (Robin)",
  beschrijving: "Een taak zonder bronverwijzing — laat zien hoe de validator dit afkeurt, met reden.",
  transcript: [
    { turn: 1, type: "naamstap", naam: "Robin" },
    { turn: 2, type: "dialoog", spreker: "interviewer", tekst: "Vertel eens een vaste taak." },
    { turn: 3, type: "dialoog", spreker: "ondernemer", tekst: "Ik stuur zelf de nieuwsbrief." },
    {
      turn: 4,
      type: "taak",
      data: {
        id: "T-0001",
        naam: "Nieuwsbrief versturen",
        dekking: "GEDEKT",
      },
    },
  ],
};
