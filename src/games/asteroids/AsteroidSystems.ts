export type WeaponMode = 'SPREAD' | 'LASER' | 'EMP';
export interface Vector { x: number; y: number; }

export function fractureSizes(size: number): number[] { return size > 1 ? [size - 1, size - 1] : []; }

export function predictIntercept(shooter: Vector, target: Vector, velocity: Vector, projectileSpeed: number): Vector {
  const dx = target.x - shooter.x;
  const dy = target.y - shooter.y;
  const a = velocity.x ** 2 + velocity.y ** 2 - projectileSpeed ** 2;
  const b = 2 * (dx * velocity.x + dy * velocity.y);
  const c = dx ** 2 + dy ** 2;
  const discriminant = b ** 2 - 4 * a * c;
  let time = 0;
  if (Math.abs(a) < 0.0001) time = b !== 0 ? -c / b : 0;
  else if (discriminant >= 0) {
    const root = Math.sqrt(discriminant);
    const times = [(-b - root) / (2 * a), (-b + root) / (2 * a)].filter(value => value > 0);
    time = times.length ? Math.min(...times) : 0;
  }
  return { x: target.x + velocity.x * Math.max(0, time), y: target.y + velocity.y * Math.max(0, time) };
}

export function unlockedWeapons(minerals: number): WeaponMode[] {
  const modes: WeaponMode[] = ['SPREAD'];
  if (minerals >= 5) modes.push('LASER');
  if (minerals >= 12) modes.push('EMP');
  return modes;
}
