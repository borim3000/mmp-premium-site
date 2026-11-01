/* =========================================================
   Flappy Spatz – das Minigame von MMP Premium
   Leertaste, Klick oder Tippen lässt den Spatz flattern.
   Gezeichnet wird alles in ein <canvas> (requestAnimationFrame).

   Achievements (shared.js): "flappy" beim Öffnen der Seite,
   "flappy10" ab FLAPPY_GOAL Punkten. Der Rekord wird nur im Browser gespeichert.
   ========================================================= */

const FLAPPY_GOAL = 10; // Punkte für das Achievement "Vielflieger"
const BEST_KEY = "mmp_flappy_best";
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// Spielwelt in festen Einheiten (Hochformat). Das Canvas wird auf die Bildschirmgrösse skaliert.
const W = 360;
const H = 640;
const GROUND = 64; // Höhe des Bodens

// Hier lässt sich das Spiel leichter oder schwerer machen
const PHYSICS = { gravity: 1500, flap: -430, maxFall: 720 };
const PILLAR = {
  width: 64,
  gap: 168, // Lücke zwischen oberer und unterer Säule
  spacing: 210, // Abstand zwischen zwei Säulen
  speed: 150, // Startgeschwindigkeit
  speedUp: 3, // pro Punkt etwas schneller ...
  maxSpeed: 230, // ... aber höchstens so schnell
  margin: 70, // Lücke nie näher als das an Decke und Boden
};
const BIRD = { x: 96, size: 54, radius: 16 }; // radius = Trefferfläche, etwas kleiner als das Bild

const canvas = document.querySelector("[data-flappy-canvas]");
const ctx = canvas.getContext("2d");
const stage = canvas.parentElement;
const bestOutput = document.querySelector("[data-flappy-best]");
const statusText = document.querySelector("[data-flappy-status]");
document.querySelector("[data-flappy-goal]").textContent = FLAPPY_GOAL;

/* ---------- Bilder und Töne ---------- */

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}
const birdFly = loadImage("img/vogel-fliegt.png");
const birdCrash = loadImage("img/vogel-chillt.png");
const mountains = loadImage("img/berge_clean_v2.jpg");

// Berge vorbereiten: einmal normal, einmal gespiegelt nebeneinander, so läuft der Hintergrund endlos
let background = null;
mountains.addEventListener("load", () => {
  const width = Math.round((mountains.width * H) / mountains.height);
  background = document.createElement("canvas");
  background.width = width * 2;
  background.height = H;
  const bg = background.getContext("2d");
  bg.drawImage(mountains, 0, 0, width, H);
  bg.save();
  bg.translate(width * 2, 0);
  bg.scale(-1, 1);
  bg.drawImage(mountains, 0, 0, width, H);
  bg.restore();
});

const peep = new Audio("sound/peep.mp3");
const faah = new Audio("sound/faahhhh.mp3");
function playSound(audio, { volume = 1, rate = 1 } = {}) {
  const sound = audio.cloneNode();
  sound.volume = volume;
  sound.preservesPitch = false;
  sound.playbackRate = rate;
  sound.play().catch(() => {});
}

// Kurzer "Ding" für einen Punkt, mit der Web Audio API erzeugt
let audioCtx = null;
function ding() {
  try {
    audioCtx =
      audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const t = audioCtx.currentTime;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1320, t + 0.08);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  } catch {
    /* ohne Ton weiterspielen */
  }
}

/* ---------- Spielzustand ---------- */

let state = "ready"; // "ready" (wartet), "play", "paused", "over"
let bird;
let pillars;
let score;
let best = 0;
let newBest = false;
let speed;
let bgX = 0;
let groundX = 0;
let time = 0;
let overAt = 0;
let shake = 0;

try {
  best = Number(localStorage.getItem(BEST_KEY)) || 0;
} catch {
  /* privates Fenster */
}
bestOutput.textContent = best;

function reset() {
  bird = { y: H * 0.42, vy: 0, rot: 0 };
  pillars = [];
  score = 0;
  newBest = false;
  speed = PILLAR.speed;
  state = "ready";
}

function addPillar(x) {
  const min = PILLAR.margin + PILLAR.gap / 2;
  const max = H - GROUND - PILLAR.margin - PILLAR.gap / 2;
  pillars.push({ x, gapY: min + Math.random() * (max - min), scored: false });
}

// Wer den pinken Spatz schnell anklickt, klickt oft noch weiter, während die Seite schon lädt.
// Darum startet das Spiel erst, wenn die Seite kurz offen ist.
const START_DELAY = 500; // ms nach dem Laden
const pageOpened = performance.now();

function flap() {
  if (state === "ready" && performance.now() - pageOpened < START_DELAY) return;
  if (state === "over") {
    if (time - overAt < 0.6) return; // kurz warten, damit man nicht aus Versehen neu startet
    reset();
    return;
  }
  if (state === "ready" || state === "paused") {
    if (state === "ready") addPillar(W + 140);
    state = "play";
  }
  bird.vy = PHYSICS.flap;
  playSound(peep, { volume: 0.35, rate: 0.9 + Math.random() * 0.3 });
}

function crash() {
  state = "over";
  overAt = time;
  shake = reduceMotion ? 0 : 0.35;
  playSound(faah, { volume: 0.075 }); // bewusst leise, sonst erschrickt man bei jedem Absturz
  if (score > best) {
    best = score;
    newBest = true;
    bestOutput.textContent = best;
    try {
      localStorage.setItem(BEST_KEY, String(best));
    } catch {
      /* privates Fenster */
    }
  }
  statusText.textContent = `Abgestürzt. ${score} Punkte. Rekord ${best}.`;
}

/* ---------- Bewegung (feste Schritte, damit es auf jedem Bildschirm gleich schnell läuft) ---------- */

function update(dt) {
  time += dt;
  shake = Math.max(0, shake - dt);
  const moving = state === "ready" || state === "play";
  if (moving && !reduceMotion) bgX += speed * 0.15 * dt; // Berge ziehen langsamer vorbei: Parallaxe
  if (moving) groundX += speed * dt;

  if (state === "ready") {
    bird.y = H * 0.42 + Math.sin(time * 3) * 8; // schwebt auf und ab
    bird.rot = 0;
    return;
  }
  if (state === "paused") return;

  // Schwerkraft (auch beim Absturz, bis der Spatz am Boden liegt)
  bird.vy = Math.min(PHYSICS.maxFall, bird.vy + PHYSICS.gravity * dt);
  bird.y += bird.vy * dt;
  bird.rot = Math.max(-0.45, Math.min(1.3, bird.vy / 560));
  const floor = H - GROUND - BIRD.radius;
  if (bird.y > floor) {
    bird.y = floor;
    bird.vy = 0;
    if (state === "play") crash();
  }
  if (bird.y < BIRD.radius) {
    bird.y = BIRD.radius; // an der Decke stossen, aber weiterfliegen
    bird.vy = 0;
  }
  if (state !== "play") return;

  // Säulen
  speed = Math.min(PILLAR.maxSpeed, PILLAR.speed + score * PILLAR.speedUp);
  pillars.forEach((p) => (p.x -= speed * dt));
  if (pillars.length && pillars[0].x < -PILLAR.width - 20) pillars.shift();
  const last = pillars[pillars.length - 1];
  if (last && last.x < W - PILLAR.spacing) addPillar(last.x + PILLAR.spacing);

  for (const p of pillars) {
    if (!p.scored && p.x + PILLAR.width < BIRD.x) {
      p.scored = true;
      score += 1;
      ding();
      if (score >= FLAPPY_GOAL) unlock("flappy10");
    }
    // Kreis (Spatz) gegen die beiden Rechtecke (Säulen)
    const top = p.gapY - PILLAR.gap / 2;
    const bottom = p.gapY + PILLAR.gap / 2;
    if (
      hits(p.x, -50, PILLAR.width, top + 50) ||
      hits(p.x, bottom, PILLAR.width, H - GROUND - bottom)
    ) {
      crash();
      return;
    }
  }
}

function hits(x, y, w, h) {
  const nx = Math.max(x, Math.min(BIRD.x, x + w));
  const ny = Math.max(y, Math.min(bird.y, y + h));
  return (BIRD.x - nx) ** 2 + (bird.y - ny) ** 2 < BIRD.radius ** 2;
}

/* ---------- Zeichnen ---------- */

const PINK = "#ff007b";
const DISPLAY = '"Bodoni Moda", Georgia, serif';
const BODY = '"Hanken Grotesk", system-ui, sans-serif';

function drawBackground() {
  if (!background) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#ffd1e6");
    g.addColorStop(1, "#ff5baa");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const x = -(bgX % background.width);
  ctx.drawImage(background, x, 0);
  ctx.drawImage(background, x + background.width, 0);
}

// Säule in MMP-Pink mit Glanz, damit sie metallisch wirkt
function drawPillar(x, y, h, capAtBottom) {
  if (h <= 0) return;
  const body = ctx.createLinearGradient(x, 0, x + PILLAR.width, 0);
  body.addColorStop(0, "#b8005a");
  body.addColorStop(0.35, "#ff4da6");
  body.addColorStop(0.55, PINK);
  body.addColorStop(1, "#a30050");
  ctx.fillStyle = body;
  ctx.fillRect(x, y, PILLAR.width, h);

  // Kopf der Säule, etwas breiter, an der Lücke
  const capH = 24;
  const capY = capAtBottom ? y + h - capH : y;
  const cap = ctx.createLinearGradient(x - 6, 0, x + PILLAR.width + 6, 0);
  cap.addColorStop(0, "#c4005e");
  cap.addColorStop(0.4, "#ff7cbf");
  cap.addColorStop(1, "#b0005a");
  ctx.fillStyle = cap;
  roundRect(x - 6, capY, PILLAR.width + 12, capH, 6);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)"; // Glanzlinie
  ctx.fillRect(x + 8, y, 4, h);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGround() {
  const y = H - GROUND;
  ctx.fillStyle = "#ff5baa";
  ctx.fillRect(0, y, W, GROUND);
  // schräge Streifen, die mitlaufen
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y + 6, W, GROUND);
  ctx.clip();
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  const offset = groundX % 32;
  for (let x = -offset - 32; x < W + 32; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, y + GROUND);
    ctx.lineTo(x + 16, y + GROUND);
    ctx.lineTo(x + 36, y);
    ctx.lineTo(x + 20, y);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, y, W, 4);
}

function drawBird() {
  const img = state === "over" ? birdCrash : birdFly;
  if (!img.complete || !img.naturalWidth) return;
  const w = BIRD.size;
  const h = (w * img.naturalHeight) / img.naturalWidth;
  ctx.save();
  ctx.translate(BIRD.x, bird.y);
  ctx.rotate(bird.rot);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function text(str, x, y, font, color, align = "center") {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function pill(label, y) {
  ctx.font = `600 15px ${BODY}`;
  const w = ctx.measureText(label).width + 36;
  ctx.fillStyle = "rgba(33, 33, 33, 0.72)";
  roundRect(W / 2 - w / 2, y - 19, w, 38, 19);
  ctx.fill();
  text(label, W / 2, y + 1, `600 15px ${BODY}`, "#ffffff");
}

function drawOverlay() {
  if (state === "play" || state === "over" || state === "paused") {
    ctx.save();
    ctx.shadowColor = "rgba(33, 33, 33, 0.35)";
    ctx.shadowBlur = 12;
    text(String(score), W / 2, 74, `500 64px ${DISPLAY}`, "#ffffff");
    ctx.restore();
  }
  if (state === "ready" && performance.now() - pageOpened >= START_DELAY) {
    pill("Tippen oder Leertaste zum Starten", H - GROUND - 70);
  }
  if (state === "paused") {
    pill("Pause. Tippen zum Weiterfliegen", H / 2);
  }
  if (state === "over") {
    // Karte mit Punkten und Rekord
    const cardW = 250;
    const cardH = 196;
    const x = W / 2 - cardW / 2;
    const y = H / 2 - cardH / 2 - 20;
    ctx.save();
    ctx.shadowColor = "rgba(33, 33, 33, 0.25)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#ffffff";
    roundRect(x, y, cardW, cardH, 18);
    ctx.fill();
    ctx.restore();
    text("Abgestürzt!", W / 2, y + 40, `500 30px ${DISPLAY}`, "#212121");
    text("Punkte", W / 2 - 58, y + 86, `600 13px ${BODY}`, "#5c5c5c");
    text("Rekord", W / 2 + 58, y + 86, `600 13px ${BODY}`, "#5c5c5c");
    text(String(score), W / 2 - 58, y + 122, `500 40px ${DISPLAY}`, PINK);
    text(String(best), W / 2 + 58, y + 122, `500 40px ${DISPLAY}`, "#212121");
    if (newBest)
      text("Neuer Rekord!", W / 2, y + 166, `600 14px ${BODY}`, "#dbab32");
    if (time - overAt > 0.6)
      pill("Nochmal: Tippen oder Leertaste", y + cardH + 44);
  }
}

function draw() {
  ctx.save();
  if (shake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * 10 * shake * 3,
      (Math.random() - 0.5) * 10 * shake * 3
    );
  }
  drawBackground();
  pillars.forEach((p) => {
    const top = p.gapY - PILLAR.gap / 2;
    const bottom = p.gapY + PILLAR.gap / 2;
    drawPillar(p.x, 0, top, true);
    drawPillar(p.x, bottom, H - GROUND - bottom, false);
  });
  drawGround();
  drawBird();
  drawOverlay();
  ctx.restore();
}

/* ---------- Schleife ---------- */

const STEP = 1 / 120;
let lastTime = performance.now();
let acc = 0;

function loop(now) {
  acc += Math.min(0.05, (now - lastTime) / 1000); // nach einer Pause nicht "nachholen"
  lastTime = now;
  while (acc >= STEP) {
    update(STEP);
    acc -= STEP;
  }
  draw();
  requestAnimationFrame(loop);
}

/* ---------- Grösse: Canvas scharf auf jedem Bildschirm ---------- */

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = stage.clientWidth;
  const height = (width * H) / W;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform((width * dpr) / W, 0, 0, (width * dpr) / W, 0, 0);
}
new ResizeObserver(resize).observe(stage);

/* ---------- Steuerung ---------- */

const dialogOpen = () => document.querySelector("dialog[open]");

window.addEventListener("keydown", (event) => {
  if (!["Space", "ArrowUp", "KeyW"].includes(event.code)) return;
  const onControl =
    event.target instanceof Element &&
    event.target.closest("a, button, input, textarea");
  if (dialogOpen() || onControl) return; // Leertaste auf Links und Knöpfen normal lassen
  event.preventDefault(); // Leertaste soll nicht die Seite scrollen
  if (!event.repeat) flap();
});
canvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  flap();
});

// Tab gewechselt: Spiel anhalten statt den Spatz abstürzen zu lassen
document.addEventListener("visibilitychange", () => {
  if (document.hidden && state === "play") state = "paused";
});

/* ---------- Start ---------- */

reset();
resize();
requestAnimationFrame(loop);
unlock("flappy"); // Achievement: das Spiel gefunden
