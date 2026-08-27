import { describe, expect, it } from 'vitest';
import { ARCADE_DIFFICULTIES, ARCADE_GAMES } from './ArcadeCatalog';

describe('arcade catalog', () => {
  it('keeps 26 games plus one Meta-Arcade hall with unique scene identifiers', () => {
    expect(ARCADE_GAMES).toHaveLength(27);
    expect(new Set(ARCADE_GAMES.map(game => game.scene)).size).toBe(27);
    expect(ARCADE_GAMES.filter(game => game.scene === 'MetaArcadeScene')).toHaveLength(1);
    expect(ARCADE_GAMES.every(game => game.name.length > 0 && game.icon.length > 0)).toBe(true);
  });

  it('keeps the ordered four-tier difficulty contract', () => {
    expect(ARCADE_DIFFICULTIES.map(difficulty => difficulty.id)).toEqual(['EASY', 'NORMAL', 'HARD', 'EXPERT']);
    expect(ARCADE_DIFFICULTIES.every(difficulty => /^#[a-f0-9]{6}$/.test(difficulty.color))).toBe(true);
  });
});
