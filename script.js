/* =========================================================
   MMP Premium – Content Portfolio
   Scrollytelling mit GSAP ScrollTrigger + Easter Eggs
   Achievements, Meldungen und Hilfen (setBar, closeOnBackdrop, toast) stehen in shared.js
   ========================================================= */

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
const hasGsap =
  typeof window.gsap !== "undefined" &&
  typeof window.ScrollTrigger !== "undefined";
if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger);
  // Handy: Ein- und Ausblenden der Adressleiste soll nicht alles neu berechnen (ruckelt sonst)
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/* ---------- Kopfzeile und Fortschritt ----------
   Grössen werden nur bei Änderungen gemessen, nicht bei jedem Scroll-Schritt,
   und gezeichnet wird höchstens einmal pro Bild (requestAnimationFrame). */

const header = document.querySelector(".site-header");
const pageProgress = document.querySelector("[data-scroll-progress]");
const hero = document.querySelector(".hero");
let scrollMax = 1;
let solidFrom = 0;
let headerTicking = false;

function measureHeader() {
  scrollMax = Math.max(
    1,
    document.documentElement.scrollHeight - window.innerHeight
  );
  solidFrom = hero.offsetHeight - 80;
}

function updateHeader() {
  headerTicking = false;
  setBar(pageProgress, window.scrollY / scrollMax);
  header.classList.toggle("is-solid", window.scrollY > solidFrom);
}

window.addEventListener(
  "scroll",
  () => {
    if (headerTicking) return;
    headerTicking = true;
    requestAnimationFrame(updateHeader);
  },
  { passive: true }
);
window.addEventListener("resize", () => {
  measureHeader();
  updateHeader();
});
measureHeader();
updateHeader();

// Links innerhalb der Seite weich scrollen (statt CSS scroll-behavior, das stört ScrollTrigger)
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    if (link.classList.contains("skip-link"))
      target.focus({ preventScroll: true });
  });
});

/* ---------- Video-Player (L.I.F.T) ----------
   <div class="player" data-player> mit <video>, Play-Knöpfen, Zeitleiste, Ton und Vollbild.
   Läuft nur, wenn man es startet, und hält an, sobald es aus dem Bild gescrollt wird. */

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

document.querySelectorAll("[data-player]").forEach((player) => {
  const video = player.querySelector("video");
  const toggles = player.querySelectorAll("[data-player-toggle]");
  const seek = player.querySelector("[data-player-seek]");
  const time = player.querySelector("[data-player-time]");
  const mute = player.querySelector("[data-player-mute]");
  const full = player.querySelector("[data-player-full]");

  const showTime = () => {
    const ratio = video.duration ? video.currentTime / video.duration : 0;
    seek.value = Math.round(ratio * 1000);
    seek.style.setProperty("--p", `${ratio * 100}%`);
    time.textContent = `${formatTime(video.currentTime)} / ${formatTime(
      video.duration
    )}`;
  };
  const showState = () => {
    const playing = !video.paused && !video.ended;
    player.classList.toggle("is-playing", playing);
    toggles.forEach((button) =>
      button.setAttribute("aria-label", playing ? "Pause" : "Abspielen")
    );
  };
  const showSound = () => {
    player.classList.toggle("is-muted", video.muted);
    mute.setAttribute("aria-label", video.muted ? "Ton an" : "Ton aus");
  };

  toggles.forEach((button) =>
    button.addEventListener("click", () => {
      if (video.paused || video.ended) video.play().catch(() => {});
      else video.pause();
    })
  );
  seek.addEventListener("input", () => {
    if (!video.duration) return;
    video.currentTime = (seek.value / 1000) * video.duration;
    showTime();
  });
  mute.addEventListener("click", () => {
    video.muted = !video.muted;
  });
  full.addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (player.requestFullscreen) player.requestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iPhone
  });

  video.addEventListener("loadedmetadata", showTime);
  video.addEventListener("timeupdate", showTime);
  video.addEventListener("play", showState);
  video.addEventListener("pause", showState);
  video.addEventListener("ended", showState);
  video.addEventListener("volumechange", showSound);
  showTime();
  showState();
  showSound();

  // Aus dem Bild gescrollt: anhalten
  new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting && !document.fullscreenElement) video.pause();
    });
  }).observe(player);
});

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
  button.style.backgroundImage = `url("https://i.ytimg.com/vi/${id}/maxresdefault.jpg")`;
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

/* ---------- Vorhang vor Featured ----------
   Zwei pinke Vorhänge, oben festgemacht. Beim Scrollen geht zuerst unten in der Mitte
   ein Spalt auf, der nach oben wächst. Die Öffnung sieht aus wie ein Pizzastück mit
   geschwungenen Seiten, wie bei gerafften Theatervorhängen. Am Schluss sind beide ganz weg.
   p = 0 (zu) bis 1 (offen). Koordinaten in Prozent der Fläche (0 bis 100). */

const curtain = document.querySelector("[data-curtain]");

// Wann und wie lange der Vorhang aufgeht, in Bildschirmhöhen:
const CURTAIN = {
  early: 0.9, // so weit vor dem Anhalten der Sektion beginnt er aufzugehen (0 = erst wenn sie oben ankommt)
  length: 0.9, // Scrollweg vom ersten Spalt bis ganz offen
};

function drawCurtain(p) {
  if (!curtain) return;
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const smooth = (t) => t * t * (3 - 2 * t); // weich anfahren und abbremsen
  const bottom = smooth(clamp(p / 0.75)); // unten geht zuerst auf ...
  const top = smooth(clamp((p - 0.3) / 0.7)); // ... oben folgt später
  const xb = 50.5 - 54 * bottom; // innere untere Ecke
  const xt = 50.5 - 54 * top; // innere Kante oben
  const yb = 100 - 16 * bottom; // untere Ecke hebt sich beim Raffen
  // linke Bahn; die rechte ist gespiegelt
  const panel = (x) =>
    `M${x(-1)} -1 L${x(xt)} -1 ` +
    `C${x(xt)} ${yb * 0.45} ${x(xb + (xt - xb) * 0.35)} ${yb * 0.85} ${x(
      xb
    )} ${yb} ` +
    `Q${x(xb * 0.4)} ${(yb + 100) / 2 + 4} ${x(-1)} 101 Z`;
  const [left, right] = curtain.querySelectorAll("path");
  left.setAttribute(
    "d",
    panel((x) => x)
  );
  right.setAttribute(
    "d",
    panel((x) => 100 - x)
  );
}

/* ---------- Instagram ----------
   <div class="media" data-instagram="ID" data-instagram-type="reel" data-poster="bild.jpg" data-title="Titel"></div>
   Der Beitrag (Reel, Video oder Carousel) lädt unsichtbar im Hintergrund, sobald die Seite
   geladen ist. Bis er bereit ist, steht das eigene Vorschaubild da, dann wird überblendet.
   So ist er schon fertig, wenn man hinscrollt. Blockiert der Browser Instagram
   (z. B. Werbeblocker), bleibt das Vorschaubild und ein Klick öffnet den Beitrag auf Instagram.
   Funktioniert nur mit öffentlichen Beiträgen. */

function isInstagramId(id) {
  return /^[\w-]{6,40}$/.test(id || "") && id !== "POST_ID";
}

function instagramLink(media) {
  const type = media.dataset.instagramType === "reel" ? "reel" : "p";
  return `https://www.instagram.com/${type}/${media.dataset.instagram}/`;
}

// Vorschaubild: führt zu Instagram, solange der eingebettete Beitrag nicht da ist
function showInstagramPreview(media) {
  if (!isInstagramId(media.dataset.instagram)) return; // Platzhalter bleibt, bis eine echte ID drinsteht
  const title = media.dataset.title || "Beitrag";
  const link = document.createElement("a");
  link.className = "yt ig";
  link.href = instagramLink(media);
  link.target = "_blank";
  link.rel = "noopener";
  if (media.dataset.poster)
    link.style.backgroundImage = `url("${media.dataset.poster}")`;
  link.setAttribute("aria-label", `${title} auf Instagram ansehen`);
  const badge = document.createElement("span");
  badge.className = "ig__badge";
  badge.textContent = "Instagram";
  const play = document.createElement("span");
  play.className = "yt__play";
  const label = document.createElement("span");
  label.className = "yt__title";
  label.textContent = title;
  link.append(badge, play, label);
  media.replaceChildren(link);
}

// Beitrag unsichtbar laden; Instagrams embed.js macht aus dem blockquote ein iframe
function embedInstagram(media) {
  const holder = document.createElement("div");
  holder.className = "ig-embed";
  const quote = document.createElement("blockquote");
  quote.className = "instagram-media";
  quote.setAttribute("data-instgrm-permalink", instagramLink(media));
  quote.setAttribute("data-instgrm-version", "14");
  quote.setAttribute("data-instgrm-captioned", ""); // mit Bildunterschrift
  holder.append(quote);
  media.append(holder);

  // Bereit, wenn das iframe da ist und seine Höhe nicht mehr ändert
  let settle;
  const watch = new ResizeObserver(() => {
    if (!holder.querySelector("iframe") || holder.offsetHeight < 300) return;
    clearTimeout(settle);
    settle = setTimeout(() => {
      watch.disconnect();
      clearTimeout(giveUp);
      media.classList.add("is-embed"); // überblenden, Vorschaubild weg
    }, 400);
  });
  watch.observe(holder);
  // Kommt nach 15 Sekunden nichts (blockiert oder offline), Vorschaubild behalten
  const giveUp = setTimeout(() => {
    watch.disconnect();
    holder.remove();
  }, 15000);
}

function startInstagramEmbeds() {
  const medias = [...document.querySelectorAll("[data-instagram]")].filter(
    (media) => isInstagramId(media.dataset.instagram)
  );
  if (!medias.length) return;
  medias.forEach(embedInstagram);
  if (window.instgrm) {
    window.instgrm.Embeds.process();
  } else {
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    document.body.append(script);
  }
}

document.querySelectorAll("[data-instagram]").forEach(showInstagramPreview);
// Erst nach dem Laden der Seite, damit der Seitenaufbau nicht warten muss
if (document.readyState === "complete") setTimeout(startInstagramEmbeds, 300);
else
  window.addEventListener("load", () => setTimeout(startInstagramEmbeds, 300));

// Der geladene Beitrag ist höher als das Vorschaubild. Damit die gepinnten Kapitel
// danach noch an der richtigen Stelle anhalten, die Haltepunkte neu berechnen.
if (hasGsap && "ResizeObserver" in window) {
  let refreshTimer;
  const embedResize = new ResizeObserver(() => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 250);
  });
  document
    .querySelectorAll("[data-instagram]")
    .forEach((media) => embedResize.observe(media));
}

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
  // Untertitel gleitet beim Ausblenden leicht nach unten, weg vom Titel (nicht in ihn hinein)
  gsap.to(".hero__subtitle, .hero__hint", {
    opacity: 0,
    y: 10,
    ease: "none",
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "70% top",
      scrub: true,
    },
  });
  // Hero: Maus-Parallaxe. Titel und Untertitel folgen der Maus verschieden stark, das Bergbild
  // weicht in die Gegenrichtung aus. So wirkt der Titel, als schwebe er vor den Bergen.
  // Nur Verschieben, kein Kippen: Die Schrift bleibt immer gleich gross.
  // Nur mit Maus (nicht auf dem Handy). Stärke über MOUSE_PARALLAX einstellen.
  const MOUSE_PARALLAX = {
    title: 36, // Verschiebung des Titels in px
    subtitle: 9, // "Content Portfolio" in px seitlich (in der Höhe wie der Titel, damit der Abstand bleibt)
    background: 11, // Bergbild in px, gegenläufig
  };
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const heroTitle = document.querySelector(".hero__title");
    const heroMedia = document.querySelector("[data-hero-media]");
    const heroSubtitle = document.querySelector(".hero__subtitle");
    gsap.set(heroMedia, { scale: 1.06 }); // etwas grösser, damit beim Verschieben kein Rand sichtbar wird
    const follow = (el, prop) =>
      gsap.quickTo(el, prop, { duration: 0.9, ease: "power3.out" });
    const move = {
      titleX: follow(heroTitle, "x"),
      titleY: follow(heroTitle, "y"),
      subtitleX: follow(heroSubtitle, "x"),
      subtitleY: follow(heroSubtitle, "yPercent"), // y braucht schon das Ausblenden beim Scrollen
      mediaX: follow(heroMedia, "x"),
      mediaY: follow(heroMedia, "y"),
    };
    const parallax = (nx, ny) => {
      // nx, ny: Mausposition von -0.5 (links/oben) bis 0.5 (rechts/unten)
      move.titleX(nx * MOUSE_PARALLAX.title);
      move.titleY(ny * MOUSE_PARALLAX.title * 0.6);
      move.subtitleX(nx * MOUSE_PARALLAX.subtitle);
      move.subtitleY(
        ((ny * MOUSE_PARALLAX.title * 0.6) / heroSubtitle.offsetHeight) * 100
      );
      move.mediaX(-nx * MOUSE_PARALLAX.background);
      move.mediaY(-ny * MOUSE_PARALLAX.background * 0.6);
    };
    hero.addEventListener("pointermove", (event) =>
      parallax(
        event.clientX / window.innerWidth - 0.5,
        event.clientY / window.innerHeight - 0.5
      )
    );
    hero.addEventListener("pointerleave", () => parallax(0, 0)); // sanft zurück in die Mitte
  }

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

  // 02/03 Galerien: auf grossen Bildschirmen gepinnt und seitwärts
  const mm = gsap.matchMedia();
  mm.add("(min-width: 900px)", () => {
    document.querySelectorAll("[data-gallery]").forEach((pin) => {
      const gallery = pin.querySelector(".gallery");
      const track = pin.querySelector(".gallery__track");
      const bar = pin.querySelector("[data-gallery-progress]");
      const count = pin.querySelector("[data-gallery-count]");
      const posts = track.querySelectorAll(".post:not(.post--text)").length; // Textkarten zählen nicht
      const bird = pin.querySelector(".bird--fly");
      // So weit fahren, bis die letzte Karte ganz drin ist und rechts mit dem Rand der Seite abschliesst
      const distance = () => {
        const style = getComputedStyle(gallery);
        const inner =
          gallery.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight);
        return Math.max(0, track.scrollWidth - inner);
      };
      // Am Schluss stehen bleiben, damit man die letzte Karte in Ruhe anschauen kann
      const HOLD = 0.4; // in Bildschirmhöhen
      const holdLength = () => HOLD * window.innerHeight;
      // Mit Vorhang (Featured): die Galerie wartet, bis der Vorhang ganz offen ist
      const withCurtain = curtain && pin.contains(curtain);
      const curtainLength = () =>
        withCurtain
          ? Math.max(0, CURTAIN.length - CURTAIN.early) * window.innerHeight
          : 0; // Teil des Vorhangs, der erst nach dem Anhalten aufgeht
      const totalLength = () => curtainLength() + distance() + holdLength();
      const curtainShare = curtainLength() / Math.max(1, totalLength());
      const moveShare = distance() / Math.max(1, totalLength());

      pin.classList.add("is-pinned");
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          pin: true,
          anticipatePin: 1,
          start: "top top",
          end: () => `+=${totalLength()}`,
          scrub: 0.5,
          invalidateOnRefresh: true,
          refreshPriority: order(pin),
          onUpdate: (self) => {
            // Fortschritt nur für den Galerie-Teil
            const progress = Math.min(
              1,
              Math.max(0, (self.progress - curtainShare) / moveShare)
            );
            setBar(bar, progress);
            count.textContent = `${Math.min(
              posts,
              Math.floor(progress * posts) + 1
            )} / ${posts}`;
            if (bird)
              gsap.set(bird, {
                y: Math.sin(progress * Math.PI * 4) * 18,
                x: -progress * 60,
              });
          },
        },
      });
      if (curtainShare > 0) tl.to({}, { duration: curtainShare }); // warten
      tl.to(track, {
        x: () => -distance(),
        ease: "none",
        duration: moveShare,
      });
      tl.to({}, { duration: 1 - curtainShare - moveShare }); // stehen bleiben

      // Seitwärts scrollen (Trackpad links/rechts, Shift + Mausrad) bewegt die Galerie mit.
      // Nur in Sections mit data-sideways. Es greift schon kurz bevor die Galerie fixiert ist,
      // hält am Anfang und am Ende an und blockiert dort die "Zurück"-Wischgeste des Browsers.
      // Auch über einem Carousel bewegt seitwärts immer die Galerie (Carousels: Pfeile/Wischen am Handy).
      const sideways = pin.closest("[data-sideways]");
      const NEAR = 0.5; // so viele Bildschirmhöhen vor/nach der Galerie reagiert es schon
      let axis = null; // eine Wischbewegung bleibt seitwärts oder hoch/runter
      let axisTime = 0;

      const onWheel = (event) => {
        const st = tl.scrollTrigger;
        if (!st) return;
        const y = window.scrollY;
        const near = window.innerHeight * NEAR;
        if (y < st.start - near || y > st.end + near) return;

        const unit = event.deltaMode === 1 ? 16 : 1; // Zeilen statt Pixel (Firefox)
        let dx = event.deltaX * unit;
        const dy = event.deltaY * unit;
        if (!dx && event.shiftKey) dx = dy; // Shift + Mausrad

        // Richtung einmal pro Wischbewegung festlegen, damit es nicht hin und her kippt
        const now = performance.now();
        if (now - axisTime > 180) axis = null;
        axisTime = now;
        if (!axis) {
          if (Math.abs(dx) > Math.abs(dy) * 0.6 && Math.abs(dx) > 0.5)
            axis = "x";
          else if (Math.abs(dy) > 0.5) axis = "y";
        }
        if (axis !== "x" || !dx) return;

        event.preventDefault(); // auch keine "Zurück"-Geste des Browsers
        if (dx < 0 && y <= st.start + 1) return; // schon ganz am Anfang
        if (dx > 0 && y >= st.end - 1) return; // schon ganz am Ende
        window.scrollTo(
          0,
          dx > 0 ? Math.min(st.end - 1, y + dx) : Math.max(st.start + 1, y + dx)
        );
      };
      // Solange man in der Nähe der Galerie ist: "Zurück"-Wischgeste des Browsers aus
      const onScroll = () => {
        const st = tl.scrollTrigger;
        if (!st) return;
        const y = window.scrollY;
        const near = window.innerHeight * NEAR;
        pin.classList.toggle(
          "is-near",
          y >= st.start - near && y <= st.end + near
        );
        document.documentElement.classList.toggle(
          "no-swipe-back",
          !!document.querySelector("[data-sideways] .is-near")
        );
      };
      if (sideways) {
        window.addEventListener("wheel", onWheel, { passive: false });
        window.addEventListener("scroll", onScroll, { passive: true });
      }

      return () => {
        pin.classList.remove("is-pinned", "is-near");
        document.documentElement.classList.remove("no-swipe-back");
        if (sideways) {
          window.removeEventListener("wheel", onWheel);
          window.removeEventListener("scroll", onScroll);
        }
      };
    });
  });

  // Featured: Kartenstapel. Gepinnt; pro Folge schiebt sich die nächste Karte von unten
  // über die vorherige, die alten rutschen etwas nach hinten (kleiner, dunkler).
  mm.add("(min-width: 900px)", () => {
    document.querySelectorAll("[data-episodes]").forEach((section) => {
      const pin = section.querySelector(".chapter__pin");
      const stack = section.querySelector(".episodes__stack");
      const cards = [...section.querySelectorAll("[data-episode]")];
      const navs = [...section.querySelectorAll("[data-episode-nav]")];
      const bar = section.querySelector("[data-episodes-progress]");
      const count = section.querySelector("[data-episodes-count]");
      const steps = cards.length - 1;
      const STEP = 0.85; // Scrollweg pro Folge, in Bildschirmhöhen
      const HOLD = 0.4; // am Schluss kurz stehen bleiben, bevor es weitergeht
      // Wie bei den Galerien: warten, bis der Vorhang ganz offen ist
      const withCurtain = curtain && pin.contains(curtain);
      const wait = withCurtain
        ? Math.max(0, CURTAIN.length - CURTAIN.early) / STEP
        : 0; // in "Folgen"
      const total = wait + steps + HOLD;
      let active = 0;

      stack.classList.add("is-stacked");
      cards.forEach((card, i) => card.classList.toggle("is-front", i === 0));
      gsap.set(cards.slice(1), { yPercent: 115, rotation: 2.5 });

      const setActive = (index) => {
        if (index === active) return;
        cards.forEach((card, i) => {
          card.classList.toggle("is-front", i === index);
          if (i !== index) stopYouTube(card.querySelector("[data-youtube]")); // nichts läuft hinter dem Stapel weiter
        });
        active = index;
      };

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut", duration: 1 },
        scrollTrigger: {
          trigger: pin,
          pin: true,
          anticipatePin: 1,
          start: "top top",
          end: () => `+=${total * STEP * window.innerHeight}`,
          scrub: 0.25, // Karten folgen dem Scrollen fast ohne Verzögerung
          invalidateOnRefresh: true,
          refreshPriority: order(pin),
          // Einrasten: Bleibt man zwischen zwei Folgen stehen, gleitet es zur nächsten ganzen Folge.
          // Zu weit gescrollt? Dann geht es zurück zur Folge, die näher ist.
          // Während der Vorhang aufgeht und nach der letzten Folge rastet nichts ein.
          snap: {
            snapTo: (progress) => {
              const t = progress * total - wait; // 0 = Folge 1, 1 = Folge 2 ...
              if (t <= 0 || t >= steps) return progress;
              return (wait + Math.round(t)) / total;
            },
            inertia: false, // von dort aus, wo man stehen bleibt, nicht vom Schwung hochgerechnet
            duration: { min: 0.12, max: 0.3 }, // wie schnell es zur Folge gleitet
            delay: 0.03, // wie lange es nach dem Stehenbleiben wartet
            ease: "power3.out", // zieht sofort an, bremst am Schluss weich ab
          },
          onUpdate: (self) => {
            const t = Math.min(
              steps,
              Math.max(0, self.progress * total - wait)
            );
            const index = Math.round(t); // ab der Hälfte zählt die neue Folge
            setActive(index);
            navs.forEach((nav, i) =>
              nav.classList.toggle("is-active", i === index)
            );
            setBar(bar, steps ? t / steps : 1);
            count.textContent = `${index + 1} / ${cards.length}`;
          },
        },
      });
      if (wait > 0) tl.to({}, { duration: wait }); // Vorhang
      for (let k = 1; k <= steps; k++) {
        const at = wait + k - 1;
        tl.to(cards[k], { yPercent: 0, rotation: 0 }, at);
        // die Karten darunter rutschen nach hinten
        for (let j = 0; j < k; j++) {
          const depth = k - j;
          tl.to(
            cards[j],
            {
              scale: 1 - depth * 0.06,
              yPercent: -depth * 7,
              "--dim": Math.min(0.6, depth * 0.3),
            },
            at
          );
        }
      }
      tl.to({}, { duration: HOLD });

      // Klick auf eine Folge: zu ihr scrollen
      navs.forEach((nav, i) =>
        nav.addEventListener("click", () => {
          const st = tl.scrollTrigger;
          const perUnit = (st.end - st.start) / total;
          window.scrollTo({
            top: st.start + (wait + i) * perUnit + 2,
            behavior: "smooth",
          });
        })
      );

      return () => {
        stack.classList.remove("is-stacked");
        cards.forEach((card) => card.classList.remove("is-front"));
      };
    });
  });

  // Featured auf dem Handy: Folgen untereinander, jede fliegt beim Hereinscrollen ein
  mm.add("(max-width: 899px)", () => {
    document.querySelectorAll("[data-episode]").forEach((card) => {
      gsap.from(card, {
        y: 60,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top 88%",
          refreshPriority: order(card),
        },
      });
    });
  });

  // Vorhang: beginnt CURTAIN.early Bildschirmhöhen vor dem Anhalten aufzugehen
  if (curtain) {
    const section = curtain.closest("section");
    const curtainState = { p: 0 };
    drawCurtain(0);
    gsap.to(curtainState, {
      p: 1,
      ease: "none",
      onUpdate: () => drawCurtain(curtainState.p),
      scrollTrigger: {
        trigger: section,
        start: () => `top ${CURTAIN.early * 100}%`,
        end: () => `+=${CURTAIN.length * window.innerHeight}`,
        scrub: 0.5,
        invalidateOnRefresh: true,
        refreshPriority: order(section),
      },
    });
    curtain.classList.add("is-active");
  }

  // Handy: Galerien sind nicht gepinnt. Die Sektion hält kurz an, bis der Vorhang offen ist.
  mm.add("(max-width: 899px)", () => {
    if (!curtain || CURTAIN.length <= CURTAIN.early) return;
    const pin = curtain.closest(".chapter__pin");
    ScrollTrigger.create({
      trigger: pin,
      pin: true,
      anticipatePin: 1,
      start: "top top",
      end: () => `+=${(CURTAIN.length - CURTAIN.early) * window.innerHeight}`,
      invalidateOnRefresh: true,
      refreshPriority: order(pin),
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

  // Finale (Multimedia Award 2026): Der Umschlag öffnet sich beim Scrollen.
  // Laptop: gepinnt, danach erscheinen rechts Datum, Countdown und Daumen.
  // Handy: nicht gepinnt, der Umschlag öffnet sich, während er durchs Bild scrollt.
  const finale = document.querySelector("[data-finale]");
  if (finale) {
    const q = (sel) => finale.querySelector(sel);
    const flap = q("[data-envelope-flap]");
    const card = q("[data-envelope-card]");
    const envelopeParts = finale.querySelectorAll(
      ".envelope__back, .envelope__front, .envelope__flap"
    );
    finale.classList.remove("is-static");

    // Gemeinsamer Ablauf: Umschlag ist zu (mit Siegel), Satz erscheint, Klappe auf, Karte heraus
    const openEnvelope = (tl) => {
      // fromTo mit festen Endwerten: bleibt auch nach einem Neuberechnen der Seite sichtbar
      tl.fromTo(
        q("[data-finale-line]"),
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5 },
        0
      )
        .to(flap, { rotationX: 180, duration: 0.8, ease: "power1.inOut" }, 0.6)
        .to(q(".envelope__seal"), { opacity: 0, duration: 0.3 }, 0.6)
        .set(flap, { zIndex: 0 }, 1.0) // Klappe hinter die Karte, sobald sie offen ist
        .to(card, { yPercent: -64, duration: 0.9, ease: "power2.out" }, 1.4);
      return tl;
    };

    mm.add("(min-width: 900px)", () => {
      const line = q("[data-finale-line]");
      const infoItems = [...q("[data-finale-info]").children];
      // Sicherheitsnetz: ab 70 % ist alles sicher sichtbar, egal was der Browser vorher gemacht hat
      const ensureVisible = () =>
        [line, ...infoItems].forEach((el) => {
          if (+getComputedStyle(el).opacity < 0.99)
            gsap.set(el, { opacity: 1, x: 0, y: 0 });
        });
      const tl = gsap.timeline({
        defaults: { ease: "power1.out" },
        scrollTrigger: {
          trigger: q(".finale__pin"),
          pin: true,
          anticipatePin: 1,
          start: "top top",
          end: () => `+=${window.innerHeight * 2.4}`,
          scrub: 0.5,
          refreshPriority: order(finale),
          onUpdate: (self) => {
            if (self.progress > 0.7) ensureVisible();
          },
          onLeave: ensureVisible,
        },
      });
      // Zeitplan: Umschlag auf und Karte heraus (0–2.3), ab 1.3 kommen rechts Datum,
      // Countdown und Daumen, ab 2.4 fällt der Umschlag weg. Danach bleibt es stehen (HOLD).
      const HOLD = 1.2;
      openEnvelope(tl)
        .fromTo(
          infoItems,
          { opacity: 0, x: 40 },
          { opacity: 1, x: 0, duration: 0.5, stagger: 0.08 },
          1.3
        )
        // Umschlag fällt weg, die Karte bleibt gross stehen
        .to(envelopeParts, { yPercent: 40, opacity: 0, duration: 0.7 }, 2.4)
        .to(card, { yPercent: -30, scale: 1.06, duration: 0.7 }, 2.4)
        .to({}, { duration: HOLD }); // stehen bleiben
    });

    mm.add("(max-width: 899px)", () => {
      openEnvelope(
        gsap.timeline({
          scrollTrigger: {
            trigger: q("[data-envelope]"),
            start: "top 85%",
            end: "bottom 35%",
            scrub: 0.5,
            refreshPriority: order(finale),
          },
        })
      );
    });
  }

  // Nach Bildern und Schriften neu messen: Die Höhen ändern sich, sonst stimmen die Haltepunkte nicht
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
  // Kopfzeilen-Fortschritt: Seitenhöhe ändert sich durch die gepinnten Kapitel
  ScrollTrigger.addEventListener("refresh", () => {
    measureHeader();
    updateHeader();
  });
}

// Handy oder ohne Animation: Galerien werden gewischt, Balken und Zähler laufen mit
document.querySelectorAll("[data-gallery]").forEach((pin) => {
  const gallery = pin.querySelector(".gallery");
  const bar = pin.querySelector("[data-gallery-progress]");
  const count = pin.querySelector("[data-gallery-count]");
  const posts = pin.querySelectorAll(".post:not(.post--text)").length;
  gallery.addEventListener(
    "scroll",
    () => {
      if (pin.classList.contains("is-pinned")) return; // Desktop: macht GSAP
      const p =
        gallery.scrollLeft /
        Math.max(1, gallery.scrollWidth - gallery.clientWidth);
      setBar(bar, p);
      count.textContent = `${Math.min(
        posts,
        Math.round(p * (posts - 1)) + 1
      )} / ${posts}`;
    },
    { passive: true }
  );
});

/* ---------- Cuschinar Difficil: Illustrationen springen auf die Karten ----------
   Ist eine Folge zu 70 % im Bild, springt ihre Illustration drauf; verlässt die
   Folge das Bild, geht sie wieder weg (und springt beim nächsten Mal wieder).
   Ohne Animation: einfach da. */

if (!reduceMotion && "IntersectionObserver" in window) {
  const stickers = document.querySelectorAll("[data-sticker]");
  const stickerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const sticker = entry.target.querySelector("[data-sticker]");
        if (entry.intersectionRatio >= 0.8) sticker.classList.add("is-in");
        else if (!entry.isIntersecting) sticker.classList.remove("is-in");
      });
    },
    { threshold: [0.4, 0.9] }
  );
  stickers.forEach((sticker) => {
    sticker.closest(".gallery").classList.add("has-stickers");
    stickerObserver.observe(sticker.closest(".post")); // die ganze Karte zählt, nicht nur die Ecke
  });
}

/* ---------- Finale: Countdown bis zur Verleihung ----------
   Datum steht in data-countdown. Am Tag selbst und danach erscheint statt der
   Zahlen ein Satz (data-countdown-done). Nach der Verleihung den Satz in index.html anpassen. */

const countdown = document.querySelector("[data-countdown]");
if (countdown) {
  const target = new Date(countdown.dataset.countdown).getTime();
  const done = document.querySelector("[data-countdown-done]");
  const units = {
    days: 86400000,
    hours: 3600000,
    minutes: 60000,
    seconds: 1000,
  };
  const fields = {};
  Object.keys(units).forEach(
    (key) => (fields[key] = countdown.querySelector(`[data-unit="${key}"]`))
  );
  const tick = () => {
    let rest = target - Date.now();
    if (rest <= 0) {
      countdown.hidden = true;
      done.hidden = false;
      // 6 Stunden nach Beginn: Satz für "danach" (data-after)
      if (rest < -6 * units.hours && done.dataset.after) {
        done.textContent = done.dataset.after;
        clearInterval(timer);
      }
      return;
    }
    Object.entries(units).forEach(([key, ms]) => {
      const value = Math.floor(rest / ms);
      rest -= value * ms;
      fields[key].textContent = String(value).padStart(2, "0");
    });
  };
  const timer = setInterval(tick, 1000);
  tick();
}

/* ---------- Finale: Daumen drücken ----------
   Zählt pro Browser einmal (php/daumen.php, Tabelle siehe php/daumen.sql).
   Ohne PHP (z. B. lokal) funktioniert der Knopf trotzdem, nur ohne Zahl.
   Schaltet das Achievement "Daumen gedrückt" frei. */

const daumen = document.querySelector("[data-daumen]");
if (daumen) {
  const API = "php/daumen.php";
  const btn = daumen.querySelector("[data-daumen-btn]");
  const label = daumen.querySelector("[data-daumen-label]");
  const countText = daumen.querySelector("[data-daumen-count]");
  const LOCAL_KEY = "mmp_daumen";

  const showCount = (count) => {
    if (typeof count !== "number") return;
    countText.textContent =
      count === 0
        ? "Sei die erste Person, die uns die Daumen drückt"
        : count === 1
        ? "1 Person drückt uns die Daumen"
        : `${count} Personen drücken uns die Daumen`;
  };
  const showPressed = (on) => {
    btn.classList.toggle("is-pressed", on);
    label.textContent = on ? "Danke fürs Duume drücke!" : "Drück eus de Duume";
  };
  // Ob dieser Browser schon gedrückt hat, entscheidet der Server.
  // Nur wenn er nicht erreichbar ist (z. B. lokal ohne PHP), zählt die Erinnerung im Browser.
  let pressed = false;
  let serverOk = false;
  try {
    pressed = localStorage.getItem(LOCAL_KEY) === "1";
  } catch {}
  showPressed(pressed);

  fetch(API, { credentials: "same-origin" })
    .then((res) => (res.ok ? res.json() : Promise.reject()))
    .then((data) => {
      serverOk = true;
      showCount(data.count);
      pressed = !!data.pressed;
      showPressed(pressed);
    })
    .catch(() => {}); // kein PHP: Knopf geht trotzdem, nur ohne Zahl

  // Ein paar Daumen fliegen vom Knopf weg
  const fly = () => {
    if (reduceMotion || typeof gsap === "undefined") return;
    const box = btn.getBoundingClientRect();
    for (let i = 0; i < 9; i++) {
      const el = document.createElement("span");
      el.className = "daumen__fly";
      el.textContent = "🤞";
      el.setAttribute("aria-hidden", "true");
      el.style.left = `${box.left + box.width / 2 - 14}px`;
      el.style.top = `${box.top}px`;
      document.body.append(el);
      gsap.to(el, {
        x: gsap.utils.random(-160, 160),
        y: gsap.utils.random(-260, -120),
        rotation: gsap.utils.random(-60, 60),
        opacity: 0,
        duration: gsap.utils.random(0.9, 1.4),
        ease: "power2.out",
        onComplete: () => el.remove(),
      });
    }
  };

  btn.addEventListener("click", () => {
    fly();
    unlock("daumen");
    if (pressed && serverOk) return; // schon gezählt (der Server zählt sowieso nur einmal)
    pressed = true;
    showPressed(true);
    try {
      localStorage.setItem(LOCAL_KEY, "1");
    } catch {}
    fetch(API, { method: "POST", credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        serverOk = true;
        showCount(data.count);
      })
      .catch(() => {});
  });
}

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

/* ---------- Easter Egg: 5x auf einen goldenen Vogel = Geheimfoto, 5x auf den pinken Spatz = Spiel ---------- */

// Piepen bei jedem Klick auf einen Vogel. Jedes Piepen ist etwas anders hoch.
// Eigenen Sound verwenden: sound/peep.mp3 ersetzen.
const peep = new Audio("sound/peep.mp3");
peep.preload = "auto";
function playPeep() {
  const sound = peep.cloneNode(); // schnelle Klicks dürfen sich überlagern
  sound.preservesPitch = false; // Tempo ändert auch die Tonhöhe
  sound.playbackRate = 0.85 + Math.random() * 0.4;
  sound.volume = 0.6;
  sound.play().catch(() => {});
}

const eggDialog = document.querySelector("[data-egg-dialog]");
document.querySelectorAll("[data-bird]").forEach((bird) => {
  let clicks = 0;
  let timer;
  bird.addEventListener("click", () => {
    playPeep();
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
    // Pinker Spatz: nach 5 Klicks zum Spiel (kurz warten, damit man das letzte Piepen hört)
    if (bird.dataset.flappy) {
      setTimeout(() => (window.location.href = bird.dataset.flappy), 250);
      return;
    }
    eggDialog.querySelector("img").src = bird.dataset.egg;
    eggDialog.showModal();
    unlock("geheimfoto");
  });
});

/* ---------- Berlin: Reel-Schlaufen und Carousels ----------
   Schlaufen laufen ohne Ton nur, solange die Karte im Bild ist (mit "weniger Bewegung":
   nur das Standbild). Carousels: Pfeile, Wischen, Zähler; im Bild blättern sie langsam
   von selbst weiter, ausser man ist mit der Maus drauf. */

const loops = document.querySelectorAll("[data-loop] video");
if (!reduceMotion && "IntersectionObserver" in window) {
  const loopObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.intersectionRatio >= 0.5) video.play().catch(() => {});
        else video.pause();
      });
    },
    { threshold: [0, 0.5] }
  );
  loops.forEach((video) => loopObserver.observe(video));
}

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector(".carousel__track");
  const slides = track.querySelectorAll("img");
  const prev = carousel.querySelector("[data-carousel-prev]");
  const next = carousel.querySelector("[data-carousel-next]");
  const count = carousel.querySelector("[data-carousel-count]");
  const AUTO = 3500; // ms pro Bild beim automatischen Blättern
  let index = 0;
  let timer;
  let visible = false;

  const goTo = (i) => {
    index = (i + slides.length) % slides.length;
    track.scrollTo({
      left: index * track.clientWidth,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };
  const show = () => {
    index = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    count.textContent = `${index + 1} / ${slides.length}`;
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
  };
  const stop = () => clearInterval(timer);
  const start = () => {
    stop();
    if (reduceMotion || !visible) return;
    timer = setInterval(() => goTo(index + 1), AUTO);
  };

  prev.addEventListener("click", () => goTo(index - 1));
  next.addEventListener("click", () => goTo(index + 1));
  track.addEventListener("scroll", () => requestAnimationFrame(show), {
    passive: true,
  });
  track.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    goTo(index + (event.key === "ArrowRight" ? 1 : -1));
  });
  // Pause, solange man mit der Maus, dem Finger oder der Tastatur dran ist
  ["pointerenter", "focusin", "touchstart"].forEach((type) =>
    carousel.addEventListener(type, stop, { passive: true })
  );
  ["pointerleave", "focusout"].forEach((type) =>
    carousel.addEventListener(type, start)
  );
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.intersectionRatio >= 0.6;
        if (visible) start();
        else stop();
      },
      { threshold: [0, 0.6] }
    ).observe(carousel);
  }
  show();
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

// Bleibt aktiv, damit "Ganz unten" nach dem Zurücksetzen wieder gefunden werden kann.
// Nach dem Zurücksetzen zählt es erst, wenn man den Footer verlassen hat und wieder hinkommt.
let footerArmed = true;
// Nach dem Zurücksetzen (shared.js) nicht sofort wieder auslösen, falls man gerade unten ist
window.addEventListener("achievements-reset", () => {
  footerArmed = false;
});
new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) footerArmed = true;
    else if (footerArmed) unlock("ende");
  });
}).observe(document.querySelector(".site-footer"));

/* =========================================================
   Labubuech
   Zugeklapptes Buch im Hero und am Ende. Das Lesezeichen öffnet es als Pop-up.
   Seiten: alle Einträge (älteste zuerst), dann die Einleitung (links) und die Seite
   zum Schreiben (rechts). Aufgeschlagen wird bei Einleitung + Schreibseite;
   der Pfeil links ("Einträge durchstöbern") blättert zurück durch die Einträge.
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
const bookPrevLabel = bookDialog.querySelector("[data-book-prev-label]");
const writeTemplate = document.querySelector("#book-write-page");
const twoPages = window.matchMedia("(min-width: 760px)"); // Doppelseite oder Einzelseite
const dateFormat = new Intl.DateTimeFormat("de-CH", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}); // z. B. "17. November 2026 um 15:42"

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
  // Zeichen zählen (Limite = maxlength in index.html, gleich wie TEXT_MAX in labubuech.php)
  const count = form.querySelector("[data-book-count]");
  const showCount = () => {
    const max = form.elements.message.maxLength;
    const used = form.elements.message.value.length;
    count.textContent = `${used} / ${max}`;
    count.classList.toggle("is-near", used >= max - 20);
  };
  form.elements.message.addEventListener("input", showCount);
  form.addEventListener("reset", () => requestAnimationFrame(showCount));
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

  // Einträge: Text als Zitat, unten "— Name, Datum um Zeit"
  const entryPages = entries.map((entry, i) => {
    const page = makePage("entry");
    const num = document.createElement("p");
    num.className = "book-page__num";
    num.textContent = `Eintrag ${i + 1} von ${entries.length}`;
    const quote = document.createElement("blockquote");
    quote.className = "book-entry";
    const text = document.createElement("p");
    text.textContent = entry.text; // als Text, nie als HTML
    // Unterschrift: "— Name" gut lesbar, darunter Datum und Zeit
    const by = document.createElement("footer");
    const name = document.createElement("strong");
    name.className = "book-entry__name";
    name.textContent = `— ${entry.name}`;
    const time = document.createElement("time");
    time.dateTime = entry.date;
    time.textContent = dateFormat.format(new Date(entry.date));
    by.append(name, time);
    quote.append(text, by);
    page.append(num, quote);
    return page;
  });

  // Einleitung: Titel, kurzer Satz, drei Regeln, Hinweis auf die Schreibseite
  const intro = makePage("intro");
  intro.innerHTML = `
    <img class="book-intro__bird" src="img/vogel.png" alt="" width="140" height="170" />
    <p class="book-intro__kicker">Gästebuch</p>
    <h3>Labubuech</h3>
    <p class="book-intro__lead">Schreib uns etwas Liebes, Lustiges oder Spatziges.</p>
    <ol class="book-intro__rules">
      <li><strong>2 Minuten</strong><span>Die Zeit läuft ab dem ersten Buchstaben.</span></li>
      <li><strong>Einmal pro Tag</strong><span>Morgen hast du wieder zwei Minuten.</span></li>
      <li><strong>Für alle lesbar</strong><span>Dein Eintrag steht danach im Buch.</span></li>
    </ol>
    <p class="book-intro__hint">${
      twoPages.matches ? "Deine Seite ist rechts" : "Zu deiner Seite: Pfeil nach rechts"
    } <span aria-hidden="true">→</span></p>`;

  const list = [...entryPages];
  // Doppelseite: Einleitung muss links liegen. Bei ungerader Anzahl Einträge vorne eine leere Seite.
  if (twoPages.matches && list.length % 2 === 1) {
    const blank = makePage("blank");
    blank.innerHTML = `<img src="img/vogel.png" alt="" width="90" height="110" />`;
    list.unshift(blank);
  }
  list.push(intro, buildWritePage());

  pages = list;
  bookPages.replaceChildren(...pages);

  const form = bookPages.querySelector("[data-book-form]");
  if (form && draft) {
    form.elements.name.value = draft.name;
    form.elements.message.value = draft.message;
    form.elements.message.dispatchEvent(new Event("input")); // Zähler aktualisieren
  }
  showTime();
}

// Zu lange Einträge (z. B. alte mit 400 Zeichen oder auf sehr kleinen Bildschirmen)
// werden etwas kleiner geschrieben, bis sie ohne Scrollbalken auf die Seite passen.
function fitEntries() {
  pages
    .filter((page) => !page.hidden && page.classList.contains("book-page--entry"))
    .forEach((page) => {
      const quote = page.querySelector(".book-entry");
      let size = 1.12; // gleich wie .book-entry in style.css
      quote.style.fontSize = "";
      while (page.scrollHeight > page.clientHeight + 1 && size > 0.72) {
        size -= 0.04;
        quote.style.fontSize = `${size}em`;
      }
    });
}
window.addEventListener("resize", () => {
  if (bookDialog.open) fitEntries();
});

const perView = () => (twoPages.matches ? 2 : 1);
const lastView = () => Math.max(0, pages.length - perView());
// Aufschlagen: Doppelseite Einleitung + Schreibseite, auf dem Handy die Einleitung
const introIndex = () =>
  pages.findIndex((page) => page.classList.contains("book-page--intro"));
const openView = () => (twoPages.matches ? lastView() : introIndex());

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
  fitEntries();
  bookPrev.disabled = view === 0;
  bookNext.disabled = view >= lastView();
  // "Einträge durchstöbern" nur bei der Einleitung, wenn es Einträge gibt
  const atIntro = view <= introIndex() && introIndex() < view + perView();
  bookPrevLabel.hidden = !(atIntro && view > 0);
  bookPrev.setAttribute(
    "aria-label",
    bookPrevLabel.hidden ? "Zurückblättern" : "Einträge durchstöbern"
  );
}

function showTime() {
  const form = bookPages.querySelector("[data-book-form]");
  if (!form) return;
  const left = Math.ceil(timeLeft());
  form.querySelector("[data-book-time]").textContent = `${String(
    Math.floor(left / 60)
  ).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
  setBar(form.querySelector("[data-book-progress]"), timeLeft() / BOOK_SECONDS);
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
    showView(openView());
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
    // Seite mit dem neusten Eintrag zeigen (steht direkt vor der Einleitung)
    const newest = message ? introIndex() - 1 : openView();
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
  showView(openView()); // aufschlagen bei Einleitung + Schreibseite
  if (!bookDialog.open) bookDialog.showModal();
  if (bookState === "open" && deadline) startTicking(); // Zeit läuft schon seit vorhin
}

document
  .querySelectorAll("[data-book-open]")
  .forEach((button) => button.addEventListener("click", openBook));

// Klick auf den Buchdeckel: das Lesezeichen wackelt als Hinweis
document.querySelectorAll("[data-book]").forEach((book) => {
  const ribbon = book.querySelector(".book__ribbon");
  const cover = book.querySelector(".book__cover, .book__image"); // Deckel oder Bild vom Buch
  if (!cover || !ribbon) return;
  cover.addEventListener("click", () => {
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
closeOnBackdrop(bookDialog);
twoPages.addEventListener("change", () => {
  if (!bookDialog.open) return;
  buildPages();
  showView(openView());
});
