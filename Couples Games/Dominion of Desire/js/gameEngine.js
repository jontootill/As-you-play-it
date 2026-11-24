window.gameEngine = {
  gameState: {
    players: {
      1: { id: 1, name: 'Player 1', position: 1, score: 0 },
      2: { id: 2, name: 'Player 2', position: 1, score: 0 }
    },
    activePlayerId: 1,
    tileOwners: {}, // Maps tile number (1-18) to player ID (1 or 2)
    isGameOver: false
  },

  init(config) {
    this.gameState.players[1].name = config.p1Name || 'Player 1';
    this.gameState.players[2].name = config.p2Name || 'Player 2';
    this.gameState.players[1].position = 1;
    this.gameState.players[2].position = 1;
    this.gameState.activePlayerId = 1;
    this.gameState.tileOwners = {};
    this.gameState.isGameOver = false;
  },

  getActivePlayer() {
    return this.gameState.players[this.gameState.activePlayerId];
  },

  rollDie() {
    return Math.floor(Math.random() * 3) + 1; // Rolls 1 to 3
  },

  movePlayer(roll) {
    const player = this.getActivePlayer();
    let newPos = player.position + roll;

    if (newPos > 18) {
      newPos = 18; // Cap at max tile position
    }

    player.position = newPos;
    return { player, newPosition: newPos };
  },

  claimTile(tileNumber, playerId) {
    this.gameState.tileOwners[tileNumber] = playerId;
  },

  switchTurn() {
    this.gameState.activePlayerId = this.gameState.activePlayerId === 1 ? 2 : 1;
  },

  checkWinCondition() {
    const p1 = this.gameState.players[1];
    const p2 = this.gameState.players[2];
    if (p1.position >= 18 || p2.position >= 18) {
      this.gameState.isGameOver = true;
    }
  }
};