let challengesData = [];
let modifiersData = [];
let selectedIntensity = 'romantic';
let isRolling = false;

document.addEventListener('DOMContentLoaded', () => {
  const setupForm = document.getElementById('setup-form');
  const rollBtn = document.getElementById('roll-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');

  if (setupForm) {
    setupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const p1Name = document.getElementById('p1-name')?.value || 'Player 1';
      const p2Name = document.getElementById('p2-name')?.value || 'Player 2';

      const intensityRadio = document.querySelector('input[name="intensity"]:checked');
      if (intensityRadio) {
        selectedIntensity = intensityRadio.value;
      }

      await loadGameData();

      if (window.gameEngine && typeof window.gameEngine.init === 'function') {
        window.gameEngine.init({ p1Name, p2Name });
      }

      document.getElementById('setup-screen')?.classList.remove('active');
      document.getElementById('game-screen')?.classList.add('active');

      renderBoard();
      updateUI();
    });
  }

  if (rollBtn) {
    rollBtn.addEventListener('click', handleRoll);
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      const modalOverlay = document.getElementById('card-modal');
      if (modalOverlay) modalOverlay.classList.remove('active');

      if (window.gameEngine) {
        const activePlayer = window.gameEngine.getActivePlayer();
        if (activePlayer) {
          window.gameEngine.claimTile(activePlayer.position, activePlayer.id);
        }

        window.gameEngine.checkWinCondition();
        if (!window.gameEngine.gameState.isGameOver) {
          window.gameEngine.switchTurn();
        } else {
          alert(`Game Over! ${activePlayer ? activePlayer.name : 'Player'} reached the end!`);
        }
      }

      // Re-enable roll button safely
      isRolling = false;
      const btn = document.getElementById('roll-btn');
      if (btn) btn.disabled = false;

      updateUI();
    });
  }
});

// Load JSON safely from assets/data
async function loadGameData() {
  try {
    const challengesRes = await fetch('assets/data/challenges.json');
    if (challengesRes.ok) challengesData = await challengesRes.json();
  } catch (err) {
    console.error('Error loading challenges:', err);
  }

  try {
    const modifiersRes = await fetch('assets/data/modifiers.json');
    if (modifiersRes.ok) modifiersData = await modifiersRes.json();
  } catch (err) {
    console.error('Error loading modifiers:', err);
  }
}

// Render grid board (18 tiles)
function renderBoard() {
  const boardContainer = document.getElementById('board-container');
  if (!boardContainer) return;
  boardContainer.innerHTML = '';

  for (let i = 0; i < 18; i++) {
    const tileNum = i + 1;
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.tileId = `tile_${tileNum}`;

    const data = challengesData[i];
    const tileLabel = (data && data.tile_name) ? data.tile_name : `Tile ${tileNum}`;
    tile.dataset.tileName = tileLabel;

    tile.innerHTML = `
      <span class="tile-number">#${tileNum}</span>
      <span class="tile-label">${tileLabel}</span>
      <div class="player-markers" id="markers-tile-${tileNum}"></div>
      <div class="owner-badge" id="owner-tile-${tileNum}"></div>
    `;

    boardContainer.appendChild(tile);
  }
}

// Handle Roll & Position Calculation
function handleRoll() {
  if (isRolling) return;
  isRolling = true;

  const diceDisplay = document.getElementById('dice-display');
  const rollBtn = document.getElementById('roll-btn');
  if (rollBtn) rollBtn.disabled = true;

  let count = 0;
  const interval = setInterval(() => {
    const tempVal = Math.floor(Math.random() * 3) + 1;
    if (diceDisplay) diceDisplay.innerText = tempVal;
    count++;

    if (count > 8) {
      clearInterval(interval);

      try {
        let finalRoll = 1;
        let landedPos = 1;

        if (window.gameEngine) {
          finalRoll = window.gameEngine.rollDie();
          const moveResult = window.gameEngine.movePlayer(finalRoll);
          landedPos = moveResult.newPosition;
        }

        if (diceDisplay) diceDisplay.innerText = finalRoll;

        updateUI();

        // Show card modal after rolling finishes
        setTimeout(() => {
          showCardModal(landedPos);
        }, 200);

      } catch (err) {
        console.error('Error during movement step:', err);
        // Fallback: unlock button if something fails unexpectedly
        isRolling = false;
        if (rollBtn) rollBtn.disabled = false;
      }
    }
  }, 75);
}

function getRandomItem(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Display Challenge Card Modal
function showCardModal(tileIndex) {
  const challengeObj = challengesData[tileIndex - 1] || challengesData[0];

  let taskText = 'No challenge found for this tile.';

  if (challengeObj && challengeObj.variants && challengeObj.variants[selectedIntensity]) {
    const variant = challengeObj.variants[selectedIntensity];
    const taskPool = variant.takeover_challenge || variant.rent_task || [];
    taskText = getRandomItem(taskPool) || taskText;
  }

  const modalTitle = document.getElementById('modal-tile-title');
  const modalTag = document.getElementById('modal-intensity-tag');
  const modalText = document.getElementById('modal-task-text');

  if (modalTitle) modalTitle.innerText = challengeObj ? challengeObj.tile_name : `Tile #${tileIndex}`;
  if (modalTag) modalTag.innerText = selectedIntensity.toUpperCase();
  if (modalText) modalText.innerText = taskText;

  renderModifierSection();

  const modalOverlay = document.getElementById('card-modal');
  if (modalOverlay) modalOverlay.classList.add('active');
}

// Render modifier button inside card modal
function renderModifierSection() {
  let modBox = document.getElementById('modal-modifier-box');

  if (!modBox) {
    const cardContent = document.querySelector('#card-modal .modal-content') || document.getElementById('card-modal');
    if (!cardContent) return;

    const container = document.createElement('div');
    container.style.margin = '10px 0';
    container.style.textAlign = 'center';

    const modBtn = document.createElement('button');
    modBtn.type = 'button';
    modBtn.className = 'btn-secondary';
    modBtn.innerText = 'Draw Modifier Card';
    modBtn.style.padding = '6px 12px';
    modBtn.style.cursor = 'pointer';

    modBox = document.createElement('div');
    modBox.id = 'modal-modifier-box';
    modBox.style.marginTop = '8px';
    modBox.style.fontSize = '0.85em';
    modBox.style.color = '#ffd700';

    modBtn.addEventListener('click', () => {
      if (modifiersData && modifiersData.length > 0) {
        const mod = getRandomItem(modifiersData);
        modBox.innerText = `Modifier: ${mod.name} — ${mod.description}`;
      } else {
        modBox.innerText = 'No modifiers loaded.';
      }
    });

    container.appendChild(modBtn);
    container.appendChild(modBox);

    const closeModalBtn = document.getElementById('close-modal-btn');
    if (closeModalBtn && closeModalBtn.parentNode) {
      closeModalBtn.parentNode.insertBefore(container, closeModalBtn);
    } else {
      cardContent.appendChild(container);
    }
  } else {
    modBox.innerText = '';
  }
}

// Update Player Tokens & Ownership Badges safely
function updateUI() {
  if (!window.gameEngine || !window.gameEngine.gameState) return;

  const activePlayer = window.gameEngine.getActivePlayer();
  const turnBadge = document.getElementById('turn-badge');

  if (turnBadge && activePlayer) {
    turnBadge.innerText = `${activePlayer.name}'s Turn`;
  }

  // Safely clear markers
  document.querySelectorAll('.player-markers').forEach(el => el.innerHTML = '');

  const p1Pos = window.gameEngine.gameState.players[1]?.position || 1;
  const p2Pos = window.gameEngine.gameState.players[2]?.position || 1;

  // Render P1 Token
  const p1Box = document.getElementById(`markers-tile-${p1Pos}`);
  if (p1Box) {
    const badge = document.createElement('span');
    badge.className = 'player-token token-p1';
    badge.innerText = 'P1';
    p1Box.appendChild(badge);
  }

  // Render P2 Token
  const p2Box = document.getElementById(`markers-tile-${p2Pos}`);
  if (p2Box) {
    const badge = document.createElement('span');
    badge.className = 'player-token token-p2';
    badge.innerText = 'P2';
    p2Box.appendChild(badge);
  }

  // Render Ownership Badges
  const tileOwners = window.gameEngine.gameState.tileOwners || {};
  for (let tileNum = 1; tileNum <= 18; tileNum++) {
    const ownerBox = document.getElementById(`owner-tile-${tileNum}`);
    if (ownerBox) {
      if (tileOwners[tileNum] === 1) {
        ownerBox.className = 'owner-badge owned-p1';
        ownerBox.innerText = 'P1';
      } else if (tileOwners[tileNum] === 2) {
        ownerBox.className = 'owner-badge owned-p2';
        ownerBox.innerText = 'P2';
      } else {
        ownerBox.className = 'owner-badge';
        ownerBox.innerText = '';
      }
    }
  }
}