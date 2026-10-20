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

/* ---------- Animationen ---------- */

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
  // Vogel springt beim ersten Scroll aus dem Bild
  gsap.to(".bird--hero", {
    y: -220,
    x: 120,
    rotation: 20,
    opacity: 0,
    ease: "power1.in",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "40% top",
      scrub: true,
    },
  });

  // 01 L.I.F.T: gepinnt, Scroll spult das Reel
  document.querySelectorAll("[data-scrub]").forEach((section) => {
    const pin = section.querySelector(".chapter__pin");
    const bar = section.querySelector("[data-scrub-progress]");
    const media = section.querySelector(".scrub .media");
    prepareVideos(section);
    ScrollTrigger.create({
      trigger: section,
      pin,
      start: "top top",
      end: "+=200%",
      scrub: true,
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
          end: "+=200%",
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
    prepareVideos(section);
    ScrollTrigger.create({
      trigger: section,
      pin,
      start: "top top",
      end: `+=${items.length * 100}%`,
      scrub: true,
      onUpdate: (self) => {
        const pos = self.progress * items.length;
        const index = Math.min(items.length - 1, Math.floor(pos));
        const local = Math.min(1, pos - index);
        items.forEach((el, i) => el.classList.toggle("is-active", i === index));
        medias.forEach((el, i) =>
          el.classList.toggle("is-active", i === index)
        );
        bar.style.width = `${local * 100}%`;
        scrubVideo(medias[index], local);
      },
    });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
} else {
  prepareVideos(document);
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

/* =========================================================
   Achievements (vorerst im Browser gespeichert)
   Später: in unlock() zusätzlich an PHP schicken (Accounts).
   ========================================================= */

const ACHIEVEMENTS = {
  faahhhh: "FAAHHHH",
  geheimfoto: "Geheimfoto",
  insidejoke: "Insider",
  ende: "Ganz unten",
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

/* ---------- Achievement: bis ganz unten gescrollt ---------- */

new IntersectionObserver((entries, observer) => {
  if (entries.some((e) => e.isIntersecting)) {
    unlock("ende");
    observer.disconnect();
  }
}).observe(document.querySelector(".site-footer"));

/* ---------- Labubuech (nur Oberfläche, Backend folgt) ---------- */

document.querySelector("[data-writer]").addEventListener("submit", (event) => {
  event.preventDefault();
  toast(
    "Noch nicht verbunden",
    "Das Labubuech speichert, sobald PHP und Datenbank angeschlossen sind."
  );
});
