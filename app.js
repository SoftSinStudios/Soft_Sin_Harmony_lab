console.log("Harmony Lab JS Loaded");

window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Ready");
});

/* constants and state */

const NOTES = ["C","C#","D","D#","Eb","E","F","F#","G","G#","Ab","A","A#","Bb","B"];

const State = {
  key: "C",
  scale: "major",
  tuning: "E Standard",
  progression: ["C","Am","F","G"],
  currentVibe: "sad",
  scales: {
    major:      [0,2,4,5,7,9,11],
    minor:      [0,2,3,5,7,8,10],
    harmonic:   [0,2,3,5,7,8,11],
    melodic:    [0,2,3,5,7,9,11]
  },
  tunings: {
    "E Standard": ["E2","A2","D3","G3","B3","E4"],
    "Drop D":     ["D2","A2","D3","G3","B3","E4"]
  },
  progressionLibrary: {
	  sad: [
		["Am","F","C","G"],
		["Em","C","G","D"],
		["Dm","Bb","F","C"],

		// NEW (fits sad, reflective, minor-heavy)
		["Cm","Ab","Eb","Bb"],
		["Bm","G","D","A"],
		["Gm","Eb","Bb","F"],
		["Em","D","C","Am"]
	  ],

	  dark: [
		["Em","G","F","Em"],
		["Bm","G","A","F#"],
		["Cm","Ab","Eb","Bb"],

		// NEW (brooding, modal, low-root tonalities)
		["F#m","D","E","C#"],
		["Dm","Gm","Eb","F"],
		["Am","F","G","Em"],
		["Gm","F","Eb","D"]
	  ],

	  asian: [
		["Am","G","F","G"],
		["Em","D","C","D"],
		["Dm","C","Bb","C"],

		// NEW (pentatonic-leaning, modal interchange)
		["Em","C","D","C"],
		["Am","Em","G","Em"],
		["Dm","Am","G","Am"],
		["C","G","Am","G"]
	  ],

	  ballad: [
		["C","G","Am","F"],
		["G","Em","C","D"],
		["F","C","Dm","Bb"],

		// NEW (soft, emotional, resolves well)
		["Am","F","G","C"],
		["D","A","Bm","G"],
		["Bb","F","Gm","Eb"],
		["Em","C","G","D"]
	  ],

	  haunted: [
		["Em","C","D","B7"],
		["Am","F","E","E"],
		["Dm","Bb","C","A"],

		// NEW (dark cadences, modal tension, Phrygian touches)
		["F#m","D","E","C#dim"],
		["Gm","Eb","F","D"],
		["Bm","G","A","F#"],
		["Em","B7","C","Am"]
	  ],

	  pop: [
		["C","G","Am","F"],
		["G","D","Em","C"],
		["F","C","G","Am"],

		// NEW (radio-friendly, bright, predictable)
		["D","A","Bm","G"],
		["E","B","C#m","A"],
		["A","E","F#m","D"],
		["Bb","F","Gm","Eb"]
	  ]
	}
};

let synth = null;
let audioReady = false;

async function initAudio() {
  if (audioReady) return;
  await Tone.start();
  synth = new Tone.PolySynth(Tone.Synth).toDestination();
  audioReady = true;
  console.log("Audio initialized");
}

/* helpers */

function parseNote(note) {
  let name = note.replace(/[0-9]/g, "");
  let octave = parseInt(note.replace(/[^0-9]/g, ""));
  return { name, octave, index: NOTES.indexOf(name) };
}

function noteFromIndex(startIndex, startOctave, offset) {
  let idx = (startIndex + offset) % 12;
  let octave = startOctave + Math.floor((startIndex + offset) / 12);
  return NOTES[idx] + octave;
}

function pitchClass(n) {
  return NOTES.indexOf(n.replace(/[0-9]/g, ""));
}

function getScaleInfo() {
  // raw index in NOTES (may be 0–14)
  let idx = NOTES.indexOf(State.key);
  if (idx === -1) idx = 0;

  // compress to 0–11 so it matches pitchClass() and fretboard data
  const rootPc = idx % 12;

  const steps = State.scales[State.scale] || State.scales.major;
  const pcs = steps.map(s => (rootPc + s) % 12);
  const names = pcs.map(i => NOTES[i]);

  return {
    rootIndex: rootPc,    // used for red root dot
    rootName: State.key,  // keep the label as-is
    pcs,
    names
  };
}


/* ---------------- CIRCLE OF FIFTHS ---------------- */

const FIFTHS_MAJOR = ["C","G","D","A","E","B","F#","C#","G#","D#","A#","F"];
const FIFTHS_MINOR = ["Am","Em","Bm","F#m","C#m","G#m","D#m","A#m","Fm","Cm","Gm","Dm"];

function renderCircle() {
  const svg = document.querySelector("#circleSVG");
  svg.innerHTML = "";

  const radiusOuter = 130;
  const radiusInner = 90;
  const angle = (2 * Math.PI) / 12;

  for (let i = 0; i < 12; i++) {
    const start = i * angle;
    const end = start + angle;

    drawSlice(svg, start, end, radiusOuter, radiusInner, FIFTHS_MAJOR[i], true);
    drawSlice(svg, start, end, radiusInner, 50, FIFTHS_MINOR[i], false);
  }
}

function drawSlice(svg, start, end, rOuter, rInner, label, isMajor) {
  const x1o = rOuter * Math.sin(start);
  const y1o = -rOuter * Math.cos(start);
  const x2o = rOuter * Math.sin(end);
  const y2o = -rOuter * Math.cos(end);

  const x1i = rInner * Math.sin(start);
  const y1i = -rInner * Math.cos(start);
  const x2i = rInner * Math.sin(end);
  const y2i = -rInner * Math.cos(end);

  const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const largeArc = end - start > Math.PI ? 1 : 0;
  const d = [
    "M", x1i, y1i,
    "L", x1o, y1o,
    "A", rOuter, rOuter, 0, largeArc, 1, x2o, y2o,
    "L", x2i, y2i,
    "A", rInner, rInner, 0, largeArc, 0, x1i, y1i,
    "Z"
  ].join(" ");

  p.setAttribute("d", d);
  p.classList.add(isMajor ? "circle-slice-major" : "circle-slice-minor");
  svg.appendChild(p);

  const mid = (start + end) / 2;
  const labelRadius = (rOuter + rInner) / 2;
  const lx = labelRadius * Math.sin(mid);
  const ly = -labelRadius * Math.cos(mid);

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", lx);
  text.setAttribute("y", ly + 4);
  text.setAttribute("text-anchor", "middle");
  text.classList.add(isMajor ? "slice-label" : "slice-label-minor");
  text.textContent = label;
  svg.appendChild(text);

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.appendChild(p);
  group.appendChild(text);

  group.addEventListener("click", () => {
    if (isMajor) {
      State.key = label;
      State.scale = "major";
      document.querySelector("#keySelect").value = label;
      document.querySelector("#scaleSelect").value = "major";
    } else {
      State.key = label.replace("m", "");
      State.scale = "minor";
      document.querySelector("#keySelect").value = State.key;
      document.querySelector("#scaleSelect").value = "minor";
    }
    highlightSlices();
    renderAll();
  });

  svg.appendChild(group);
}

function highlightSlices() {
  const svg = document.querySelector("#circleSVG");
  if (!svg) return;

  const texts = svg.querySelectorAll("text");
  svg.querySelectorAll("path").forEach(p => {
    p.classList.remove("slice-active-major", "slice-active-minor");
  });

  texts.forEach(t => {
    const label = t.textContent;
    const isMinor = label.includes("m") && label !== "C#m" && label !== "G#m" && label !== "D#m" && label !== "A#m";
    if (!isMinor && label === State.key) {
      const path = t.previousSibling;
      path.classList.add("slice-active-major");
    }
    if (isMinor && label === State.key + "m") {
      const path = t.previousSibling;
      path.classList.add("slice-active-minor");
    }
  });
}

/* chord diagram shapes for open and simple barre chords
   order: [lowE, A, D, G, B, highE]
   "x" = mute, 0 = open, number = fret
*/

/* chord diagram shapes for open and simple barre chords
   order: [lowE, A, D, G, B, highE]
   "x" = mute, 0 = open, number = fret
*/

/* chord diagram shapes for open and simple barre chords
   order: [lowE, A, D, G, B, highE]
   "x" = mute, 0 = open, number = fret
*/

const OPEN_CHORD_SHAPES = {
  // ── C family ───────────────────────────────────────────
  "C":    ["x", 3, 2, 0, 1, 0],          // existing
  "Cm":   ["x", 3, 5, 5, 4, 3],
  "Cdim": ["x", 3, 4, 5, 4, "x"],

  "C#":   ["x", 4, 6, 6, 6, 4],
  "C#m":  ["x", 4, 6, 6, 5, 4],
  "C#dim":["x", 4, 5, 6, 5, "x"],

  // ── D family ───────────────────────────────────────────
  "D":    ["x", "x", 0, 2, 3, 2],        // existing
  "Dm":   ["x", "x", 0, 2, 3, 1],        // existing
  "Ddim": ["x", 5, 6, 7, 6, "x"],

  "D#":   ["x", 6, 8, 8, 8, 6],
  "D#m":  ["x", 6, 8, 8, 7, 6],
  "D#dim":["x", 6, 7, 8, 7, "x"],

  // ── E family ───────────────────────────────────────────
  "E":    [0,  2, 2, 1, 0, 0],           // existing
  "Em":   [0,  2, 2, 0, 0, 0],           // existing (your template)
  "Edim": ["x", 7, 8, 9, 8, "x"],

  // ── F family ───────────────────────────────────────────
  "F":    [1,  3, 3, 2, 1, 1],           // existing
  "Fm":   [1,  3, 3, 1, 1, 1],
  "Fdim": ["x", 8, 9, 10, 9, "x"],

  "F#":   [2,  4, 4, 3, 2, 2],
  "F#m":  [2,  4, 4, 2, 2, 2],           // existing
  "F#dim":["x", 9, 10, 11, 10, "x"],

  // ── G family ───────────────────────────────────────────
  "G":    [3,  2, 0, 0, 0, 3],           // existing
  "Gm":   [3,  5, 5, 3, 3, 3],
  "Gdim": ["x", 10, 11, 12, 11, "x"],

  "G#":   [4,  6, 6, 5, 4, 4],
  "G#m":  [4,  6, 6, 4, 4, 4],
  "G#dim":["x", 11, 12, 13, 12, "x"],

  // ── A family ───────────────────────────────────────────
  "A":    ["x", 0, 2, 2, 2, 0],          // existing
  "Am":   ["x", 0, 2, 2, 1, 0],          // existing
  "Adim": ["x", 12, 13, 14, 13, "x"],    // A-root dim

  "A#":   ["x", 1, 3, 3, 3, 1],
  "A#m":  ["x", 1, 3, 3, 2, 1],
  "A#dim":["x", 13, 14, 15, 14, "x"],

  // ── B family ───────────────────────────────────────────
  "B":    ["x", 2, 4, 4, 4, 2],
  "Bm":   ["x", 2, 4, 4, 3, 2],          // existing
  "Bdim": ["x", 2, 3, 4, 3, "x"],
  
  // -- flats -----------------------------------------------
  "Bb": ["x", 1, 3, 3, 3, 1],
  "Ab": [4, 6, 6, 5, 4, 4],
  "Eb": ["x", 6, 8, 8, 8, 6],
  "Ebm":  ["x", 6, 8, 8, 7, 6],        // same as D#m
  "Abm":  [4, 6, 6, 4, 4, 4],          // same as G#m
  "Abdim":["x", 11, 12, 13, 12, "x"],  // same as G#dim
  "Ebdim":["x", 6, 7, 8, 7, "x"]       // same as D#dim
};

/* diatonic chords and diagram rendering */

function getDiatonicChordNamesForKey() {
  const rootIndex = NOTES.indexOf(State.key);
  if (rootIndex === -1) return [];

  const minorLikeScales = ["minor", "harmonic", "melodic"];
  const isMinorKey = minorLikeScales.includes(State.scale);

  const majorSteps = State.scales.major;
  const minorSteps = State.scales.minor;
  const steps = isMinorKey ? minorSteps : majorSteps;

  const qualities = isMinorKey
    ? ["minor", "dim", "major", "minor", "minor", "major", "major"]
    : ["major", "minor", "minor", "major", "major", "minor", "dim"];

  const chords = [];

  for (let i = 0; i < 7; i++) {
    const pc = (rootIndex + steps[i]) % 12;
    const rootName = NOTES[pc];
    const quality = qualities[i];

    let symbol = rootName;
    if (quality === "minor") symbol += "m";
    else if (quality === "dim") symbol += "dim";

    chords.push(symbol);
  }

  return chords;
}

function renderChordDiagrams() {
  const grid = document.querySelector("#chordDiagramGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const chordNames = getDiatonicChordNamesForKey();

  chordNames.forEach(name => {
    const shape = OPEN_CHORD_SHAPES[name];

    const card = document.createElement("div");
    card.className = "chord-diagram";

    const label = document.createElement("div");
    label.className = "chord-name";
    label.textContent = name;
    card.appendChild(label);

    // No shape yet → "diagram pending"
    if (!shape) {
      const missing = document.createElement("div");
      missing.textContent = "diagram pending";
      missing.style.fontSize = "10px";
      missing.style.color = "#777";
      card.appendChild(missing);
      grid.appendChild(card);
      return;
    }

    // Find the lowest fretted note (>0)
    const numericFrets = shape.filter(v => typeof v === "number" && v > 0);
    const shapeMinFret = numericFrets.length ? Math.min(...numericFrets) : 1;

    // Decide which 5 frets to show
    const startFret = Math.max(1, shapeMinFret - 1);
    const endFret   = startFret + 4; // 5 rows total

    const diagram = document.createElement("div");
    diagram.className = "diagram-grid";

    // ── top row: empty corner + string markers (x / o) ─────────────────
    const corner = document.createElement("div");
    corner.className = "diagram-corner";
    diagram.appendChild(corner);

    for (let s = 0; s < 6; s++) {
      const marker = document.createElement("div");
      marker.className = "diagram-marker";
      const val = shape[s];
      if (val === "x") marker.textContent = "x";
      else if (val === 0) marker.textContent = "o";
      diagram.appendChild(marker);
    }

    // ── fret rows: startFret … endFret, with numbers on the left ────────
    for (let fret = startFret; fret <= endFret; fret++) {
      // left-side fret number
      const numCell = document.createElement("div");
      numCell.className = "diagram-fret-num";
      numCell.textContent = fret;
      diagram.appendChild(numCell);

      // six string cells for this fret
      for (let s = 0; s < 6; s++) {
        const cell = document.createElement("div");
        cell.className = "diagram-cell";

        // Only show nut on actual fret 1
        if (fret === 1) {
          cell.classList.add("nut-cell");
        }

        if (shape[s] === fret) {
          const dot = document.createElement("div");
          dot.className = "diagram-dot";
          cell.appendChild(dot);
        }

        diagram.appendChild(cell);
      }
    }

    card.appendChild(diagram);

    // Bottom label: "2fr", "3fr", etc, based on chord's lowest fretted note
    const fretLabel = document.createElement("div");
    fretLabel.className = "fret-label";
    fretLabel.textContent = shapeMinFret > 1 ? shapeMinFret + "fr" : "";
    card.appendChild(fretLabel);

    grid.appendChild(card);
  });
}

// 6-4-1-5 diagram 
function renderSixFourOneFiveDiagram() {
  const container = document.querySelector("#sixFourOneFive");
  if (!container) return;

  container.innerHTML = "";

  // Use diatonic chord list so we get proper triads (C, Am, F, G, etc)
  const diatonic = getDiatonicChordNamesForKey();
  if (!diatonic || diatonic.length < 7) return;

  // degrees 6–4–1–5 in the current key
  const degrees = [6, 4, 1, 5];
  const minorLike = ["minor", "harmonic", "melodic"].includes(State.scale);

  degrees.forEach((deg, idx) => {
    const chordName = diatonic[deg - 1];
    if (!chordName) return;

    const step = document.createElement("div");
    step.className = "sfif-step";

    const chordSpan = document.createElement("div");
    chordSpan.className = "sfif-chord";
    chordSpan.textContent = chordName;

    const romanSpan = document.createElement("div");
    romanSpan.className = "sfif-roman";
    romanSpan.textContent = romanNumeralForDegree(deg, minorLike);

    step.appendChild(chordSpan);
    step.appendChild(romanSpan);
    container.appendChild(step);

    if (idx < degrees.length - 1) {
      const arrow = document.createElement("div");
      arrow.className = "sfif-arrow";
      arrow.textContent = "→";
      container.appendChild(arrow);
    }
  });
}

/* chord shapes */

function detectChordQuality(chord) {
  if (chord.includes("dim")) return "dim";
  if (chord.includes("maj7")) return "maj7";
  if (chord.includes("m7")) return "min7";
  if (/m(?!aj)/.test(chord)) return "minor";
  return "major";
}

function generateChordShapesForChord(rootName, quality) {
  const tones = {
    major: [0,4,7],
    minor: [0,3,7],
    dim:   [0,3,6],
    maj7:  [0,4,7,11],
    min7:  [0,3,7,10]
  }[quality] || [0,4,7];

  const rootIndex = NOTES.indexOf(rootName.replace("m", ""));
  if (rootIndex === -1) return [];

  const noteNames = tones.map(semitones => NOTES[(rootIndex + semitones) % 12]);
  return noteNames;
}

function updateChordShapesForProgression(prog) {
  const container = document.querySelector("#shapeList");
  container.innerHTML = "";

  const seen = new Set();

  prog.forEach((chord, idx) => {
    const rootName = chord.replace(/[^A-G#b]/g, "");
    const quality = detectChordQuality(chord);

    const key = chord;
    if (seen.has(key)) return;
    seen.add(key);

    const tones = generateChordShapesForChord(rootName, quality);

    const pill = document.createElement("div");
    pill.className = "shape-pill";

    const nameSpan = document.createElement("span");
    nameSpan.className = "shape-name";
    nameSpan.textContent = chord;

    const toneSpan = document.createElement("span");
	toneSpan.className = "shape-tones";

	const [rootNote, third, fifth] = tones;
	const reordered = [rootNote, fifth, third];

	toneSpan.textContent = reordered.join(" • ");

    pill.appendChild(nameSpan);
    pill.appendChild(toneSpan);
    container.appendChild(pill);
  });
}

/* ---------------- FRETBOARD ---------------- */

function buildFretboard() {
  const { names } = getScaleInfo();
  const tuning = State.tunings[State.tuning];

  const fretboard = document.createElement("div");
  fretboard.id = "fretboardGrid";

  for (let fret = 0; fret <= 12; fret++) {
    const col = document.createElement("div");
    col.className = "fret-col";

    const labelCell = document.createElement("div");
    labelCell.className = "fret-label-cell";
    labelCell.textContent = fret;
    col.appendChild(labelCell);

    // FLIP STRING ORDER: high E (last) at top → low E (first) at bottom
    for (let s = tuning.length - 1; s >= 0; s--) {
      const stringCell = document.createElement("div");
      stringCell.className = "string-cell";

      if (fret === 0) {
        const nameDiv = document.createElement("div");
        nameDiv.className = "string-name";
        nameDiv.textContent = tuning[s].replace(/[0-9]/g, "");
        stringCell.appendChild(nameDiv);
      }

      const open = parseNote(tuning[s]);
      const note = noteFromIndex(open.index, open.octave, fret);
      const pc = pitchClass(note);

      stringCell.dataset.note = note;
      stringCell.dataset.pitchClass = pc;

      col.appendChild(stringCell);
    }

    fretboard.appendChild(col);
  }

  const host = document.querySelector("#fretboard");
  host.innerHTML = "";
  host.appendChild(fretboard);
}

function renderFretboard() {
  const { pcs, rootIndex } = getScaleInfo();
  const host = document.querySelector("#fretboard");
  const grid = host.querySelector("#fretboardGrid");
  if (!grid) return;

  grid.querySelectorAll(".scale-note-dot").forEach(el => el.remove());

  const cells = grid.querySelectorAll(".string-cell");
  cells.forEach(cell => {
    const pc = parseInt(cell.dataset.pitchClass, 10);
    if (pcs.includes(pc)) {
      const dot = document.createElement("div");
      dot.className = "scale-note-dot";
      if (pc === rootIndex) dot.classList.add("root");
      dot.textContent = NOTES[pc];
      cell.appendChild(dot);
    }
  });
}

/* ---------------- VIBES & PROGRESSIONS ---------------- */

function loadProgressions(vibe) {
  State.currentVibe = vibe;

  const list = document.querySelector("#progressionList");
  list.innerHTML = "";

  document.querySelectorAll("#vibes .vibe").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.vibe === vibe);
  });

  const arr = State.progressionLibrary[vibe] || [];

  arr.forEach((prog, index) => {
    const d = document.createElement("div");
    d.className = "prog";
    d.textContent = prog.join(" ");

    d.addEventListener("click", () => {
      document.querySelectorAll(".prog").forEach(p => p.classList.remove("active"));
      d.classList.add("active");
      State.progression = [...prog];
      renderComposer();
      updateChordShapesForProgression(prog);
    });

    if (index === 0) {
      d.classList.add("active");
    }

    list.appendChild(d);
  });

  if (arr.length > 0) {
    State.progression = [...arr[0]];
    renderComposer();
    updateChordShapesForProgression(arr[0]);
  } else {
    State.progression = [];
    renderComposer();
    updateChordShapesForProgression([]);
  }
}

/* ---------------- COMPOSER BAR ---------------- */

function romanNumeralForDegree(degree, isMinorKey) {
  const major = ["I","II","III","IV","V","VI","VII"];
  const minor = ["i","ii","iii","iv","v","vi","vii"];
  return isMinorKey ? minor[degree - 1] : major[degree - 1];
}

function degreeFromChordName(chordName) {
  const { pcs, rootIndex } = getScaleInfo();
  const root = chordName.replace(/[^A-G#b]/g, "");
  const pc = NOTES.indexOf(root);
  const ix = pcs.indexOf(pc);
  if (ix === -1) return null;
  return ix + 1;
}

function renderComposer() {
  const wrap = document.querySelector("#composerInner");
  wrap.innerHTML = "";

  const label = document.createElement("span");
  label.className = "label";
  label.textContent = "Progression";
  wrap.appendChild(label);

  const minorLike = ["minor","harmonic","melodic"].includes(State.scale);

  State.progression.forEach(chord => {
    const deg = degreeFromChordName(chord);
    const roman = deg ? romanNumeralForDegree(deg, minorLike) : "?";

    const chordWrap = document.createElement("span");
    chordWrap.className = "composer-chord";

    const pill = document.createElement("span");
    pill.className = "chord-pill";

    const rootSpan = document.createElement("span");
    rootSpan.className = "chord-root";
    rootSpan.textContent = chord;

    const romanSpan = document.createElement("span");
    romanSpan.className = "chord-roman";
    romanSpan.textContent = roman;

    pill.appendChild(rootSpan);
    pill.appendChild(romanSpan);
    chordWrap.appendChild(pill);

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-chord";
    removeBtn.textContent = "X";
    removeBtn.addEventListener("click", () => {
      State.progression = State.progression.filter(c => c !== chord);
      renderComposer();
    });

    chordWrap.appendChild(removeBtn);
    wrap.appendChild(chordWrap);
  });

  const add = document.createElement("button");
  add.textContent = "+ Add Chord";
  add.addEventListener("click", () => {
    const chord = prompt("Enter chord name (e.g. C, Am, F, G):");
    if (!chord) return;
    State.progression.push(chord);
    renderComposer();
    updateChordShapesForProgression(State.progression);
  });
  wrap.appendChild(add);
}

/* ---------------- AUDIO ACTIONS ---------------- */

async function playChord(root) {
  await initAudio();
  const r = Tone.Frequency(root);
  const notes = [
    root,
    r.transpose(4).toNote(),
    r.transpose(7).toNote()
  ];
  synth.triggerAttackRelease(notes, 0.6);
}

async function playScale() {
  await initAudio();
  const notes = getScaleAudioNotes(3); // ascending scale across octaves
  for (let n of notes) {
    synth.triggerAttackRelease(n, 0.3);
    await new Promise(r => setTimeout(r, 300));
  }
}

async function playProgression() {
  await initAudio();
  for (let chord of State.progression) {
    const rootName = chord.replace(/[^A-G#b]/g, "");
    const freq = rootName + "3";
    await playChord(freq);
    await new Promise(r => setTimeout(r, 400));
  }
}

function getScaleAudioNotes(octaveStart = 3) {
  const { pcs } = getScaleInfo();
  const notes = [];
  let octave = octaveStart;

  for (let i = 0; i < pcs.length; i++) {
    const pc = pcs[i];
    const name = NOTES[pc];
    notes.push(name + octave);
    if (name === "B") octave++;
  }

  return notes;
}

/* ---------------- UI BINDING ---------------- */

function bindUI() {
  document.querySelectorAll(".vibe").forEach(btn => {
    btn.addEventListener("click", () => {
      loadProgressions(btn.dataset.vibe);
    });
  });

  document.querySelector("#keySelect").addEventListener("change", e => {
    State.key = e.target.value;
    renderAll();
  });

  document.querySelector("#scaleSelect").addEventListener("change", e => {
    State.scale = e.target.value;
    renderall();
  });

  document.querySelector("#tuningSelect").addEventListener("change", e => {
    State.tuning = e.target.value;
    buildFretboard();
    renderFretboard();
    updateChordShapesForProgression(State.progression);
  });

  const circleHost = document.querySelector("#circle");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "-150 -150 300 300");
  svg.id = "circleSVG";
  circleHost.appendChild(svg);
}

/* ---------------- RENDER ALL ---------------- */

function renderAll() {
  renderCircle();
  buildFretboard();
  renderFretboard();
  updateChordShapesForProgression(State.progression);
  renderChordDiagrams();
  renderSixFourOneFiveDiagram();
}

/* boot */

window.addEventListener("DOMContentLoaded", () => {
  bindUI();
  loadProgressions("sad");
  renderAll();
  renderComposer();
});
