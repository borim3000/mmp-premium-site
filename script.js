const pranks = [
    "oooooh bisch broke wieso drucksch du das? 😂",
    "hahaha du bisch so en njeri!",
    "alter riss di zeme, das isch peinlich",
    "fucking opfer 🤣",
    "du hesch gar nüt gwunne!",
    "schade, schade, schade!",
    "scheeeeeisss wixxer",
    "lmaoooooo eat shit",
    "pissooo (thurgau akzent)"
];

let popupCount = 0;
let round = 1;

document.querySelector('.prank-button').addEventListener('click', startPrank);

function startPrank() {
    popupCount = 0;
    round = 1;
    createPopups(5);
}

function createPopups(count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            createPopup();
        }, Math.random() * 3000); // Random timing within 3 seconds
    }
}

function createPopup() {
    const container = document.getElementById('popupContainer');
    const popup = document.createElement('div');
    popup.className = 'popup';
    
    // Random position
    const randomX = Math.random() * (window.innerWidth - 300);
    const randomY = Math.random() * (window.innerHeight - 150);
    
    popup.style.left = randomX + 'px';
    popup.style.top = randomY + 'px';
    
    // Random prank message
    const randomPrank = pranks[Math.floor(Math.random() * pranks.length)];
    
    popup.innerHTML = `
        <button class="popup-close">&times;</button>
        <p>${randomPrank}</p>
    `;
    
    container.appendChild(popup);
    
    popup.querySelector('.popup-close').addEventListener('click', () => {
        popup.remove();
        popupCount++;
        
        if (popupCount === 5 * round) {
            if (round === 1) {
                round = 2;
                popupCount = 0;
                createPopups(3); // Second round with 3 popups
            } else {
                alert('Minigame vorbei! Du hesch es gemacht! 🎉');
            }
        }
    });
}

const secretMessage = "Du hesch gwunne! 🎉 Ismael isch e dummi sau!";
const secretChance = 0.01; // 1% chance

document.querySelector('.prank-button').addEventListener('click', startPrank);

function startPrank() {
    // Check for secret message (1% chance)
    if (Math.random() < secretChance) {
        showSecretMessage();
        return;
    }
    
    popupCount = 0;
    round = 1;
    createPopups(5);
}

function showSecretMessage() {
    const container = document.getElementById('popupContainer');
    const secretPopup = document.createElement('div');
    secretPopup.className = 'popup secret-popup';
    
    secretPopup.style.left = (window.innerWidth / 2 - 150) + 'px';
    secretPopup.style.top = (window.innerHeight / 2 - 100) + 'px';
    
    secretPopup.innerHTML = `
        <button class="popup-close">&times;</button>
        <a href="win.html" class="secret-button">Du hesch gwunne! 🎉</a>
    `;
    
    container.appendChild(secretPopup);
    
    secretPopup.querySelector('.popup-close').addEventListener('click', () => {
        secretPopup.remove();
    });
}