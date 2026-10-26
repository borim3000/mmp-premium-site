/* =========================================================
   MMP Premium – Content Portfolio
   Scrollytelling mit GSAP ScrollTrigger + Easter Eggs
   ========================================================= */

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
const hasGsap =
  typeof window.gsap !== "undefined" &&
  typeof window.ScrollTrigger !== "undefined";
if (hasGsap) gsap.registerPlugin(ScrollTrigger);

/* ---------- Kopfzeile und Fortschritt ---------- */

const header = document.querySelector(".site-header");
const pageProgress = document.querySelector("[data-scroll-progress]");
const hero = document.querySelector(".hero");

function updateHeader() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  pageProgress.style.width = `${(window.scrollY / Math.max(1, max)) * 100}%`;
  header.classList.toggle("is-solid", window.scrollY > hero.offsetHeight - 80);
}
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

/* ---------- Video-Scrub-Hilfe ----------
   Steuert ein <video> über den Scroll-Fortschritt (0 bis 1).
   Ist (noch) kein Video da, läuft nur der Fortschrittsbalken. */

function scrubVideo(container, progress) {
  const video = container && container.querySelector("video");
  if (!video || !video.duration) return;
  video.currentTime = Math.min(
    video.duration - 0.05,
    progress * video.duration
  );
}

function prepareVideos(root) {
  root.querySelectorAll("video").forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.pause();
    if (reduceMotion) video.controls = true; // ohne Animation: normal abspielbar
  });
}

/* ---------- YouTube ----------
   <div class="media" data-youtube="VIDEO_ID" data-title="Titel"></div>
   Zeigt zuerst nur das Vorschaubild. Das Video (youtube-nocookie) lädt erst beim Klick. */

function isYouTubeId(id) {
  return /^[\w-]{11}$/.test(id || "");
}

function showYouTubePreview(media) {
  const id = media.dataset.youtube;
  if (!isYouTubeId(id)) return; // Platzhalter bleibt sichtbar, bis eine echte ID drinsteht
  const title = media.dataset.title || "Video";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "yt";
  button.style.backgroundImage = `url("https://i.ytimg.com/vi/${id}/hqdefault.jpg")`;
  button.setAttribute("aria-label", `${title} auf YouTube abspielen`);
  const play = document.createElement("span");
  play.className = "yt__play";
  const label = document.createElement("span");
  label.className = "yt__title";
  label.textContent = title;
  button.append(play, label);
  button.addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.title = title;
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    media.replaceChildren(iframe);
  });
  media.replaceChildren(button);
}

// Laufendes Video stoppen, indem wieder das Vorschaubild gezeigt wird
function stopYouTube(media) {
  if (media && media.querySelector("iframe")) showYouTubePreview(media);
}

document.querySelectorAll("[data-youtube]").forEach(showYouTubePreview);

// Video, das aus dem Bild gescrollt wird, stoppt von selbst
const ytObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) stopYouTube(entry.target);
  });
});
document
  .querySelectorAll("[data-youtube]")
  .forEach((media) => ytObserver.observe(media));

/* ---------- Animationen ---------- */

// ScrollTrigger in Seitenreihenfolge berechnen (wichtig, weil gepinnte Kapitel die Seite verlängern)
const sections = [...document.querySelectorAll("main > section")];
const order = (el) => -sections.indexOf(el.closest("main > section"));

if (hasGsap && !reduceMotion) {
  // Hero: Berge scrollen langsamer (Parallax), Untertitel blendet aus
  gsap.to("[data-hero-media]", {
    yPercent: 18,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
    },
  });
  gsap.to(".hero__subtitle, .hero__hint", {
    opacity: 0,
    y: -40,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "50% top",
      scrub: true,
    },
  });
  // Vogel: wechselt beim ersten Scroll zum fliegenden Bild und fliegt ein Stück nach oben rechts
  const heroBird = document.querySelector(".bird--hero");
  gsap
    .timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "60% top",
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    })
    .to(
      heroBird.querySelector(".bird__sit"),
      { opacity: 0, duration: 0.1 },
      0.04
    )
    .to(
      heroBird.querySelector(".bird__fly"),
      { opacity: 1, duration: 0.1 },
      0.04
    )
    .to(
      heroBird,
      {
        x: () => window.innerWidth * 0.1,
        y: () => -window.innerHeight * 0.22,
        rotation: -8,
        ease: "power1.out",
        duration: 1,
      },
      0
    );

  // 01 L.I.F.T: gepinnt, Scroll spult das Reel
  document.querySelectorAll("[data-scrub]").forEach((section) => {
    const pin = section.querySelector(".chapter__pin");
    const bar = section.querySelector("[data-scrub-progress]");
    const media = section.querySelector(".scrub .media");
    const length = Number(section.dataset.scrubLength) || 200; // in % der Bildschirmhöhe
    prepareVideos(section);
    ScrollTrigger.create({
      trigger: section,
      pin,
      start: "top top",
      end: `+=${length}%`,
      scrub: true,
      refreshPriority: order(section),
      onUpdate: (self) => {
        bar.style.width = `${self.progress * 100}%`;
        scrubVideo(media, self.progress);
      },
    });
    // Vogel schaut beim Spulen weiter hervor
    gsap.fromTo(
      section.querySelector(".bird--peek"),
      { x: -30 },
      {
        x: 20,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: `+=${length}%`,
          scrub: true,
        },
      }
    );
  });

  // 02/03 Galerien: auf grossen Bildschirmen gepinnt und seitwärts
  const mm = gsap.matchMedia();
  mm.add("(min-width: 900px)", () => {
    document.querySelectorAll("[data-gallery]").forEach((pin) => {
      const gallery = pin.querySelector(".gallery");
      const track = pin.querySelector(".gallery__track");
      const bar = pin.querySelector("[data-gallery-progress]");
      const count = pin.querySelector("[data-gallery-count]");
      const posts = track.children.length;
      const bird = pin.querySelector(".bird--fly");
      const distance = () =>
        Math.max(0, track.scrollWidth - gallery.clientWidth + 40);

      pin.classList.add("is-pinned");
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          pin: true,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 0.5,
          invalidateOnRefresh: true,
          refreshPriority: order(pin),
          onUpdate: (self) => {
            bar.style.width = `${self.progress * 100}%`;
            count.textContent = `${Math.min(
              posts,
              Math.floor(self.progress * posts) + 1
            )} / ${posts}`;
            if (bird)
              gsap.set(bird, {
                y: Math.sin(self.progress * Math.PI * 4) * 18,
                x: -self.progress * 60,
              });
          },
        },
      });
      return () => pin.classList.remove("is-pinned");
    });
  });

  // 04 Digezz: pro Projekt eine Bildschirmhöhe
  document.querySelectorAll("[data-projects]").forEach((section) => {
    const pin = section.querySelector(".chapter__pin");
    const items = [...section.querySelectorAll("[data-project]")];
    const medias = [...section.querySelectorAll("[data-project-media]")];
    const bar = section.querySelector("[data-scrub-progress]");
    let activeProject = 0;
    prepareVideos(section);
    const trigger = ScrollTrigger.create({
      trigger: section,
      pin,
      start: "top top",
      end: `+=${items.length * 100}%`,
      scrub: true,
      refreshPriority: order(section),
      onUpdate: (self) => {
        const pos = self.progress * items.length;
        const index = Math.min(items.length - 1, Math.floor(pos));
        const local = Math.min(1, pos - index);
        if (index !== activeProject) {
          stopYouTube(medias[activeProject]); // verstecktes Video nicht weiterlaufen lassen
          activeProject = index;
        }
        items.forEach((el, i) => el.classList.toggle("is-active", i === index));
        medias.forEach((el, i) =>
          el.classList.toggle("is-active", i === index)
        );
        bar.style.width = `${local * 100}%`;
        scrubVideo(medias[index], local);
      },
    });
    // Klick auf ein Projekt in der Liste scrollt zu diesem Projekt
    items.forEach((item, i) => {
      item.querySelector(".project__title").addEventListener("click", () => {
        const step = (trigger.end - trigger.start) / items.length;
        window.scrollTo({
          top: trigger.start + step * i + 2,
          behavior: "smooth",
        });
      });
    });
  });

  // 03 Awards: Text, Video und Fotos fliegen nacheinander ein, der Pokal dreht sich hinein
  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    gsap.from(group.querySelectorAll("[data-reveal]"), {
      y: 60,
      opacity: 0,
      duration: 0.8,
      ease: "power2.out",
      stagger: 0.12,
      scrollTrigger: {
        trigger: group,
        start: "top 80%",
        refreshPriority: order(group),
      },
    });
  });
  gsap.from(".award-badge svg", {
    rotation: -30,
    scale: 0.3,
    duration: 1,
    ease: "back.out(2.5)",
    scrollTrigger: {
      trigger: ".award-badge",
      start: "top 85%",
      refreshPriority: order(document.querySelector(".award-badge")),
    },
  });

  // Stay tuned: Der Satz fährt beim Scrollen von rechts nach links, die Emojis drehen sich
  const outro = document.querySelector("[data-outro]");
  const outroScroll = {
    trigger: ".outro",
    start: "top bottom",
    end: "bottom top",
    scrub: true,
    invalidateOnRefresh: true,
    refreshPriority: order(outro),
  };
  gsap.fromTo(
    outro,
    { x: () => window.innerWidth * 0.4 },
    {
      x: () => -(outro.scrollWidth - window.innerWidth * 0.6),
      ease: "none",
      scrollTrigger: outroScroll,
    }
  );
  gsap.to(".outro__emoji", {
    rotation: 360,
    ease: "none",
    stagger: 0.15,
    scrollTrigger: { ...outroScroll },
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
} else {
  prepareVideos(document);
  // Ohne Animation: Projekte per Klick wechseln
  document.querySelectorAll("[data-projects]").forEach((section) => {
    const items = [...section.querySelectorAll("[data-project]")];
    const medias = [...section.querySelectorAll("[data-project-media]")];
    items.forEach((item, i) => {
      item.querySelector(".project__title").addEventListener("click", () => {
        medias.forEach((m) => stopYouTube(m));
        items.forEach((el, j) => el.classList.toggle("is-active", j === i));
        medias.forEach((el, j) => el.classList.toggle("is-active", j === i));
      });
    });
  });
}

// Handy oder ohne Animation: Galerien werden gewischt, Balken und Zähler laufen mit
document.querySelectorAll("[data-gallery]").forEach((pin) => {
  const gallery = pin.querySelector(".gallery");
  const bar = pin.querySelector("[data-gallery-progress]");
  const count = pin.querySelector("[data-gallery-count]");
  const posts = pin.querySelector(".gallery__track").children.length;
  gallery.addEventListener(
    "scroll",
    () => {
      if (pin.classList.contains("is-pinned")) return; // Desktop: macht GSAP
      const p =
        gallery.scrollLeft /
        Math.max(1, gallery.scrollWidth - gallery.clientWidth);
      bar.style.width = `${p * 100}%`;
      count.textContent = `${Math.min(
        posts,
        Math.round(p * (posts - 1)) + 1
      )} / ${posts}`;
    },
    { passive: true }
  );
});

/* ---------- Video mit Ton ----------
   Beim Scrollen läuft das Video stumm. Der Knopf öffnet es in einem Fenster
   mit Ton und Steuerung, ab der Stelle, an der man gerade ist. */

const soundDialog = document.querySelector("[data-sound-dialog]");
const soundVideo = soundDialog.querySelector("video");

document.querySelectorAll("[data-sound-play]").forEach((button) => {
  button.addEventListener("click", () => {
    const source = button.closest("figure").querySelector("video");
    soundVideo.src = source.currentSrc || source.src;
    soundVideo.poster = source.poster;
    const start = source.currentTime || 0;
    // Fast am Ende? Dann von vorne beginnen
    soundVideo.currentTime = start > (source.duration || 0) - 2 ? 0 : start;
    soundDialog.showModal();
    soundVideo.play().catch(() => {});
  });
});

soundDialog.addEventListener("close", () => soundVideo.pause());
soundDialog.addEventListener("click", (event) => {
  if (event.target === soundDialog) soundDialog.close(); // Klick neben das Video schliesst
});

/* =========================================================
   Achievements (vorerst im Browser gespeichert)
   Später: in unlock() zusätzlich an PHP schicken (Accounts).
   ========================================================= */

const ACHIEVEMENTS = {
  faahhhh: "FAAHHHH",
  geheimfoto: "Geheimfoto",
  insidejoke: "Insider",
  ende: "Ganz unten",
  legacy: "Legacy",
  jackpot: "Jackpot", // wird in win.html freigeschaltet
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

function updateCounter() {
  document.querySelector("[data-achievement-count]").textContent = `${
    unlocked.size
  }/${Object.keys(ACHIEVEMENTS).length}`;
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
  toast("Achievement gefunden", ACHIEVEMENTS[key]);
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

updateCounter();

/* ---------- Easter Egg: Faahhhh-Button ---------- */

const faah = new Audio("sound/faahhhh.mp3"); // Dateiname an euren Sound anpassen
document.querySelector("[data-faah]").addEventListener("click", () => {
  faah.currentTime = 0;
  faah.play().catch(() => {});
  if (hasGsap && !reduceMotion) {
    gsap.fromTo(
      "main",
      { x: -6 },
      { x: 6, duration: 0.05, repeat: 9, yoyo: true, clearProps: "x" }
    );
  }
  unlock("faahhhh");
});

/* ---------- Easter Egg: 5x auf den Vogel = Geheimfoto ---------- */

const eggDialog = document.querySelector("[data-egg-dialog]");
document.querySelectorAll("[data-bird]").forEach((bird) => {
  let clicks = 0;
  let timer;
  bird.addEventListener("click", () => {
    clicks += 1;
    clearTimeout(timer);
    timer = setTimeout(() => {
      clicks = 0;
    }, 1500);
    if (hasGsap && !reduceMotion)
      gsap.fromTo(
        bird,
        { scale: 0.92 },
        { scale: 1, duration: 0.3, ease: "back.out(3)" }
      );
    if (clicks < 5) return;
    clicks = 0;
    eggDialog.querySelector("img").src = bird.dataset.egg;
    eggDialog.showModal();
    unlock("geheimfoto");
  });
});

/* ---------- Easter Egg: Inside Jokes ---------- */

document.querySelectorAll(".joke").forEach((joke) => {
  joke.addEventListener("click", () => {
    joke.classList.toggle("is-open");
    unlock("insidejoke");
  });
  joke.addEventListener("mouseenter", () => unlock("insidejoke"));
});

/* ---------- Easter Egg: 3x auf den Footer-Schriftzug = Legacy ---------- */

const legacyTrigger = document.querySelector("[data-legacy]");
let legacyClicks = 0;
let legacyTimer;
legacyTrigger.addEventListener("click", () => {
  legacyClicks += 1;
  clearTimeout(legacyTimer);
  legacyTimer = setTimeout(() => {
    legacyClicks = 0;
  }, 1200);
  if (legacyClicks < 3) return;
  legacyClicks = 0;
  unlock("legacy");
  // In einem neuen Tab öffnen (direkt im Klick, sonst blockt der Browser das Pop-up).
  // Ist das Pop-up trotzdem blockiert, im gleichen Tab weiter.
  const tab = window.open("legacy.html", "_blank");
  if (!tab) window.location.href = "legacy.html";
});

/* ---------- Achievement: bis ganz unten gescrollt ---------- */

new IntersectionObserver((entries, observer) => {
  if (entries.some((e) => e.isIntersecting)) {
    unlock("ende");
    observer.disconnect();
  }
}).observe(document.querySelector(".site-footer"));


/* =========================================================
   Labubuech
   Zugeklapptes Buch im Hero und am Ende. Das Lesezeichen öffnet es als Pop-up.
   Seiten: Vorwort, alle Einträge, zuletzt die leere Seite zum Schreiben.
   Pro Tag 2 Minuten, die Zeit läuft ab dem ersten Buchstaben.

   Einträge kommen aus der Datenbank über php/labubuech.php.
   Der Server prüft die Regeln (Länge, einmal pro Tag, 2 Minuten), der Browser zeigt nur an.
   Ohne PHP (z. B. GitHub Pages oder Live Server) zeigt das Buch "gerade nicht erreichbar".
   ========================================================= */

const BOOK_API = "php/labubuech.php";
const BOOK_SECONDS = 120;

const bookDialog = document.querySelector("[data-book-dialog]");
const bookPages = bookDialog.querySelector("[data-book-pages]");
const bookPrev = bookDialog.querySelector("[data-book-prev]");
const bookNext = bookDialog.querySelector("[data-book-next]");
const writeTemplate = document.querySelector("#book-write-page");
const twoPages = window.matchMedia("(min-width: 760px)"); // Doppelseite oder Einzelseite
const dateFormat = new Intl.DateTimeFormat("de-CH", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

let entries = []; // Einträge aus der Datenbank
let bookState = "open"; // "open" = schreiben möglich, "written" / "expired" = für heute zu, "offline" = Server nicht erreichbar
let deadline = null; // Zeitpunkt (ms), an dem die zwei Minuten vorbei sind; null = noch nicht angefangen
let pages = []; // alle Seiten als Elemente
let view = 0; // erste sichtbare Seite
let bookTimer = null;
let starting = false;
let saving = false;

// Anfrage an php/labubuech.php. Wirft einen Fehler mit status, wenn der Server ablehnt.
async function bookApi(method, data) {
  const response = await fetch(BOOK_API, {
    method,
    body: data ? new URLSearchParams(data) : undefined,
    headers: { Accept: "application/json" },
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(json.error || "Das hat nicht geklappt.");
    error.status = response.status;
    throw error;
  }
  return json;
}

async function loadBook() {
  try {
    const data = await bookApi("GET");
    // Ohne PHP liefert der Server die Datei als Text statt JSON
    if (!Array.isArray(data.entries)) throw new Error("Keine Antwort von PHP");
    entries = data.entries;
    deadline = data.left === null ? null : Date.now() + data.left * 1000;
    if (data.wroteToday) bookState = "written";
    else if (data.left !== null && data.left <= 0) bookState = "expired";
    else bookState = "open";
  } catch {
    entries = [];
    bookState = "offline";
  }
}

const timeLeft = () =>
  deadline ? Math.max(0, (deadline - Date.now()) / 1000) : BOOK_SECONDS;

function makePage(type) {
  const page = document.createElement("article");
  page.className = `book-page book-page--${type}`;
  return page;
}

function notePage(title, text) {
  const page = makePage("write");
  const h3 = document.createElement("h3");
  h3.textContent = title;
  const p = document.createElement("p");
  p.textContent = text;
  page.append(h3, p);
  return page;
}

function buildWritePage() {
  if (bookState === "offline")
    return notePage(
      "Gerade nicht erreichbar",
      "Das Labubuech ist im Moment nicht erreichbar. Versuch es später nochmal."
    );
  if (bookState === "written")
    return notePage(
      "Für heute zu",
      "Du hast heute schon ins Labubuech geschrieben. Morgen hast du wieder zwei Minuten."
    );
  if (bookState === "expired")
    return notePage(
      "Für heute zu",
      "Deine zwei Minuten für heute sind vorbei. Morgen kannst du wieder ins Labubuech schreiben."
    );

  const page = makePage("write");
  page.append(writeTemplate.content.cloneNode(true));
  const form = page.querySelector("[data-book-form]");
  form.elements.message.addEventListener("input", startTimer);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.elements.message.value.trim()) {
      form.elements.message.focus();
      return;
    }
    finishEntry(false);
  });
  return page;
}

function buildPages() {
  // Angefangenen Text behalten, falls das Buch neu aufgebaut wird
  const oldForm = bookPages.querySelector("[data-book-form]");
  const draft = oldForm && {
    name: oldForm.elements.name.value,
    message: oldForm.elements.message.value,
  };

  const list = [];
  const intro = makePage("intro");
  intro.innerHTML = `
    <h3>Labubuech</h3>
    <p>Unser Gästebuch. Pro Tag hast du zwei Minuten, um etwas hineinzuschreiben.</p>
    <p>Mit den Pfeilen unten blätterst du durch die Einträge. Ganz hinten wartet deine Seite.</p>
    <img src="img/vogel.png" alt="" width="90" height="110" />`;
  list.push(intro);

  entries.forEach((entry) => {
    const page = makePage("entry");
    const name = document.createElement("h3");
    name.textContent = entry.name;
    const time = document.createElement("time");
    time.dateTime = entry.date;
    time.textContent = dateFormat.format(new Date(entry.date));
    const text = document.createElement("p");
    text.textContent = entry.text; // als Text, nie als HTML
    page.append(name, time, text);
    list.push(page);
  });

  // Bei der Doppelseite soll die Schreibseite rechts liegen, sonst eine leere Seite einschieben
  if (twoPages.matches && list.length % 2 === 0) {
    const blank = makePage("blank");
    blank.innerHTML = `<img src="img/vogel.png" alt="" width="90" height="110" />`;
    list.push(blank);
  }
  list.push(buildWritePage());

  const numbered = list.filter(
    (p) => !p.classList.contains("book-page--blank")
  );
  numbered.forEach((page, i) => {
    const num = document.createElement("p");
    num.className = "book-page__num";
    num.textContent = `Seite ${i + 1} von ${numbered.length}`;
    page.prepend(num);
  });

  pages = list;
  bookPages.replaceChildren(...pages);

  const form = bookPages.querySelector("[data-book-form]");
  if (form && draft) {
    form.elements.name.value = draft.name;
    form.elements.message.value = draft.message;
  }
  showTime();
}

const perView = () => (twoPages.matches ? 2 : 1);
const lastView = () => Math.max(0, pages.length - perView());

function showView(index, direction = 0) {
  view = Math.max(0, Math.min(index, lastView()));
  pages.forEach((page, i) => {
    page.hidden = i < view || i >= view + perView();
    page.classList.remove("is-turning-next", "is-turning-prev");
  });
  if (direction && !reduceMotion) {
    // Die neu aufgedeckte Seite klappt um, wie beim Umblättern
    const page = pages[direction > 0 ? view : view + perView() - 1];
    void page.offsetWidth;
    page.classList.add(direction > 0 ? "is-turning-next" : "is-turning-prev");
  }
  bookPrev.disabled = view === 0;
  bookNext.disabled = view >= lastView();
}

function showTime() {
  const form = bookPages.querySelector("[data-book-form]");
  if (!form) return;
  const left = Math.ceil(timeLeft());
  form.querySelector("[data-book-time]").textContent = `${String(
    Math.floor(left / 60)
  ).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  form.querySelector("[data-book-progress]").style.width = `${
    (timeLeft() / BOOK_SECONDS) * 100
  }%`;
}

// Erster Buchstabe: der Server startet die zwei Minuten und meldet die Restzeit
async function startTimer() {
  if (deadline) return startTicking();
  if (starting || bookState !== "open") return;
  starting = true;
  try {
    const data = await bookApi("POST", { action: "start" });
    deadline = Date.now() + data.left * 1000;
    startTicking();
  } catch (error) {
    handleBookError(error);
  } finally {
    starting = false;
  }
}

function startTicking() {
  if (bookTimer) return;
  bookTimer = setInterval(() => {
    showTime();
    if (timeLeft() <= 0) finishEntry(true);
  }, 250);
}

function stopTimer() {
  clearInterval(bookTimer);
  bookTimer = null;
}

// Server lehnt ab: heute schon geschrieben (429) oder Zeit vorbei (403) -> Buch zu.
// Sonst (z. B. kein Internet) bleibt der Text stehen, damit nichts verloren geht.
function handleBookError(error) {
  toast("Labubuech", error.message);
  if (error.status === 429 || error.status === 403) {
    stopTimer();
    bookState = error.status === 429 ? "written" : "expired";
    buildPages();
    showView(lastView());
  }
}

// Eintrag speichern (Knopf oder Zeit abgelaufen), danach ist das Buch für heute zu
async function finishEntry(timeUp) {
  if (saving) return;
  saving = true;
  stopTimer();
  const form = bookPages.querySelector("[data-book-form]");
  const message = form ? form.elements.message.value.trim() : "";
  if (form) form.querySelector("button[type=submit]").disabled = true;

  try {
    if (message) {
      const data = await bookApi("POST", {
        action: "save",
        name: form.elements.name.value.trim(),
        text: message,
      });
      entries.push(data.entry);
      toast(
        timeUp ? "Zeit um" : "Eingetragen",
        timeUp
          ? "Was du geschrieben hast, steht trotzdem im Labubuech."
          : "Danke! Dein Eintrag steht jetzt im Labubuech."
      );
    } else {
      toast(
        "Zeit um",
        "Das Labubuech ist für heute zu. Morgen hast du wieder zwei Minuten."
      );
    }
    bookState = message ? "written" : "expired";
    if (form) form.reset();
    buildPages();
    // Doppelseite mit dem neusten Eintrag zeigen (Seite 0 ist das Vorwort)
    const newest = entries.length;
    showView(newest - (newest % perView()));
  } catch (error) {
    if (form) form.querySelector("button[type=submit]").disabled = false;
    handleBookError(error);
  } finally {
    saving = false;
  }
}

async function openBook() {
  await loadBook();
  buildPages();
  showView(lastView()); // aufschlagen bei der Seite zum Schreiben
  if (!bookDialog.open) bookDialog.showModal();
  if (bookState === "open" && deadline) startTicking(); // Zeit läuft schon seit vorhin
}

document
  .querySelectorAll("[data-book-open]")
  .forEach((button) => button.addEventListener("click", openBook));

// Klick auf den Buchdeckel: das Lesezeichen wackelt als Hinweis
document.querySelectorAll("[data-book]").forEach((book) => {
  const ribbon = book.querySelector(".book__ribbon");
  book.querySelector(".book__cover").addEventListener("click", () => {
    ribbon.classList.remove("is-wiggling");
    void ribbon.offsetWidth;
    ribbon.classList.add("is-wiggling");
  });
  ribbon.addEventListener("animationend", () =>
    ribbon.classList.remove("is-wiggling")
  );
});

bookPrev.addEventListener("click", () => showView(view - perView(), -1));
bookNext.addEventListener("click", () => showView(view + perView(), 1));
bookDialog.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea")) return;
  if (event.key === "ArrowLeft") showView(view - perView(), -1);
  if (event.key === "ArrowRight") showView(view + perView(), 1);
});
// Anzeige stoppen beim Schliessen. Die zwei Minuten laufen auf dem Server weiter.
bookDialog.addEventListener("close", stopTimer);
bookDialog.addEventListener("click", (event) => {
  if (event.target === bookDialog) bookDialog.close();
});
twoPages.addEventListener("change", () => {
  if (!bookDialog.open) return;
  buildPages();
  showView(lastView());
});
