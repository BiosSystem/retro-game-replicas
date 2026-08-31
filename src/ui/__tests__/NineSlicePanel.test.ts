import { expect, it } from 'vitest';
import { ArcadeButton } from '../ArcadeButton';
import { createNineSlicePanel, readCabinetPalette, writeCabinetPalette } from '../NineSlicePanel';
import { loadPlayerProfileCard, setPlayerProfilePalette } from '../PlayerProfileCard';

const storage = () => {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
};

it('builds themed panels and button states', () => {
  expect(createNineSlicePanel('PROFILE', 'MAGENTA_HEAT').palette).toBe('MAGENTA_HEAT');
  const button = new ArcadeButton('PLAY');
  button.hover(); button.press(); button.release();
  expect(button.state).toBe('HOVER');
  button.disable(); button.press();
  expect(button.state).toBe('DISABLED');
});

it('persists a selected cabinet palette with the player profile', () => {
  const local = storage();
  writeCabinetPalette(local, 'AMBER_TERMINAL');
  expect(readCabinetPalette(local)).toBe('AMBER_TERMINAL');
  expect(loadPlayerProfileCard(local).palette).toBe('AMBER_TERMINAL');
  expect(setPlayerProfilePalette(local, 'EMERALD_VECTOR').palette).toBe('EMERALD_VECTOR');
});
