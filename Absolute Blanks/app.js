// State Management
let scenariosData = [];
let selectedScenario = null;
let totalPlayers = 2;
let selectedStoryLength = 3;
let players = []; 
let currentPassIndex = 0;
let allBlanksToFill = [];
let userAnswers = {};
let currentRevealActIndex = 0;

const PRONOUN_MAPS = {
  he: { 'name': '', 'he/she/they': 'he', 'his/her/their': 'his', 'him/her/them': 'him', 'his/hers/theirs': 'his' },
  she: { 'name': '', 'he/she/they': 'she', 'his/her/their': 'her', 'him/her/them': 'her', 'his/hers/theirs': 'hers' },
  they: { 'name': '', 'he/she/they': 'they', 'his/her/their': 'their', 'him/her/them': 'them', 'his/hers/theirs': 'theirs' }
};

// DOM Elements
const screenSetup = document.getElementById('screen-setup');
const screenPass = document.getElementById('screen-pass');
const screenInput = document.getElementById('screen-input');
const screenReveal = document.getElementById('screen-reveal');

const scenarioTitleDisplay = document.getElementById('scenario-title');
const scenarioDesc = document.getElementById('scenario-desc');
const btnShuffleScenario = document.getElementById('btn-shuffle-scenario');

const countButtons = document.querySelectorAll('.btn-count');
const lengthButtons = document.querySelectorAll('.btn-length');
const playerInputsContainer = document.getElementById('player-inputs-container');
const btnStartGame = document.getElementById('btn-start-game');

const passTitle = document.getElementById('pass-title');
const passInstruction = document.getElementById('pass-instruction');
const btnReady = document.getElementById('btn-ready');

const playerTurnBadge = document.getElementById('player-turn-badge');
const currentActTitle = document.getElementById('current-act-title');
const blanksContainer = document.getElementById('blanks-container');
const btnSubmitTurn = document.getElementById('btn-submit-turn');

const revealActBadge = document.getElementById('reveal-act-badge');
const revealActTitle = document.getElementById('reveal-act-title');
const revealActText = document.getElementById('reveal-act-text');
const btnPrevAct = document.getElementById('btn-prev-act');
const btnNextAct = document.getElementById('btn-next-act');
const btnPlayAgain = document.getElementById('btn-play-again');

document.addEventListener('DOMContentLoaded', () => {
  fetchScenarios();
  setupEventListeners();
  renderPlayerSetupInputs();
});

async function fetchScenarios() {
  try {
    const response = await fetch('stories.json');
    scenariosData = await response.json();
    shuffleScenario(); // Pick a random scenario on load!
  } catch (error) {
    console.error("Error loading stories.json:", error);
    scenarioTitleDisplay.textContent = "Error";
    scenarioDesc.textContent = "Failed to load stories.json file.";
  }
}

// Random Scenario Selector Function
function shuffleScenario() {
  if (scenariosData.length === 0) return;
  const randomIndex = Math.floor(Math.random() * scenariosData.length);
  selectedScenario = scenariosData[randomIndex];
  
  scenarioTitleDisplay.textContent = selectedScenario.title;
  scenarioDesc.textContent = selectedScenario.description;
}

function setupEventListeners() {
  btnShuffleScenario.addEventListener('click', shuffleScenario);

  countButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      countButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      totalPlayers = parseInt(btn.dataset.count, 10);
      renderPlayerSetupInputs();
    });
  });

  lengthButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      lengthButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedStoryLength = parseInt(btn.dataset.length, 10);
    });
  });

  btnStartGame.addEventListener('click', startGame);
  btnReady.addEventListener('click', showInputScreen);
  btnSubmitTurn.addEventListener('click', handleSubmitTurn);

  btnPrevAct.addEventListener('click', () => navigateReveal(-1));
  btnNextAct.addEventListener('click', () => navigateReveal(1));
  btnPlayAgain.addEventListener('click', resetToSetup);
}

function renderPlayerSetupInputs() {
  playerInputsContainer.innerHTML = '';
  for (let i = 0; i < totalPlayers; i++) {
    const row = document.createElement('div');
    row.className = 'player-row';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'input-control player-name-input';
    nameInput.placeholder = `Player ${i + 1} Name`;
    nameInput.value = `Player ${i + 1}`;

    const genderSelect = document.createElement('select');
    genderSelect.className = 'input-control player-gender-select';
    genderSelect.innerHTML = `
      <option value="he">He / Him</option>
      <option value="she">She / Her</option>
      <option value="they">They / Them</option>
    `;

    row.appendChild(nameInput);
    row.appendChild(genderSelect);
    playerInputsContainer.appendChild(row);
  }
}

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
}

function startGame() {
  players = [];
  const nameInputs = document.querySelectorAll('.player-name-input');
  const genderSelects = document.querySelectorAll('.player-gender-select');

  nameInputs.forEach((input, idx) => {
    players.push({
      name: input.value.trim() || `Player ${idx + 1}`,
      gender: genderSelects[idx].value
    });
  });

  userAnswers = {};
  currentPassIndex = 0;
  allBlanksToFill = [];

  let activeActs = [];

  if (selectedStoryLength === 3) {
    const totalAvailable = selectedScenario.acts.length;
    const firstAct = selectedScenario.acts[0];
    const middleAct = selectedScenario.acts[Math.floor(totalAvailable / 2)];
    const finalAct = selectedScenario.acts[totalAvailable - 1];
    activeActs = [firstAct, middleAct, finalAct];
  } else {
    activeActs = [...selectedScenario.acts];
  }

  activeActs = activeActs.map((act, idx) => ({
    ...act,
    displayActNumber: idx + 1
  }));

  activeActs.forEach(act => {
    act.blanks.forEach(blank => {
      allBlanksToFill.push({ ...blank, actTitle: act.actTitle });
    });
  });

  selectedScenario.activeActs = activeActs;

  showPassScreen();
}

function showPassScreen() {
  const pIndex = currentPassIndex % totalPlayers;
  const player = players[pIndex];
  passTitle.textContent = `Pass to ${player.name}`;
  passInstruction.innerHTML = `Hand the phone secretly to <strong>${player.name}</strong>.`;
  showScreen(screenPass);
}

function showInputScreen() {
  const pIndex = currentPassIndex % totalPlayers;
  const player = players[pIndex];
  playerTurnBadge.textContent = `${player.name}'s Turn`;

  const playerBlanks = allBlanksToFill.filter((_, index) => index % totalPlayers === pIndex);

  currentActTitle.textContent = `Fill Your Blanks (${playerBlanks.length})`;
  blanksContainer.innerHTML = '';

  playerBlanks.forEach(blank => {
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'blank-field-group';

    const label = document.createElement('label');
    label.className = 'blank-label';
    label.textContent = blank.label;

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-with-panic';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input-control';
    input.dataset.key = blank.key;
    input.placeholder = 'Type here...';

    const btnPanic = document.createElement('button');
    btnPanic.type = 'button';
    btnPanic.className = 'btn-panic';
    btnPanic.textContent = '🎲';
    btnPanic.title = 'Get a panic suggestion!';
    btnPanic.addEventListener('click', () => {
      const suggestions = blank.panicSuggestions;
      const randomChoice = suggestions[Math.floor(Math.random() * suggestions.length)];
      input.value = randomChoice;
    });

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(btnPanic);
    fieldGroup.appendChild(label);
    fieldGroup.appendChild(inputWrapper);

    blanksContainer.appendChild(fieldGroup);
  });

  showScreen(screenInput);
}

function handleSubmitTurn() {
  const inputs = blanksContainer.querySelectorAll('input');
  let missing = false;

  inputs.forEach(input => {
    if (!input.value.trim()) missing = true;
  });

  if (missing) {
    alert('Please fill in all blanks or hit 🎲!');
    return;
  }

  inputs.forEach(input => {
    userAnswers[input.dataset.key] = input.value.trim();
  });

  currentPassIndex++;

  if (currentPassIndex >= totalPlayers || Object.keys(userAnswers).length >= allBlanksToFill.length) {
    startRevealPhase();
  } else {
    showPassScreen();
  }
}

function startRevealPhase() {
  currentRevealActIndex = 0;
  renderRevealAct();
  showScreen(screenReveal);
}

function renderRevealAct() {
  const activeActs = selectedScenario.activeActs || selectedScenario.acts;
  const act = activeActs[currentRevealActIndex];
  
  const actNum = act.displayActNumber || act.actNumber;
  revealActBadge.textContent = `Act ${actNum} / ${activeActs.length}`;
  revealActTitle.textContent = act.actTitle;

  let formattedTemplate = act.template;

  const heroPlayer = players[0];
  const pMap = { ...PRONOUN_MAPS[heroPlayer.gender], name: heroPlayer.name };

  Object.keys(pMap).forEach(key => {
    const reg = new RegExp(`{${key}}`, 'gi');
    formattedTemplate = formattedTemplate.replace(reg, pMap[key]);
  });

  act.blanks.forEach(blank => {
    const val = userAnswers[blank.key] || '[BLANK]';
    const replacement = `<span class="filled-blank">${val}</span>`;
    formattedTemplate = formattedTemplate.replace(new RegExp(`{${blank.key}}`, 'g'), replacement);
  });

  revealActText.innerHTML = formattedTemplate;

  btnPrevAct.disabled = currentRevealActIndex === 0;
  if (currentRevealActIndex === activeActs.length - 1) {
    btnNextAct.classList.add('hidden');
    btnPlayAgain.classList.remove('hidden');
  } else {
    btnNextAct.classList.remove('hidden');
    btnPlayAgain.classList.add('hidden');
  }
}

function navigateReveal(direction) {
  currentRevealActIndex += direction;
  renderRevealAct();
}

function resetToSetup() {
  shuffleScenario(); // Pick a new random scenario when resetting!
  showScreen(screenSetup);
}