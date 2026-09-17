const bouquetWrap = document.querySelector(".bouquet-wrap");
const bouquet = document.querySelector(".bouquet");
const sparkleLayer = document.querySelector(".sparkles");
const petalLayer = document.querySelector(".petals");
const loveButton = document.querySelector("#loveButton");
const loveNote = document.querySelector("#loveNote");
const closeNote = document.querySelector("#closeNote");

const curtain = document.querySelector("#curtain");
const subtitle = document.querySelector("#subtitle");
const SUBTITLE_TEXT = "wala akong ibang uuwian";

const song = document.querySelector("#song");
const player = document.querySelector("#player");
const playToggle = document.querySelector("#playToggle");
const progress = document.querySelector("#progress");
const progressFill = document.querySelector("#progressFill");
const currentTime = document.querySelector("#currentTime");
const totalTime = document.querySelector("#totalTime");
const hint = document.querySelector("#hint");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function typeSubtitle(text) {
  if (reduceMotion) {
    subtitle.textContent = text;
    return;
  }

  subtitle.textContent = "";
  subtitle.classList.add("typing");

  let i = 0;
  const step = () => {
    subtitle.textContent = text.slice(0, i);
    i++;
    if (i <= text.length) {
      setTimeout(step, 55);
    } else {
      subtitle.classList.remove("typing");
    }
  };
  step();
}

let curtainOpened = false;

function openCurtain() {
  if (curtainOpened) return;
  curtainOpened = true;
  started = true;

  curtain.classList.add("open");
  document.body.classList.add("revealed");
  play();

  setTimeout(() => typeSubtitle(SUBTITLE_TEXT), 450);
}

if (reduceMotion) {
  // No curtain to lift; the bouquet and subtitle appear right away,
  // and the song still waits for the visitor's first tap, per browser rules.
  curtainOpened = true;
  curtain.style.display = "none";
  document.body.classList.add("revealed");
  subtitle.textContent = SUBTITLE_TEXT;
} else {
  curtain.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    openCurtain();
  });

  curtain.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      openCurtain();
    }
  });
}

// If the analyser can't read the audio (opening the page straight from a
// file:// path), petals fall back to this tempo instead. Tweak if it drifts.
const FALLBACK_BPM = 76;

// Tiny floating sparkles around the bouquet.
for (let i = 0; i < 18; i++) {
  const sparkle = document.createElement("span");
  sparkle.className = "sparkle";
  sparkle.textContent = Math.random() > 0.5 ? "✦" : "·";
  sparkle.style.left = `${10 + Math.random() * 80}%`;
  sparkle.style.top = `${5 + Math.random() * 85}%`;
  sparkle.style.animationDelay = `${Math.random() * 2.5}s`;
  sparkle.style.fontSize = `${8 + Math.random() * 9}px`;
  sparkleLayer.appendChild(sparkle);
}

// Gentle mouse-follow movement.
window.addEventListener("mousemove", (event) => {
  const x = (event.clientX / window.innerWidth - 0.5);
  const y = (event.clientY / window.innerHeight - 0.5);

  bouquet.style.transform =
    `translate3d(${x * 10}px, ${y * 8}px, 0) rotate(${x * 2 - 1}deg)`;
});

// Touch devices get a gentle tilt when touching the bouquet.
window.addEventListener("deviceorientation", (event) => {
  if (event.gamma == null || event.beta == null) return;

  const x = Math.max(-1, Math.min(1, event.gamma / 30));
  const y = Math.max(-1, Math.min(1, (event.beta - 45) / 30));

  bouquet.style.transform =
    `translate3d(${x * 8}px, ${y * 5}px, 0) rotate(${x * 2 - 1}deg)`;
});

// Falling purple petals.
function createPetal() {
  const petal = document.createElement("span");
  petal.className = "petal";
  petal.textContent = Math.random() > 0.45 ? "✿" : "·";

  petal.style.left = `${Math.random() * 100}vw`;
  petal.style.fontSize = `${9 + Math.random() * 10}px`;
  petal.style.setProperty("--drift", `${-100 + Math.random() * 200}px`);
  petal.style.animationDuration = `${6 + Math.random() * 5}s`;

  petalLayer.appendChild(petal);

  setTimeout(() => petal.remove(), 12000);
}

// Idle drizzle of petals when nothing is playing.
setInterval(() => {
  if (!song.paused) return;
  createPetal();
}, 1100);

// Click/tap bouquet = little burst of petals.
bouquet.addEventListener("click", () => {
  for (let i = 0; i < 10; i++) {
    setTimeout(createPetal, i * 70);
  }

  bouquet.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(1.035) rotate(1deg)" },
      { transform: "scale(1)" }
    ],
    { duration: 500, easing: "ease-out" }
  );
});

// Love note modal.
loveButton.addEventListener("click", () => {
  loveNote.classList.add("show");
});

closeNote.addEventListener("click", () => {
  loveNote.classList.remove("show");
});

loveNote.addEventListener("click", (event) => {
  if (event.target === loveNote) {
    loveNote.classList.remove("show");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    loveNote.classList.remove("show");
  }
});

/* ---------- music ---------- */

song.volume = 0.85;

function formatTime(seconds) {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function play() {
  startAnalyser();
  song.play().catch(() => {
    // Autoplay was refused; the player button still works.
  });
}

playToggle.addEventListener("click", () => {
  started = true;
  if (song.paused) play();
  else song.pause();
});

song.addEventListener("play", () => {
  document.body.classList.add("playing");
  playToggle.setAttribute("aria-label", "Pause song");
  hint.textContent = "move your mouse around ✦";
});

song.addEventListener("pause", () => {
  document.body.classList.remove("playing");
  playToggle.setAttribute("aria-label", "Play song");
  setPulse(0);
});

song.addEventListener("loadedmetadata", () => {
  totalTime.textContent = formatTime(song.duration);
});

song.addEventListener("timeupdate", () => {
  const percent = song.duration ? (song.currentTime / song.duration) * 100 : 0;
  progressFill.style.width = `${percent}%`;
  currentTime.textContent = formatTime(song.currentTime);
  progress.setAttribute("aria-valuenow", Math.round(percent));
});

// Scrubbing.
function seekFromEvent(event) {
  const box = progress.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
  if (song.duration) song.currentTime = ratio * song.duration;
}

progress.addEventListener("pointerdown", (event) => {
  started = true;
  seekFromEvent(event);
  progress.setPointerCapture(event.pointerId);

  const move = (e) => seekFromEvent(e);
  const up = () => {
    progress.removeEventListener("pointermove", move);
    progress.removeEventListener("pointerup", up);
  };

  progress.addEventListener("pointermove", move);
  progress.addEventListener("pointerup", up);
});

progress.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") song.currentTime += 5;
  if (event.key === "ArrowLeft") song.currentTime -= 5;
});

// First tap anywhere on the page starts the song.
let started = false;

function firstInteraction(event) {
  if (started) return;
  // Taps inside the player are handled by the player's own controls.
  if (event.target.closest && event.target.closest(".player")) {
    started = true;
    return;
  }
  started = true;
  play();
}

document.addEventListener("pointerdown", firstInteraction);
document.addEventListener("keydown", firstInteraction);

/* ---------- beat reaction ---------- */

let pulse = 0;
let analyser = null;
let freqData = null;
let audioCtx = null;
let running = 0;
let lastBeat = -1;

function setPulse(value) {
  pulse = value;
  document.documentElement.style.setProperty("--pulse", value.toFixed(3));
}

function startAnalyser() {
  if (audioCtx) {
    if (audioCtx.state === "suspended") audioCtx.resume();
    return;
  }

  // A file:// page can't be analysed without silencing the audio,
  // so only wire up the analyser when the page is actually served.
  const canAnalyse = location.protocol === "http:" || location.protocol === "https:";
  if (!canAnalyse) return;

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
    const source = audioCtx.createMediaElementSource(song);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    freqData = new Uint8Array(analyser.frequencyBinCount);
  } catch (err) {
    analyser = null;
  }
}

function beat(strength) {
  if (reduceMotion) return;
  setPulse(Math.min(1, Math.max(pulse, strength)));
  createPetal();
  if (strength > 0.75) createPetal();
}

function frame(now) {
  requestAnimationFrame(frame);
  if (song.paused) return;

  if (analyser) {
    analyser.getByteFrequencyData(freqData);

    // Low bins carry the kick and the bass line.
    let sum = 0;
    for (let i = 1; i <= 14; i++) sum += freqData[i];
    const energy = sum / 14 / 255;

    running = running * 0.97 + energy * 0.03;

    if (energy > running * 1.32 && energy > 0.22 && now - lastBeat > 260) {
      lastBeat = now;
      beat(Math.min(1, energy * 1.25));
    }

    // Glow tracks loudness between beats, then eases back down.
    const target = Math.min(1, energy * 1.1);
    setPulse(pulse + (target - pulse) * (target > pulse ? 0.45 : 0.08));
  } else {
    // Tempo fallback, locked to the song's own clock so it never drifts.
    const beatLength = 60 / FALLBACK_BPM;
    const index = Math.floor(song.currentTime / beatLength);
    if (index !== lastBeat) {
      lastBeat = index;
      beat(index % 2 === 0 ? 0.85 : 0.55);
    }
    setPulse(Math.max(0, pulse - 0.035));
  }
}

requestAnimationFrame(frame);