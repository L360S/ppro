const API_BASE_URL = "";
const TOTAL_STATS = 7;


// =========================================================
// GAME STATE
// =========================================================

let currentFighter = null;
let selectedStats = {};
let totalScore = 0;
let rerollUsed = false;
let gameOver = false;
const selectedFighters = new Set();

// =========================================================
// DOM ELEMENTS
// =========================================================

const attributeButtons = document.querySelectorAll('.atr-btn');


// =========================================================
// EVENT LISTENERS
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    updateBuildProgress();
    loadFighter();
});


document.getElementById('respin-btn').addEventListener('click', () => {
    rerollFighter();
});


attributeButtons.forEach(button => {
    button.addEventListener('click', () => {
        setStat(button);
    });
});


document.getElementById('play-again-btn').addEventListener('click', () => {
    resetGame();
});


// =========================================================
// FIGHTER LOADING
// =========================================================

async function loadFighter() {
    try {
        let fighter;

        do {
            const response = await fetch(`${API_BASE_URL}/api/random-fighter`);
            fighter = await response.json();

        } while (selectedFighters.has(fighter["Fighter Name"]));

        currentFighter = fighter;

        displayFighter(fighter);

    } catch (error) {
        console.error("Error fetching fighter:", error);
    }
}


function displayFighter(fighter) {
    const fighterHeader = document.querySelector('.fighter-left h2');
    const fighterImage = document.getElementById('fighter-image');

    const fighterName = fighter["Fighter Name"];

    fighterHeader.textContent = fighterName;

    fighterImage.src = `Images/fighter_images/${fighterName}.png`;
    fighterImage.alt = fighterName;
    fighterImage.hidden = false;
}

// =========================================================
// UI PROGRESS UPDATER
// =========================================================

function updateBuildProgress() {
    const statsSelected = Object.keys(selectedStats).length;

    const selectedCount = document.getElementById('selected-count');
    const totalCount = document.getElementById('total-count');
    const progressBarFill = document.getElementById('progress-bar-fill');

    selectedCount.textContent = statsSelected;
    totalCount.textContent = TOTAL_STATS;

    const progressPercent = (statsSelected / TOTAL_STATS) * 100;

    progressBarFill.style.width = `${progressPercent}%`;
}

// =========================================================
// ATTRIBUTE SELECTION
// =========================================================

function setStat(button) {
    if (!currentFighter || gameOver || button.disabled) {
        return;
    }

    const attribute = button.dataset.stat;
    const fighterName = currentFighter["Fighter Name"];
    const rating = currentFighter[attribute];

    saveSelectedStat(attribute, fighterName, rating);

    updateBuildProgress();

    updateSelectedAttributeButton(
        button,
        attribute,
        fighterName
    );

    addRatingToTotal(rating);

    //Add Fighter to set to avoid Repeats
    selectedFighters.add(fighterName);

    continueGame();
}


function saveSelectedStat(attribute, fighterName, rating) {
    selectedStats[attribute] = {
        fighter: fighterName,
        rating: rating
    };
}


function updateSelectedAttributeButton(button, attribute, fighterName) {
    const attributeName = button.querySelector('.atr-name');
    const attributeFighter = button.querySelector('.atr-fighter');

    attributeName.textContent = `${attribute}:`;
    attributeFighter.textContent = fighterName;

    button.classList.add('selected');
    button.disabled = true;
}


function addRatingToTotal(rating) {
    totalScore += Number(rating);

    console.log("Selected stats:", selectedStats);
    console.log("Total score:", totalScore);
}


function continueGame() {
    const statsChosen = Object.keys(selectedStats).length;

    if (statsChosen === TOTAL_STATS) {
        endGame();
    } else {
        loadFighter();
    }
}


// =========================================================
// REROLL
// =========================================================

function rerollFighter() {
    if (rerollUsed || gameOver) {
        return;
    }

    rerollUsed = true;

    markRerollAsUsed();

    loadFighter();
}

function markRerollAsUsed() {
    const rerollButton = document.getElementById('respin-btn');
    const rerollText = rerollButton.querySelector('span');

    rerollButton.disabled = true;
    rerollText.textContent = "Used";
}


// =========================================================
// END GAME
// =========================================================

function endGame() {
    gameOver = true;

    const finalScore = calculateFinalScore();
    const finalMessage = getFinalMessage(finalScore);

    showFinalMessage(finalMessage);
    showFinalScore(finalScore);
    hideFighterImage();
    showAttributeScores();

    disableRerollButton();
    showPlayAgainButton();
}


// ---------- Calculate Overall ----------

function calculateFinalScore() {
    return Math.round(totalScore / TOTAL_STATS);
}


// ---------- Determine Final Ranking ----------

function getFinalMessage(finalScore) {
    switch (true) {
        case finalScore === 100:
            return "HERCULES";

        case finalScore >= 95:
            return "UNBEATABLE";

        case finalScore >= 90:
            return "CHAMPION";

        case finalScore >= 85:
            return "TOP CONTENDER";

        case finalScore >= 80:
            return "RANKED";

        default:
            return "BARELY HANGING";
    }
}


// ---------- Display Final Ranking ----------

function showFinalMessage(finalMessage) {
    const messageHeader = document.getElementById('final-message');

    messageHeader.textContent = finalMessage;
}


// ---------- Display Final Overall ----------

function showFinalScore(finalScore) {
    const fighterHeader = document.querySelector('.fighter-left h2');

    fighterHeader.textContent = "";

    const overallLabel = document.createElement("span");
    overallLabel.classList.add("overall-label");
    overallLabel.textContent = "Overall:";

    const overallScore = document.createElement("span");
    overallScore.classList.add("overall-score");
    overallScore.textContent = finalScore;

    fighterHeader.appendChild(overallLabel);
    fighterHeader.appendChild(overallScore);
}


// ---------- Hide Fighter Portrait ----------

function hideFighterImage() {
    const fighterImage = document.getElementById('fighter-image');

    fighterImage.hidden = true;
}


// ---------- Reveal Attribute Ratings ----------

function showAttributeScores() {
    attributeButtons.forEach(button => {
        const attribute = button.dataset.stat;
        const choice = selectedStats[attribute];

        if (!choice) {
            return;
        }

        const attributeScore = button.querySelector('.atr-score');

        attributeScore.textContent = choice.rating;
        attributeScore.hidden = false;

        button.classList.add('final');
    });
}


// ---------- Disable Reroll ----------

function disableRerollButton() {
    const rerollButton = document.getElementById('respin-btn');

    rerollButton.disabled = true;
}


// ---------- Show Play Again ----------

function showPlayAgainButton() {
    const playAgainButton = document.getElementById('play-again-btn');

    playAgainButton.hidden = false;
}


// =========================================================
// RESET GAME
// =========================================================

function resetGame() {
    resetGameState();
    updateBuildProgress();
    clearFinalMessage();
    resetAttributeButtons();
    resetRerollButton();
    hidePlayAgainButton();

    loadFighter();
}


// ---------- Reset Game Variables ----------

function resetGameState() {
    currentFighter = null;
    selectedStats = {};
    totalScore = 0;
    rerollUsed = false;
    gameOver = false;
    selectedFighters.clear();
}


// ---------- Clear Final Ranking ----------

function clearFinalMessage() {
    const messageHeader = document.getElementById('final-message');

    messageHeader.textContent = "";
}


// ---------- Reset Attribute Buttons ----------

function resetAttributeButtons() {
    attributeButtons.forEach(button => {
        const attribute = button.dataset.stat;

        const attributeName = button.querySelector('.atr-name');
        const attributeFighter = button.querySelector('.atr-fighter');
        const attributeScore = button.querySelector('.atr-score');

        attributeName.textContent = attribute;
        attributeFighter.textContent = "";

        attributeScore.textContent = "";
        attributeScore.hidden = true;

        button.classList.remove('selected', 'final');
        button.disabled = false;
    });
}


// ---------- Reset Reroll ----------

function resetRerollButton() {
    const rerollButton = document.getElementById('respin-btn');
    const rerollText = rerollButton.querySelector('span');

    rerollButton.disabled = false;
    rerollText.textContent = "Reroll";
}


// ---------- Hide Play Again ----------

function hidePlayAgainButton() {
    const playAgainButton = document.getElementById('play-again-btn');

    playAgainButton.hidden = true;
}