/* =========================================================================
   1. NUMBERED PAIRS & PER-GRID ORDER
   ========================================================================= */
// Number each pair starting from 1. Each pair has two different body parts.
const NUMBERED_ZONE_PAIRS = {
    1: ['neck_jawline', 'arms_hands'],
    2: ['shoulders_upper_back', 'scalp_hair'],
    3: ['thighs_knees', 'feet_calves'],
    4: ['lower_back_hips', 'neck_jawline'],
    5: ['chest_torso', 'arms_hands'],
    6: ['inner_thighs', 'shoulders_upper_back'],
    7: ['thighs_knees', 'scalp_hair'],
    8: ['chest_torso', 'lower_back_hips'],
    9: ['inner_thighs', 'neck_jawline'],
    10: ['intimate', 'chest_torso'],
    11: ['intimate', 'inner_thighs'],
    12: ['intimate', 'scalp_hair']
};

// Choose which pair numbers appear for each grid size, in order
const GRID_PAIR_ORDERS = {
    3: [5, 10, 12],
    4: [2, 4, 8, 11, 12],
    5: [2, 3, 4, 6, 8, 10, 11],
    6: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
};

const ZONE_LABELS = {
    neck_jawline: 'Neck & Jawline',
    shoulders_upper_back: 'Shoulders & Upper Back',
    arms_hands: 'Arms & Hands',
    lower_back_hips: 'Lower Back & Hips',
    thighs_knees: 'Thighs & Knees',
    feet_calves: 'Feet & Calves',
    scalp_hair: 'Scalp & Hair',
    chest_torso: 'Chest & Torso',
    inner_thighs: 'Inner Thighs',
    intimate: 'Intimate Zones'
};

/* =========================================================================
   2. GAME STATE & VARIABLES
   ========================================================================= */
let challengeDatabase = {};
let selectedIntensity = 'romantic';
let gridBoxes = 6; // 3, 4, 5, or 6
let dotsCount = gridBoxes + 1;

let playerNames = { 1: 'Player 1', 2: 'Player 2' };
let currentPlayer = 1;
let scores = { 1: 0, 2: 0 };
let playerBoxStep = { 1: 0, 2: 0 };
let usedPrompts = new Set();
let awaitingChoice = false;

let padding = 24;
let spacing = 55;

let hLines = [];
let vLines = [];
let boxes = [];

let canvas, ctx;

/* =========================================================================
   3. INITIALIZATION & DATA LOADING
   ========================================================================= */
document.addEventListener('DOMContentLoaded', async () => {
    await loadChallenges();

    setupSingleSelect('intensity-group', (val) => {
        selectedIntensity = val;
    });

    setupSingleSelect('grid-size-group', (val) => {
        const parsed = parseInt(val, 10);
        if ([3, 4, 5, 6].includes(parsed)) {
            gridBoxes = parsed;
            dotsCount = gridBoxes + 1;
        }
    });

    const startBtn = document.getElementById('start-game-btn');
    if (startBtn) {
        startBtn.addEventListener('click', startGame);
    }

    const resetBtn = document.getElementById('reset-game-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', returnToSetup);
    }

    const closeBtn = document.getElementById('close-challenge-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    canvas = document.getElementById('gameCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.addEventListener('click', handleCanvasClick);
    }
});

async function loadChallenges() {
    try {
        const response = await fetch('./challenges.json');
        if (!response.ok) {
            throw new Error(`Failed to load challenges.json (${response.status})`);
        }
        challengeDatabase = await response.json();
    } catch (error) {
        console.error('Error loading challenges.json:', error);
    }
}

function setupSingleSelect(containerId, callback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const buttons = container.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            callback(btn.getAttribute('data-value'));
        });
    });
}

function startGame() {
    const p1Input = document.getElementById('p1-name');
    const p2Input = document.getElementById('p2-name');

    playerNames[1] = (p1Input && p1Input.value.trim()) ? p1Input.value.trim() : 'Player 1';
    playerNames[2] = (p2Input && p2Input.value.trim()) ? p2Input.value.trim() : 'Player 2';

    const p1Label = document.getElementById('p1-label');
    const p2Label = document.getElementById('p2-label');
    if (p1Label) p1Label.innerText = playerNames[1];
    if (p2Label) p2Label.innerText = playerNames[2];

    const setupScreen = document.getElementById('setup-screen');
    const gameScreen = document.getElementById('game-screen');
    if (setupScreen) setupScreen.classList.add('hidden');
    if (gameScreen) gameScreen.classList.remove('hidden');

    closeModal();
    initBoard();
    drawBoard();
}

function returnToSetup() {
    closeModal();
    const setupScreen = document.getElementById('setup-screen');
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) gameScreen.classList.add('hidden');
    if (setupScreen) setupScreen.classList.remove('hidden');
}

/* =========================================================================
   4. BOARD ENGINE (DYNAMIC 3x3 TO 6x6 BOXES)
   ========================================================================= */
function initBoard() {
    dotsCount = gridBoxes + 1;
    spacing = (canvas.width - (padding * 2)) / gridBoxes;
    currentPlayer = 1;
    scores = { 1: 0, 2: 0 };
    playerBoxStep = { 1: 0, 2: 0 };
    usedPrompts.clear();
    awaitingChoice = false;

    hLines = Array(dotsCount).fill(null).map(() => Array(gridBoxes).fill(0));
    vLines = Array(gridBoxes).fill(null).map(() => Array(dotsCount).fill(0));
    boxes = Array(gridBoxes).fill(null).map(() => Array(gridBoxes).fill(0));

    updateScoreDisplay();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle faint guide lines so players can easily tap unplayed edges on mobile
    ctx.strokeStyle = 'rgba(194, 155, 72, 0.16)';
    ctx.lineWidth = 2;
    for (let r = 0; r < dotsCount; r++) {
        for (let c = 0; c < gridBoxes; c++) {
            if (hLines[r][c] === 0) {
                ctx.beginPath();
                ctx.moveTo(padding + c * spacing, padding + r * spacing);
                ctx.lineTo(padding + (c + 1) * spacing, padding + r * spacing);
                ctx.stroke();
            }
        }
    }
    for (let r = 0; r < gridBoxes; r++) {
        for (let c = 0; c < dotsCount; c++) {
            if (vLines[r][c] === 0) {
                ctx.beginPath();
                ctx.moveTo(padding + c * spacing, padding + r * spacing);
                ctx.lineTo(padding + c * spacing, padding + (r + 1) * spacing);
                ctx.stroke();
            }
        }
    }

    // Captured Boxes
    for (let r = 0; r < gridBoxes; r++) {
        for (let c = 0; c < gridBoxes; c++) {
            if (boxes[r][c] !== 0) {
                ctx.fillStyle = boxes[r][c] === 1
                    ? 'rgba(143, 40, 54, 0.45)'
                    : 'rgba(194, 155, 72, 0.32)';
                ctx.fillRect(
                    padding + c * spacing + 2,
                    padding + r * spacing + 2,
                    spacing - 4,
                    spacing - 4
                );
            }
        }
    }

    // Drawn Horizontal Lines
    for (let r = 0; r < dotsCount; r++) {
        for (let c = 0; c < gridBoxes; c++) {
            if (hLines[r][c] !== 0) {
                ctx.strokeStyle = hLines[r][c] === 1 ? '#d9534f' : '#c29b48';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(padding + c * spacing, padding + r * spacing);
                ctx.lineTo(padding + (c + 1) * spacing, padding + r * spacing);
                ctx.stroke();
            }
        }
    }

    // Drawn Vertical Lines
    for (let r = 0; r < gridBoxes; r++) {
        for (let c = 0; c < dotsCount; c++) {
            if (vLines[r][c] !== 0) {
                ctx.strokeStyle = vLines[r][c] === 1 ? '#d9534f' : '#c29b48';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(padding + c * spacing, padding + r * spacing);
                ctx.lineTo(padding + c * spacing, padding + (r + 1) * spacing);
                ctx.stroke();
            }
        }
    }

    // Dots (slightly larger on smaller grids for easy mobile tapping)
    const dotRadius = gridBoxes <= 4 ? 5.5 : 4.5;
    for (let r = 0; r < dotsCount; r++) {
        for (let c = 0; c < dotsCount; c++) {
            ctx.fillStyle = '#f5ece0';
            ctx.beginPath();
            ctx.arc(padding + c * spacing, padding + r * spacing, dotRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function handleCanvasClick(e) {
    if (awaitingChoice) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const clickThreshold = spacing * 0.35;

    // Check Horizontal Lines
    for (let r = 0; r < dotsCount; r++) {
        for (let c = 0; c < gridBoxes; c++) {
            if (hLines[r][c] === 0) {
                const x1 = padding + c * spacing;
                const x2 = padding + (c + 1) * spacing;
                const y1 = padding + r * spacing;

                if (x >= x1 && x <= x2 && Math.abs(y - y1) < clickThreshold) {
                    hLines[r][c] = currentPlayer;
                    processMove();
                    return;
                }
            }
        }
    }

    // Check Vertical Lines
    for (let r = 0; r < gridBoxes; r++) {
        for (let c = 0; c < dotsCount; c++) {
            if (vLines[r][c] === 0) {
                const x1 = padding + c * spacing;
                const y1 = padding + r * spacing;
                const y2 = padding + (r + 1) * spacing;

                if (y >= y1 && y <= y2 && Math.abs(x - x1) < clickThreshold) {
                    vLines[r][c] = currentPlayer;
                    processMove();
                    return;
                }
            }
        }
    }
}

function processMove() {
    let boxesCompletedNow = 0;

    for (let r = 0; r < gridBoxes; r++) {
        for (let c = 0; c < gridBoxes; c++) {
            if (boxes[r][c] === 0) {
                if (
                    hLines[r][c] !== 0 &&
                    hLines[r + 1][c] !== 0 &&
                    vLines[r][c] !== 0 &&
                    vLines[r][c + 1] !== 0
                ) {
                    boxes[r][c] = currentPlayer;
                    scores[currentPlayer]++;
                    boxesCompletedNow++;
                }
            }
        }
    }

    drawBoard();
    updateScoreDisplay();

    if (boxesCompletedNow > 0) {
        showChallengeChoices();
    } else {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateScoreDisplay();
    }
}

function updateScoreDisplay() {
    const p1Score = document.getElementById('score-p1');
    const p2Score = document.getElementById('score-p2');
    const progressText = document.getElementById('boxes-progress');
    const turnText = document.getElementById('turn-indicator');

    const totalCaptured = scores[1] + scores[2];
    const totalBoxes = gridBoxes * gridBoxes;

    if (p1Score) p1Score.innerText = scores[1];
    if (p2Score) p2Score.innerText = scores[2];
    if (progressText) progressText.innerText = `${totalCaptured} / ${totalBoxes}`;

    if (turnText) {
        if (totalCaptured >= totalBoxes) {
            const winnerText = scores[1] === scores[2]
                ? 'All Boxes Claimed — A Tie!'
                : `All Boxes Claimed — ${scores[1] > scores[2] ? playerNames[1] : playerNames[2]} Wins!`;
            turnText.innerHTML = `<strong>${winnerText}</strong>`;
        } else {
            const marker = currentPlayer === 1 ? 'Crimson' : 'Gold';
            turnText.innerHTML = `Current Turn: <strong>${playerNames[currentPlayer]} (${marker})</strong>`;
        }
    }
}

/* =========================================================================
   5. TWO-OPTION SEQUENTIAL BODY-PART + ACTION LOGIC
   ========================================================================= */

   function showChallengeChoices() {
    awaitingChoice = true;

    const card = document.getElementById('challenge-card');
    const title = document.getElementById('challenge-title');
    const subtitle = document.getElementById('challenge-subtitle');
    const btnA = document.getElementById('option-a-btn');
    const btnB = document.getElementById('option-b-btn');
    const closeBtn = document.getElementById('close-challenge-btn');

    const winner = currentPlayer;
    const loser = currentPlayer === 1 ? 2 : 1;

    const boxNumberForPlayer = playerBoxStep[winner];
    playerBoxStep[winner]++;

    const [optionA, optionB] = getGridSequenceOptions(gridBoxes, boxNumberForPlayer);

    if (title) {
        title.innerText = `${playerNames[winner]} Completed Box #${playerBoxStep[winner]}!`;
    }
    if (subtitle) {
        subtitle.innerText = `${playerNames[loser]}, choose one zone and action to perform on ${playerNames[winner]}:`;
    }

    btnA.innerHTML = `<strong>${optionA.zoneLabel}:</strong> ${optionA.action}`;
    btnB.innerHTML = `<strong>${optionB.zoneLabel}:</strong> ${optionB.action}`;

    btnA.onclick = () => selectOption(optionA);
    btnB.onclick = () => selectOption(optionB);

    btnA.style.display = 'block';
    btnB.style.display = 'block';
    if (closeBtn) closeBtn.classList.add('hidden');
    if (card) card.classList.remove('hidden');
}

function getGridSequenceOptions(size, boxNumberForPlayer) {
    const categoryData = challengeDatabase[selectedIntensity] || {};
    const availableZones = Object.keys(categoryData).filter(
        z => Array.isArray(categoryData[z]) && categoryData[z].length > 0
    );

    const orderList = GRID_PAIR_ORDERS[size] || GRID_PAIR_ORDERS[6];
    const pairNumber = orderList[boxNumberForPlayer % orderList.length];
    const scheduledPair = NUMBERED_ZONE_PAIRS[pairNumber] || NUMBERED_ZONE_PAIRS[1];

    let zoneA = scheduledPair[0];
    let zoneB = scheduledPair[1];

    if (availableZones.length >= 2) {
        if (!availableZones.includes(zoneA)) {
            zoneA = availableZones[boxNumberForPlayer % availableZones.length];
        }
        if (!availableZones.includes(zoneB) || zoneB === zoneA) {
            zoneB = availableZones.find(z => z !== zoneA) || availableZones[(boxNumberForPlayer + 1) % availableZones.length];
        }
    }

    return [
        {
            zoneKey: zoneA,
            zoneLabel: ZONE_LABELS[zoneA] || formatZoneName(zoneA),
            action: pickPromptFromZone(categoryData, zoneA)
        },
        {
            zoneKey: zoneB,
            zoneLabel: ZONE_LABELS[zoneB] || formatZoneName(zoneB),
            action: pickPromptFromZone(categoryData, zoneB)
        }
    ];
}

function getSequentialZoneOptions(pairIndex) {
    const categoryData = challengeDatabase[selectedIntensity] || {};
    const availableZones = Object.keys(categoryData).filter(
        z => Array.isArray(categoryData[z]) && categoryData[z].length > 0
    );

    const scheduledPair = ZONE_SEQUENCE[pairIndex % ZONE_SEQUENCE.length];
    let zoneA = scheduledPair[0];
    let zoneB = scheduledPair[1];

    if (availableZones.length >= 2) {
        if (!availableZones.includes(zoneA)) {
            zoneA = availableZones[pairIndex % availableZones.length];
        }
        if (!availableZones.includes(zoneB) || zoneB === zoneA) {
            zoneB = availableZones.find(z => z !== zoneA) || availableZones[(pairIndex + 1) % availableZones.length];
        }
    }

    return [
        {
            zoneKey: zoneA,
            zoneLabel: ZONE_LABELS[zoneA] || formatZoneName(zoneA),
            action: pickPromptFromZone(categoryData, zoneA)
        },
        {
            zoneKey: zoneB,
            zoneLabel: ZONE_LABELS[zoneB] || formatZoneName(zoneB),
            action: pickPromptFromZone(categoryData, zoneB)
        }
    ];
}

function pickPromptFromZone(categoryData, zoneKey) {
    const list = categoryData[zoneKey];
    if (!Array.isArray(list) || list.length === 0) {
        return 'Give your partner a slow, attentive 30-second touch.';
    }

    const unused = list.filter(prompt => !usedPrompts.has(`${selectedIntensity}:${zoneKey}:${prompt}`));
    const pool = unused.length > 0 ? unused : list;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    usedPrompts.add(`${selectedIntensity}:${zoneKey}:${chosen}`);
    return chosen;
}

function formatZoneName(key) {
    return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function selectOption(chosenOption) {
    const subtitle = document.getElementById('challenge-subtitle');
    const btnA = document.getElementById('option-a-btn');
    const btnB = document.getElementById('option-b-btn');
    const closeBtn = document.getElementById('close-challenge-btn');

    btnA.style.display = 'none';
    btnB.style.display = 'none';

    if (subtitle) {
        subtitle.innerHTML = `<strong>${chosenOption.zoneLabel}:</strong><br>${chosenOption.action}`;
    }

    if (closeBtn) {
        closeBtn.classList.remove('hidden');
    }
}

function closeModal() {
    awaitingChoice = false;
    const card = document.getElementById('challenge-card');
    if (card) {
        card.classList.add('hidden');
    }
}