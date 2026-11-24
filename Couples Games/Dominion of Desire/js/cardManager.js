class CardManager {
  constructor() {
    this.challenges = [];
    this.modifiers = [];
  }

  async loadData() {
    try {
      const [challengesRes, modifiersRes] = await Promise.all([
        fetch('assets/data/challenges.json'),
        fetch('assets/data/modifiers.json')
      ]);

      if (challengesRes.ok) {
        const rawChallenges = await challengesRes.json();
        this.challenges = Array.isArray(rawChallenges) 
          ? rawChallenges 
          : (rawChallenges.challenges || rawChallenges.cards || []);
      }

      if (modifiersRes.ok) {
        const rawModifiers = await modifiersRes.json();
        if (Array.isArray(rawModifiers)) {
          this.modifiers = rawModifiers;
        } else if (rawModifiers && Array.isArray(rawModifiers.modifiers)) {
          this.modifiers = rawModifiers.modifiers;
        } else if (rawModifiers && Array.isArray(rawModifiers.cards)) {
          this.modifiers = rawModifiers.cards;
        } else {
          this.modifiers = [];
        }
      }
    } catch (err) {
      console.error("Error loading card JSON data:", err);
    }
  }

  getChallengeForTile(rawTileId, intensitySetting) {
    if (!this.challenges || this.challenges.length === 0) {
      return null;
    }

    const num = String(rawTileId).replace('tile_', '');
    const formattedId = `tile_${num}`;

    // Look for match by formatted tile_id or raw index
    const tileData = this.challenges.find(item => 
      item && (String(item.tile_id) === formattedId || String(item.tile_id) === num)
    );

    if (!tileData) {
      return null;
    }

    let variant = null;
    if (tileData.variants) {
      variant = tileData.variants[intensitySetting] || 
                tileData.variants['romantic'] || 
                tileData.variants['sensual'] || 
                tileData.variants['tease'] || 
                tileData.variants['erotic'] || 
                Object.values(tileData.variants)[0];
    } else {
      variant = tileData;
    }

    const getRandomItem = (dataField, fallback) => {
      if (Array.isArray(dataField) && dataField.length > 0) {
        const index = Math.floor(Math.random() * dataField.length);
        return dataField[index];
      }
      return typeof dataField === 'string' ? dataField : fallback;
    };

    const selectedRentTask = getRandomItem(
      variant?.rent_task, 
      'Perform 30 seconds of gentle touch.'
    );

    const selectedTakeoverChallenge = getRandomItem(
      variant?.takeover_challenge, 
      'Perform a challenge to claim this territory.'
    );

    return {
      tile_name: tileData.tile_name || tileData.name || null,
      rent_task: selectedRentTask,
      takeover_challenge: selectedTakeoverChallenge
    };
  }

  drawRandomModifier() {
    const validModifiers = Array.isArray(this.modifiers) 
      ? this.modifiers.filter(Boolean) 
      : [];

    if (validModifiers.length === 0) {
      return {
        name: 'Slow Motion',
        description: 'Perform the action with extra slow movements and focus.',
        title: 'Slow Motion'
      };
    }

    const randomIndex = Math.floor(Math.random() * validModifiers.length);
    const mod = validModifiers[randomIndex];

    return {
      name: mod?.name || mod?.title || mod?.modifier_name || 'Modifier Card',
      description: mod?.description || mod?.task || mod?.text || 'Perform the current task with an added twist!'
    };
  }
}

window.cardManager = new CardManager();