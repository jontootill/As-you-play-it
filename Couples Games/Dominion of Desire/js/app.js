let selectedTileId = null;
let currentOptions = [];
let chosenChallengeText = '';
let pendingIntensity = 'romantic';
let isTakeoverMove = false;
let turnActionMode = 'conquer'; // 'conquer' or 'fortify'

document.addEventListener('DOMContentLoaded', async () => {
  await window.cardManager.loadData();

  const resumeBtn = document.getElementById('resume-btn');
  if (resumeBtn && window.gameEngine.hasSavedGame()) {
    resumeBtn.classList.remove('hidden');
    resumeBtn.addEventListener('click', () => {
      if (window.gameEngine.loadState()) {
        turnActionMode = 'conquer';
        showGameScreen();
        renderBoard();
        updateUI();
      }
    });
  }

  const setupForm = document.getElementById('setup-form');
  if (setupForm) {
    setupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const p1Name = document.getElementById('p1-name')?.value || 'Player 1';
      const p2Name = document.getElementById('p2-name')?.value || 'Player 2';
      const intensity = document.querySelector('input[name="intensity"]:checked')?.value || 'romantic';

      window.gameEngine.init({ p1Name, p2Name, intensity });
      turnActionMode = 'conquer';

      showGameScreen();
      renderBoard();
      updateUI();
    });
  }

  document.getElementById('fortify-mode-btn')?.addEventListener('click', () => {
    turnActionMode = turnActionMode === 'fortify' ? 'conquer' : 'fortify';
    updateUI();
  });

  document.getElementById('end-turn-btn')?.addEventListener('click', () => {
    turnActionMode = 'conquer';
    window.gameEngine.switchTurn();
    updateUI();
  });

  document.getElementById('swap-challenge-btn')?.addEventListener('click', handleSwapOptions);
  document.getElementById('choice-a-btn')?.addEventListener('click', () => pickChallengeOption(0));
  document.getElementById('choice-b-btn')?.addEventListener('click', () => pickChallengeOption(1));
  document.getElementById('complete-challenge-btn')?.addEventListener('click', handleCompleteChallenge);
  document.getElementById('cancel-modal-btn')?.addEventListener('click', closeModal);

  document.getElementById('reset-campaign-btn')?.addEventListener('click', () => {
    window.gameEngine.clearSave();
    turnActionMode = 'conquer';
    document.getElementById('game-screen')?.classList.remove('active');
    document.getElementById('setup-screen')?.classList.add('active');
    if (resumeBtn) resumeBtn.classList.add('hidden');
  });
});

function showGameScreen() {
  document.getElementById('setup-screen')?.classList.remove('active');
  document.getElementById('game-screen')?.classList.add('active');
}

function renderBoard() {
  const boardContainer = document.getElementById('board-container');
  if (!boardContainer) return;
  boardContainer.innerHTML = '';

  const activeId = window.gameEngine.gameState.activePlayerId;
  const ownedIds = window.gameEngine.getOwnedTiles(activeId);

  for (const section of window.BODY_SECTIONS) {
    const secBlock = document.createElement('div');
    secBlock.className = 'body-section';

    const gatedLock = section.isGated && !window.gameEngine.isSection6Unlocked(activeId);
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <span>${section.name}</span>
      <span class="majority-pill">Majority: ${section.majorityNeeded}/${section.tiles.length}${gatedLock ? ' · Locked' : ''}</span>
    `;
    secBlock.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'section-tiles-grid';

    for (const tile of section.tiles) {
      const st = window.gameEngine.gameState.tileState[tile.id] || { owner: null, fortifyLevel: 0 };
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tile';
      btn.dataset.tileId = tile.id;

      if (st.owner === 1 || st.owner === 2) {
        const fortLv = Math.max(1, st.fortifyLevel || 1);
        btn.classList.add(`owned-p${st.owner}`, `fort-${fortLv}`);
      }

      const selectable = turnActionMode === 'fortify'
        ? window.gameEngine.canFortifyTile(tile.id, activeId)
        : window.gameEngine.canSelectTile(tile.id, activeId);

      if (selectable) btn.classList.add('selectable');
      else btn.classList.add('locked');

      const isAdjacent = ownedIds.some(ownedId => {
        const ownedMeta = window.gameEngine.getTileMeta(ownedId);
        return ownedMeta && Array.isArray(ownedMeta.tile.neighbors) && ownedMeta.tile.neighbors.includes(tile.id);
      });

      const isOpponentTile = st.owner !== null && st.owner !== activeId;
      let statusText = 'Out of Reach';

      if (turnActionMode === 'fortify') {
        if (selectable) {
          statusText = `Fortify -> Lv. ${(st.fortifyLevel || 1) + 1}`;
        } else if (st.owner === activeId) {
          statusText = 'Owned (Max Lv. 3)';
        } else {
          statusText = st.owner ? `P${st.owner} Tile` : 'Open';
        }
      } else if (selectable) {
        if (isOpponentTile) {
          statusText = `Contest (P${st.owner} · Lv. ${Math.max(1, st.fortifyLevel || 1)})`;
        } else {
          statusText = ownedIds.length === 0 ? 'Starting Tile' : 'Available · Adj';
        }
      } else if (section.isGated && !window.gameEngine.isSection6Unlocked(activeId)) {
        statusText = 'Locked (Need Section Majority)';
      } else if (st.owner === activeId) {
        statusText = `Owned (Lv. ${Math.max(1, st.fortifyLevel || 1)})`;
      } else if (isAdjacent) {
        statusText = 'Adjacent';
      }

      btn.innerHTML = `
        <span class="tile-label">${tile.name}</span>
        <span class="tile-meta">${statusText}</span>
      `;

      btn.addEventListener('click', () => handleTileClick(tile.id, tile.name));
      grid.appendChild(btn);
    }

    secBlock.appendChild(grid);
    boardContainer.appendChild(secBlock);
  }
}

function handleTileClick(tileId, tileName) {
  const activeId = window.gameEngine.gameState.activePlayerId;

  if (turnActionMode === 'fortify') {
    if (window.gameEngine.fortifyTileAndEndTurn(tileId, activeId)) {
      turnActionMode = 'conquer';
      renderBoard();
      updateUI();
    }
    return;
  }

  if (!window.gameEngine.canSelectTile(tileId, activeId)) return;

  const st = window.gameEngine.gameState.tileState[tileId];
  selectedTileId = tileId;
  isTakeoverMove = st.owner !== null && st.owner !== activeId;
  pendingIntensity = window.gameEngine.getEffectiveIntensity(tileId);
  chosenChallengeText = '';

  currentOptions = window.cardManager.getTwoOptionsForTile(tileId, tileName, pendingIntensity);
  openChallengeModal(tileName);
}

function openChallengeModal(tileName) {
  const activePlayer = window.gameEngine.getActivePlayer();
  const st = window.gameEngine.gameState.tileState[selectedTileId];
  const lv = Math.max(1, st?.fortifyLevel || 1);
  const isFortified = lv >= 2;

  document.getElementById('modal-tile-title').innerText = tileName;
  document.getElementById('modal-intensity-tag').innerText = isFortified
    ? `${pendingIntensity.toUpperCase()} · LV. ${lv} · 2X DURATION`
    : `${pendingIntensity.toUpperCase()} · LV. 1`;

  const durationNote = isFortified
    ? ' Fortified tile: double the time/duration!'
    : '';

  if (isTakeoverMove) {
    document.getElementById('modal-direction-text').innerText =
      `Takeover: choose a challenge, then pay 1 currency to receive it on ${activePlayer.name} or give it for free.${durationNote}`;
  } else {
    document.getElementById('modal-direction-text').innerText =
      `Claiming open territory: your partner performs your chosen challenge on ${activePlayer.name}.${durationNote}`;
  }

  document.getElementById('choice-a-btn').innerText = currentOptions[0];
  document.getElementById('choice-b-btn').innerText = currentOptions[1];

  document.getElementById('challenge-options').classList.remove('hidden');
  document.getElementById('selected-challenge-box').classList.add('hidden');
  document.getElementById('complete-challenge-btn').classList.add('hidden');

  const swapBtn = document.getElementById('swap-challenge-btn');
  if (swapBtn) {
    swapBtn.classList.remove('hidden');
    swapBtn.disabled = activePlayer.currency < 1;
  }

  document.getElementById('card-modal')?.classList.add('active');
}

function handleSwapOptions() {
  const activePlayer = window.gameEngine.getActivePlayer();
  if (!window.gameEngine.spendCurrency(activePlayer.id, 1)) return;

  const meta = window.gameEngine.getTileMeta(selectedTileId);
  currentOptions = window.cardManager.getTwoOptionsForTile(
    selectedTileId,
    meta ? meta.tile.name : selectedTileId,
    pendingIntensity
  );

  document.getElementById('choice-a-btn').innerText = currentOptions[0];
  document.getElementById('choice-b-btn').innerText = currentOptions[1];
  updateUI();
}

function pickChallengeOption(index) {
  const activePlayer = window.gameEngine.getActivePlayer();
  chosenChallengeText = currentOptions[index] || currentOptions[0];
  document.getElementById('modal-task-text').innerText = chosenChallengeText;
  document.getElementById('challenge-options').classList.add('hidden');
  document.getElementById('swap-challenge-btn')?.classList.add('hidden');
  document.getElementById('selected-challenge-box').classList.remove('hidden');

  const completeBtn = document.getElementById('complete-challenge-btn');
  if (completeBtn) {
    completeBtn.classList.remove('hidden');
    if (isTakeoverMove) {
      completeBtn.innerText = activePlayer.currency >= 1
        ? 'Complete Takeover (Give Challenge · 0 Currency)'
        : 'Complete Takeover (Give Challenge)';
    } else {
      completeBtn.innerText = 'Complete Claim (+1 Currency)';
    }
  }

  // On a takeover, offer a second button to pay 1 currency and receive the challenge instead
  let payReceiveBtn = document.getElementById('pay-receive-btn');
  if (!payReceiveBtn) {
    payReceiveBtn = document.createElement('button');
    payReceiveBtn.type = 'button';
    payReceiveBtn.id = 'pay-receive-btn';
    payReceiveBtn.className = 'btn-secondary';
    completeBtn?.parentNode?.insertBefore(payReceiveBtn, completeBtn.nextSibling);
  }

  if (isTakeoverMove) {
    payReceiveBtn.classList.remove('hidden');
    payReceiveBtn.disabled = activePlayer.currency < 1;
    payReceiveBtn.innerText = 'Pay 1 Currency & Receive Challenge';
    payReceiveBtn.onclick = () => finalizeChallenge(true);
  } else {
    payReceiveBtn.classList.add('hidden');
  }
}

function handleCompleteChallenge() {
  finalizeChallenge(false);
}

function finalizeChallenge(paidToReceive) {
  const activeId = window.gameEngine.gameState.activePlayerId;
  const ok = window.gameEngine.completeTileConquest(selectedTileId, activeId, paidToReceive);
  if (!ok) return;

  turnActionMode = 'conquer';
  closeModal();
  renderBoard();
  updateUI();
}

function closeModal() {
  selectedTileId = null;
  document.getElementById('pay-receive-btn')?.classList.add('hidden');
  document.getElementById('card-modal')?.classList.remove('active');
}

function updateUI() {
  const gs = window.gameEngine.gameState;
  const activePlayer = window.gameEngine.getActivePlayer();
  const turnBadge = document.getElementById('turn-badge');
  const hintEl = document.getElementById('action-hint');
  const fortifyBar = document.getElementById('fortify-bar');
  const fortifyBtn = document.getElementById('fortify-mode-btn');

  if (turnBadge && activePlayer) {
    turnBadge.className = `turn-badge p${activePlayer.id}-turn`;
    if (gs.isGameOver) {
      const winner = gs.players[gs.winnerId];
      turnBadge.innerText = `${winner ? winner.name : 'Player'} Claims Full-Body Dominion!`;
    } else {
      turnBadge.innerText = `${activePlayer.name}'s Turn`;
    }
  }

  for (const pid of [1, 2]) {
    const p = gs.players[pid];
    const secs = window.gameEngine.getControlledSections(pid).length;
    const el = document.getElementById(`p${pid}-stats`);
    if (el && p) {
      el.innerText = `${p.name}: ${p.currency} Currency | ${secs}/6 Sections`;
    }
  }

  if (hintEl && activePlayer) {
    if (gs.isGameOver) {
      hintEl.innerText = 'Campaign complete — all 6 sections controlled.';
    } else if (turnActionMode === 'fortify') {
      hintEl.innerText = `${activePlayer.name}: tap one of your Lv. 1 or Lv. 2 tiles to fortify it for 1 currency (ends turn).`;
    } else {
      const ownedCount = window.gameEngine.getOwnedTiles(activePlayer.id).length;
      hintEl.innerText = ownedCount === 0
        ? `${activePlayer.name}: pick a starting tile in an unlocked section, or fortify an owned tile.`
        : `${activePlayer.name}: pick an adjacent tile to claim/contest, or fortify an owned tile.`;
    }
  }

if (fortifyBar) {
    fortifyBar.classList.toggle('hidden', Boolean(gs.isGameOver));
  }
  }
  if (fortifyBtn && activePlayer) {
    const hasFortifiable = window.gameEngine.getOwnedTiles(activePlayer.id).some(
      id => window.gameEngine.canFortifyTile(id, activePlayer.id)
    );
    fortifyBtn.disabled = !hasFortifiable;
    fortifyBtn.innerText = turnActionMode === 'fortify' ? 'Back to Tile Conquest' : 'Fortify Tile (1 Currency)';
  }

  renderBoard();
