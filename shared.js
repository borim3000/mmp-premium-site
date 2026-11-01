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
  playAchievementSound();
  toast("Achievement gefunden", ACHIEVEMENTS[key].name, "achievement");
}

// Ton beim Finden
const achievementSound = new Audio("sound/achievement.mp3");
achievementSound.preload = "auto";
function playAchievementSound() {
  const sound = achievementSound.cloneNode(); // mehrere kurz nacheinander dürfen sich überlagern
  sound.volume = 0.7;
  sound.play().catch(() => {}); // Browser blockiert Ton ohne vorherigen Klick: dann eben still
}

/* Meldung unten links. type "achievement": mit goldenem Stern und Name gross.
   Verschwindet nach 4,5 Sekunden, der Balken unten zeigt die Zeit. */
const TOAST_TIME = 4500;
function toast(title, text, type = "info") {
  const box = document.createElement("div");
  box.className = `toast toast--${type}`;
  box.style.setProperty("--toast-time", `${TOAST_TIME}ms`);
  if (type === "achievement") {
    const icon = document.createElement("span");
    icon.className = "toast__icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.8.7-5.1 4.6 1.4 6.7L12 17.3l-6 3.4 1.4-6.7-5.1-4.6 6.8-.7z"/></svg>';
    box.append(icon);
  }
  const body = document.createElement("div");
  body.className = "toast__body";
  const label = document.createElement("small");
  label.className = "toast__label";
  label.textContent = title;
  const main = document.createElement("strong");
  main.className = "toast__text";
  main.textContent = text;
  const bar = document.createElement("span");
  bar.className = "toast__bar";
  bar.setAttribute("aria-hidden", "true");
  body.append(label, main);
  box.append(body, bar);
  document.querySelector("[data-toasts]").append(box);
  setTimeout(() => {
    box.classList.add("is-leaving"); // rausgleiten, dann entfernen
    setTimeout(() => box.remove(), 350);
  }, TOAST_TIME);
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

// Liste unten ausblenden, solange man noch weiterscrollen kann
const achievementList = achievementsDialog.querySelector(
  "[data-achievements-list]"
);
function updateListFade() {
  achievementList.classList.toggle(
    "has-more",
    achievementList.scrollTop + achievementList.clientHeight <
      achievementList.scrollHeight - 4
  );
}
achievementList.addEventListener("scroll", updateListFade, { passive: true });

document
  .querySelector("[data-achievements-open]")
  .addEventListener("click", () => {
    achievementsDialog.showModal();
    achievementList.scrollTop = 0;
    updateListFade();
  });
closeOnBackdrop(achievementsDialog);

// In einem anderen Tab freigeschaltet (win.html, flappy.html): hier gleich nachführen
window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;
  loadUnlocked().forEach((key) => unlocked.add(key));
  updateCounter();
});

updateCounter();
