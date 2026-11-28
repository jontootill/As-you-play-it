class CardManager {
  constructor() {
    this.challenges = [];
  }

  async loadData() {
    try {
      const res = await fetch('assets/data/challenges.json');
      if (res.ok) {
        const raw = await res.json();
        this.challenges = Array.isArray(raw) ? raw : (raw.challenges || raw.cards || []);
      }
    } catch (err) {
      console.error('Error loading challenges.json:', err);
    }
  }

  getTwoOptionsForTile(tileId, tileName, intensity) {
    const tileObj = this.challenges.find(
      item => item && (item.tile_id === tileId || item.tile_name === tileName)
    );

    const tiers = ['romantic', 'sensual', 'erotic'];
    let pool = [];

    if (tileObj && tileObj.variants) {
      const order = [intensity, ...tiers.filter(t => t !== intensity)];
      for (const tier of order) {
        const v = tileObj.variants[tier];
        const list = v?.takeover_challenge || v?.rent_task || [];
        if (Array.isArray(list) && list.length > 0) {
          pool = list;
          break;
        }
      }
    }

    if (pool.length === 0) {
      return [
        `Give ${tileName} slow, attentive touch for 45 seconds.`,
        `Trace ${tileName} gently with your fingertips and lips for 45 seconds.`
      ];
    }

    if (pool.length === 1) {
      return [pool[0], `Slow down and linger on ${tileName}: ${pool[0]}`];
    }

    const idx1 = Math.floor(Math.random() * pool.length);
    let idx2 = Math.floor(Math.random() * pool.length);
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * pool.length);
    }

    return [pool[idx1], pool[idx2]];
  }
}

window.cardManager = new CardManager();