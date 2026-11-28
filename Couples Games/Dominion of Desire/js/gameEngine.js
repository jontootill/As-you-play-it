const STORAGE_KEY = 'dominion_of_desire_save_v1';

const BODY_SECTIONS = [
  {
    id: 'head_neck',
    name: 'Head & Neck',
    majorityNeeded: 3,
    unlocksSection6: false,
    tiles: [
      { id: 'tile_1', name: 'Scalp & Crown', neighbors: ['tile_2', 'tile_3', 'tile_5', 'tile_6'] },
      { id: 'tile_2', name: 'Forehead & Temples', neighbors: ['tile_1', 'tile_3', 'tile_4'] },
      { id: 'tile_3', name: 'Ears & Jawline', neighbors: ['tile_1', 'tile_2', 'tile_4', 'tile_5'] },
      { id: 'tile_4', name: 'Throat & Front Neck', neighbors: ['tile_2', 'tile_3', 'tile_5', 'tile_11'] },
      { id: 'tile_5', name: 'Nape & Back of Neck', neighbors: ['tile_1', 'tile_3', 'tile_4', 'tile_6', 'tile_15'] }
    ]
  },
  {
    id: 'shoulders_arms',
    name: 'Shoulders & Arms',
    majorityNeeded: 4,
    unlocksSection6: false,
    tiles: [
      { id: 'tile_6', name: 'Left Shoulder', neighbors: ['tile_1', 'tile_5', 'tile_8', 'tile_12', 'tile_15'] },
      { id: 'tile_7', name: 'Right Shoulder', neighbors: ['tile_4', 'tile_9', 'tile_13', 'tile_15'] },
      { id: 'tile_8', name: 'Left Upper Arm', neighbors: ['tile_6', 'tile_10', 'tile_12'] },
      { id: 'tile_9', name: 'Right Upper Arm', neighbors: ['tile_7', 'tile_11', 'tile_13'] },
      { id: 'tile_10', name: 'Left Forearm & Wrist', neighbors: ['tile_8', 'tile_12'] },
      { id: 'tile_11', name: 'Hands & Fingers', neighbors: ['tile_4', 'tile_9', 'tile_13'] }
    ]
  },
  {
    id: 'chest_torso',
    name: 'Chest & Upper Torso',
    majorityNeeded: 3,
    unlocksSection6: true,
    tiles: [
      { id: 'tile_12', name: 'Left Chest', neighbors: ['tile_6', 'tile_8', 'tile_10', 'tile_13', 'tile_16'] },
      { id: 'tile_13', name: 'Right Chest', neighbors: ['tile_7', 'tile_9', 'tile_11', 'tile_12', 'tile_17'] },
      { id: 'tile_14', name: 'Sternum & Collarbone', neighbors: ['tile_4', 'tile_12', 'tile_13', 'tile_16'] },
      { id: 'tile_15', name: 'Upper Back & Blades', neighbors: ['tile_5', 'tile_6', 'tile_7', 'tile_18'] },
      { id: 'tile_16', name: 'Ribs & Sides', neighbors: ['tile_12', 'tile_14', 'tile_17', 'tile_19'] }
    ]
  },
  {
    id: 'waist_lower_back',
    name: 'Waist & Lower Back',
    majorityNeeded: 3,
    unlocksSection6: false,
    tiles: [
      { id: 'tile_17', name: 'Stomach & Navel', neighbors: ['tile_13', 'tile_16', 'tile_19', 'tile_20'] },
      { id: 'tile_18', name: 'Mid & Lower Back', neighbors: ['tile_15', 'tile_19', 'tile_21', 'tile_22'] },
      { id: 'tile_19', name: 'Waist & Flanks', neighbors: ['tile_16', 'tile_17', 'tile_18', 'tile_20', 'tile_27'] },
      { id: 'tile_20', name: 'Lower Abdomen', neighbors: ['tile_17', 'tile_19', 'tile_27'] },
      { id: 'tile_21', name: 'Sacrum & Dimples', neighbors: ['tile_18', 'tile_22', 'tile_29'] }
    ]
  },
  {
    id: 'hips_legs',
    name: 'Hips, Thighs & Legs',
    majorityNeeded: 4,
    unlocksSection6: true,
    tiles: [
      { id: 'tile_22', name: 'Left Hip & Glute', neighbors: ['tile_18', 'tile_21', 'tile_24', 'tile_29'] },
      { id: 'tile_23', name: 'Right Hip & Glute', neighbors: ['tile_19', 'tile_25', 'tile_27', 'tile_29'] },
      { id: 'tile_24', name: 'Outer Thighs', neighbors: ['tile_22', 'tile_25', 'tile_26'] },
      { id: 'tile_25', name: 'Inner Thighs', neighbors: ['tile_23', 'tile_24', 'tile_27', 'tile_28'] },
      { id: 'tile_26', name: 'Knees & Calves', neighbors: ['tile_24', 'tile_26_foot'] },
      { id: 'tile_26_foot', name: 'Ankles & Feet', neighbors: ['tile_26'] }
    ]
  },
  {
    id: 'pelvis_intimate',
    name: 'Pelvis & Intimate Zones',
    majorityNeeded: 3,
    unlocksSection6: false,
    isGated: true,
    tiles: [
      { id: 'tile_27', name: 'Front Hip Crease', neighbors: ['tile_19', 'tile_20', 'tile_23', 'tile_25', 'tile_28'] },
      { id: 'tile_28', name: 'Lower Pelvis', neighbors: ['tile_25', 'tile_27', 'tile_30', 'tile_31'] },
      { id: 'tile_29', name: 'Rear Crease & Seat', neighbors: ['tile_21', 'tile_22', 'tile_23', 'tile_30'] },
      { id: 'tile_30', name: 'Outer Intimate Zone', neighbors: ['tile_28', 'tile_29', 'tile_31'] },
      { id: 'tile_31', name: 'Inner Intimate Core', neighbors: ['tile_27', 'tile_28', 'tile_30'] }
    ]
  }
];

window.BODY_SECTIONS = BODY_SECTIONS;

window.gameEngine = {
  gameState: {
    players: {
      1: { id: 1, name: 'Player 1', currency: 0 },
      2: { id: 2, name: 'Player 2', currency: 0 }
    },
    activePlayerId: 1,
    baseIntensity: 'romantic',
    tileState: {},
    isGameOver: false,
    winnerId: null
  },

  init(config = {}) {
    const p1Name = (config.p1Name || 'Player 1').trim() || 'Player 1';
    const p2Name = (config.p2Name || 'Player 2').trim() || 'Player 2';

    const tileState = {};
    for (const sec of BODY_SECTIONS) {
      for (const t of sec.tiles) {
        tileState[t.id] = { owner: null, fortifyLevel: 0 };
      }
    }

    this.gameState = {
      players: {
        1: { id: 1, name: p1Name, currency: 0 },
        2: { id: 2, name: p2Name, currency: 0 }
      },
      activePlayerId: 1,
      tileState,
      isGameOver: false,
      winnerId: null
    };

    this.saveState();
  },

  getBoardBaseIntensity() {
    const p1Secs = this.getControlledSections(1).length;
    const p2Secs = this.getControlledSections(2).length;
    const totalControlled = p1Secs + p2Secs;
    const sec6Open = this.isSection6Unlocked(1) || this.isSection6Unlocked(2);

    if (totalControlled >= 4 || sec6Open) return 'erotic';
    if (totalControlled >= 2) return 'sensual';
    return 'romantic';
  },



  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.gameState));
    } catch (e) {
      console.warn('Could not save game state:', e);
    }
  },

  hasSavedGame() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Boolean(parsed && parsed.players && parsed.tileState && !parsed.isGameOver);
    } catch (e) {
      return false;
    }
  },

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.players || !parsed.tileState) return false;
      this.gameState = parsed;
      return true;
    } catch (e) {
      console.warn('Could not load saved game:', e);
      return false;
    }
  },

  clearSave() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear saved game:', e);
    }
  },

  getActivePlayer() {
    return this.gameState.players[this.gameState.activePlayerId];
  },

  getTileMeta(tileId) {
    for (const sec of BODY_SECTIONS) {
      const found = sec.tiles.find(t => t.id === tileId);
      if (found) return { tile: found, section: sec };
    }
    return null;
  },

  getOwnedTiles(playerId) {
    return Object.entries(this.gameState.tileState)
      .filter(([, st]) => st.owner === playerId)
      .map(([id]) => id);
  },

  getControlledSections(playerId) {
    const controlled = [];
    for (const sec of BODY_SECTIONS) {
      const count = sec.tiles.filter(t => this.gameState.tileState[t.id]?.owner === playerId).length;
      if (count >= sec.majorityNeeded) {
        controlled.push(sec.id);
      }
    }
    return controlled;
  },

  isSection6Unlocked(playerId) {
    const controlled = this.getControlledSections(playerId);
    return BODY_SECTIONS.some(sec => sec.unlocksSection6 && controlled.includes(sec.id));
  },

  canSelectTile(tileId, playerId = this.gameState.activePlayerId) {
    if (this.gameState.isGameOver) return false;
    const meta = this.getTileMeta(tileId);
    if (!meta) return false;

    const { tile, section } = meta;
    const st = this.gameState.tileState[tileId];

    if (st.owner === playerId) return false;

    if (section.isGated && !this.isSection6Unlocked(playerId)) {
      return false;
    }

    const ownedIds = this.getOwnedTiles(playerId);
    if (ownedIds.length === 0) {
      return st.owner === null;
    }

    return ownedIds.some(ownedId => {
      const ownedMeta = this.getTileMeta(ownedId);
      return ownedMeta && Array.isArray(ownedMeta.tile.neighbors) && ownedMeta.tile.neighbors.includes(tileId);
    });
  },

  getEffectiveIntensity(tileId) {
    const st = this.gameState.tileState[tileId] || { fortifyLevel: 0 };
    const tiers = ['romantic', 'sensual', 'erotic'];
    const baseTier = this.getBoardBaseIntensity();
    const baseIdx = Math.max(0, tiers.indexOf(baseTier));
    const bonusTiers = st.fortifyLevel >= 3 ? 2 : (st.fortifyLevel === 2 ? 1 : 0);
    return tiers[Math.min(tiers.length - 1, baseIdx + bonusTiers)];
  },

  canFortifyTile(tileId, playerId = this.gameState.activePlayerId) {
    if (this.gameState.isGameOver) return false;
    const player = this.gameState.players[playerId];
    const st = this.gameState.tileState[tileId];
    if (!player || !st) return false;
    return st.owner === playerId && st.fortifyLevel < 3 && player.currency >= 1;
  },

  // Primary turn action A: Claim or take over a tile (+1 currency earned, ends turn after completion)
  completeTileConquest(tileId, playerId, paidToReceive = false) {
    const st = this.gameState.tileState[tileId];
    const player = this.gameState.players[playerId];
    if (!st || !player) return false;

    if (paidToReceive) {
      if (player.currency < 1) return false;
      player.currency -= 1;
    }

    st.owner = playerId;
    st.fortifyLevel = 1;
    player.currency += 1;

    this.checkWinCondition();
    if (!this.gameState.isGameOver) {
      this.switchTurn();
    } else {
      this.saveState();
    }
    return true;
  },

  // Primary turn action B: Fortify an owned tile for 1 currency (ends turn)
  fortifyTileAndEndTurn(tileId, playerId = this.gameState.activePlayerId) {
    if (!this.canFortifyTile(tileId, playerId)) return false;
    this.gameState.players[playerId].currency -= 1;
    this.gameState.tileState[tileId].fortifyLevel += 1;
    this.switchTurn();
    return true;
  },

  spendCurrency(playerId, amount = 1) {
    const player = this.gameState.players[playerId];
    if (!player || player.currency < amount) return false;
    player.currency -= amount;
    this.saveState();
    return true;
  },

  checkWinCondition() {
    for (const pid of [1, 2]) {
      const controlled = this.getControlledSections(pid);
      if (controlled.length >= BODY_SECTIONS.length) {
        this.gameState.isGameOver = true;
        this.gameState.winnerId = pid;
        this.saveState();
        return;
      }
    }
  },

  switchTurn() {
    if (this.gameState.isGameOver) return;
    this.gameState.activePlayerId = this.gameState.activePlayerId === 1 ? 2 : 1;
    this.saveState();
  }
};