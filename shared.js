/* =========================================================
   MMP Premium – Gemeinsam für alle Seiten (index.html und flappy.html)
   Achievements mit Zähler und Übersicht, Meldungen, kleine Hilfen.
   Wird vor dem seiteneigenen Skript geladen (script.js oder flappy.js).
   ========================================================= */

// Fortschrittsbalken über transform statt width: der Browser muss dafür nichts neu anordnen
function setBar(el, progress) {
  if (el) el.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
}

// Klick neben ein Pop-up schliesst es. Geprüft wird die Klickposition: Ein Klick auf den
// Innenrand des Pop-ups trifft technisch auch das Pop-up selbst und soll es nicht schliessen.
function closeOnBackdrop(dialog) {
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= r.left &&
      event.clientX <= r.right &&
      event.clientY >= r.top &&
      event.clientY <= r.bottom;
    if (!inside) dialog.close();
  });
}

/* ---------- Achievements (vorerst im Browser gespeichert) ----------
   Später: in unlock() zusätzlich an PHP schicken (Accounts). */

// name: Titel, done: steht da, wenn gefunden, hint: Tipp, solange noch nicht gefunden
const ACHIEVEMENTS = {
  faahhhh: {
    name: "FAAHHHH",
    done: "Den Knopf gedrückt, den man nicht drücken soll.",
    hint: "Manche Knöpfe sollte man besser nicht drücken.",
  },
  geheimfoto: {
    name: "Geheimfoto",
    done: "Den Vogel so lange genervt, bis er etwas zeigt.",
    hint: "Der goldene Vogel mag Aufmerksamkeit.",
  },
  insidejoke: {
    name: "Insider",
    done: "Einen Inside Joke entdeckt.",
    hint: "Nicht jedes unterstrichene Wort ist harmlos.",
  },
  ende: {
    name: "Ganz unten",
    done: "Bis ans Ende gescrollt.",
    hint: "Durchhalten lohnt sich.",
  },
  legacy: {
    name: "Legacy",
    done: "Das alte Gewinnspiel gefunden.",
    hint: "Unser Name hat eine Vergangenheit.",
  },
  jackpot: {
    name: "Jackpot",
    done: "Mit einem Prozent Chance gewonnen.",
    hint: "Dafür braucht es Glück. Viel Glück.",
  }, // wird in win.html freigeschaltet
  flappy: {
    name: "Flappy Spatz",
    done: "Den pinken Spatz gefunden und abgehoben.",
    hint: "Nicht jeder Spatz ist aus Gold.",
  }, // wird in flappy.html freigeschaltet
  flappy10: {
    name: "Vielflieger",
    done: "10 Punkte in Flappy Spatz geschafft.",
    hint: "Übung macht den Meisterflieger.",
  }, // wird in flappy.js freigeschaltet (FLAPPY_GOAL)
};
const STORAGE_KEY = "mmp_achievements";

function loadUnlocked() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
  } catch {
    return new Set();
  }
}
const unlocked = loadUnlocked();
const achievementsTotal = Object.keys(ACHIEVEMENTS).length;

function updateCounter() {
  document.querySelector(
    "[data-achievement-count]"
  ).textContent = `${unlocked.size}/${achievementsTotal}`;
  renderAchievements();
}

function unlock(key) {
  if (!ACHIEVEMENTS[key] || unlocked.has(key)) return;
  unlocked.add(key);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...unlocked]));
  } catch {
    /* privates Fenster */
  }
  updateCounter();
  toast("Achievement gefunden", ACHIEVEMENTS[key].name);
}

function toast(title, text) {
  const box = document.createElement("div");
  box.className = "toast";
  const strong = document.createElement("strong");
  strong.textContent = title;
  const span = document.createElement("span");
  span.textContent = text;
  box.append(strong, span);
  document.querySelector("[data-toasts]").append(box);
  setTimeout(() => box.remove(), 4500);
}

/* ---------- Achievements-Übersicht (Pop-up) ---------- */

const achievementsDialog = document.querySelector("[data-achievements-dialog]");

function renderAchievements() {
  const list = achievementsDialog.querySelector("[data-achievements-list]");
  const items = Object.entries(ACHIEVEMENTS).map(([key, a]) => {
    const found = unlocked.has(key);
    const li = document.createElement("li");
    li.className = `achievement${found ? " is-found" : ""}`;
    const icon = document.createElement("span");
    icon.className = "achievement__icon";
    icon.setAttribute("aria-hidden", "true");
    const title = document.createElement("strong");
    title.textContent = found ? a.name : "???";
    const status = document.createElement("span");
    status.className = "visually-hidden";
    status.textContent = found ? "gefunden" : "noch nicht gefunden";
    const text = document.createElement("span");
    text.className = "achievement__text";
    text.textContent = found ? a.done : `Tipp: ${a.hint}`;
    title.append(" ", status);
    li.append(icon, title, text);
    return li;
  });
  list.replaceChildren(...items);
  achievementsDialog.querySelector("[data-achievements-summary]").textContent =
    unlocked.size === achievementsTotal
      ? "Alle gefunden. Respekt!"
      : `${unlocked.size} von ${achievementsTotal} gefunden`;
  setBar(
    achievementsDialog.querySelector("[data-achievements-progress]"),
    unlocked.size / achievementsTotal
  );
  // "Nochmal neu suchen" nur zeigen, wenn alle gefunden sind
  resetBox.hidden = unlocked.size < achievementsTotal;
  showResetStep(false);
}

/* ---------- Alle gefunden: nochmal neu suchen ---------- */

const resetBox = achievementsDialog.querySelector("[data-achievements-reset]");
const resetStart = resetBox.querySelector("[data-reset-start]");
const resetConfirmBox = resetBox.querySelector("[data-reset-confirm-box]");

// false: nur der Link, true: Frage "Wirklich?" mit Ja/Abbrechen
function showResetStep(confirming) {
  resetStart.hidden = confirming;
  resetConfirmBox.hidden = !confirming;
}

resetStart.addEventListener("click", () => {
  showResetStep(true);
  resetBox.querySelector("[data-reset-confirm]").focus();
});
resetBox.querySelector("[data-reset-cancel]").addEventListener("click", () => {
  showResetStep(false);
  resetStart.focus();
});
resetBox.querySelector("[data-reset-confirm]").addEventListener("click", () => {
  unlocked.clear();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* privates Fenster */
  }
  // Seiten können darauf reagieren (index.html: "Ganz unten" neu scharf machen)
  window.dispatchEvent(new Event("achievements-reset"));
  updateCounter(); // Zähler auf 0 und Liste neu
  toast("Zurückgesetzt", "Viel Spass beim Suchen!");
});

document
  .querySelector("[data-achievements-open]")
  .addEventListener("click", () => achievementsDialog.showModal());
closeOnBackdrop(achievementsDialog);

// In einem anderen Tab freigeschaltet (win.html, flappy.html): hier gleich nachführen
window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;
  loadUnlocked().forEach((key) => unlocked.add(key));
  updateCounter();
});

updateCounter();
