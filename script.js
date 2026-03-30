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