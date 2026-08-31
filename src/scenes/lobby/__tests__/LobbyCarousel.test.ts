import { expect, it } from 'vitest';
import { LobbyCarousel } from '../LobbyCarousel';

it('eases toward a wrapped cabinet selection', () => {
  const carousel = new LobbyCarousel(7);
  carousel.select(6);
  for (let frame = 0; frame < 120; frame++) carousel.update(16.667);
  expect(carousel.snapshot().selectedIndex).toBe(6);
  expect(carousel.snapshot().position).toBeCloseTo(6, 2);
});

it('rejects an empty cabinet carousel', () => {
  expect(() => new LobbyCarousel(0)).toThrow('at least one item');
});
