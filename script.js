const pranks = [
  "oooooh bisch broke wieso drucksch du das? 😂",
  "hahaha du bisch so en njeri!",
  "alter riss di zeme, das isch peinlich",
  "fucking opfer 🤣",
  "du hesch gar nüt gwunne!",
  "schade, schade, schade!",
  "scheeeeeisss wixxer",
  "lmaoooooo eat shit",
  "pissooo (thurgau akzent)",
  "lalalalala",
  "gwünnchance isch 1% gell",
  "das meme mit dem dude wo diamanten isch und er seit 'i am rich' isch so geil",
  "nur no 100 mal klicke denn günnsch",
  "1% 1% 1% 1% 1% 1%",
  "ooooooooohhh",
  "die nachricht isch nur filler. wart uf di negscht",
];

let popupCount = 0;
let round = 1;

document.querySelector(".prank-button").addEventListener("click", startPrank);

function startPrank() {
  if (Math.random() < secretChance) {
    showSecretMessage();
    return;
  }
  popupCount = 0;
  round = 1;
  createPopups(5);
}

function createPopups(count) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      createPopup();
    }, Math.random() * 3000);
  }
}

function createPopup() {
  const container = document.getElementById("popupContainer");
  const popup = document.createElement("div");
  popup.className = "popup";

  const randomX = Math.random() * (window.innerWidth - 300);
  const randomY = Math.random() * (window.innerHeight - 150);

  popup.style.left = randomX + "px";
  popup.style.top = randomY + "px";

  const randomPrank = pranks[Math.floor(Math.random() * pranks.length)];

  popup.innerHTML = `
      <button class="popup-close">&times;</button>
      <p>${randomPrank}</p>
    `;

  container.appendChild(popup);

  popup.querySelector(".popup-close").addEventListener("click", () => {
    popup.remove();
    popupCount++;

    if (popupCount === 5 * round) {
      if (round === 1) {
        round = 2;
        popupCount = 0;
        createPopups(3);
      }
    }
  });
}

const secretMessage = "Du hesch gwunne! 🎉 Ismael isch e dummi sau!";
const secretChance = 0.01;

function showSecretMessage() {
  const container = document.getElementById("popupContainer");
  const secretPopup = document.createElement("div");
  secretPopup.className = "popup secret-popup";

  secretPopup.style.left = window.innerWidth / 2 - 250 + "px";
  secretPopup.style.top = window.innerHeight / 2 - 200 + "px";
  secretPopup.style.zIndex = "9999"; // Highest z-index

  secretPopup.innerHTML = `
      <button class="popup-close">&times;</button>
      <p style="font-size: 1.5rem; font-weight: bold; color: #FF69B4; margin-bottom: 20px;">Du hesch gwunne!</p>
      <a href="win.html" class="secret-button">Zum Gewinn</a>
    `;

  container.appendChild(secretPopup);

  secretPopup.querySelector(".popup-close").addEventListener("click", () => {
    secretPopup.remove();
  });
}

/* ── Side pic: hover = gif plays, click = sound ── */

const sidePic = document.getElementById("sidePic");
const sidePicImg = sidePic.querySelector("img");

// Static image shown at rest — swap to gif on hover
const staticSrc = "img/buttadawg-still.png"; // static preview frame
const animSrc = "img/buttadawg.gif";

sidePicImg.src = staticSrc;

sidePic.addEventListener("mouseenter", () => {
  sidePicImg.src = animSrc + "?t=" + Date.now();
});

sidePic.addEventListener("mouseleave", () => {
  sidePicImg.src = staticSrc;
});

sidePic.addEventListener("click", () => {
  new Audio("sound/buttadawg.mp3").play();
});
