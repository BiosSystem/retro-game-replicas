export interface TemporalBody { id: number; timeline: number; x: number; y: number; width: number; height: number; inverseMass: number; }
export interface TemporalSwitch { id: number; x: number; y: number; width: number; height: number; }
export interface CausalResult { bodies: TemporalBody[]; pressedSwitches: number[]; contacts: number; }

export function solveCausality(sourceBodies: readonly TemporalBody[], switches: readonly TemporalSwitch[], iterations = 3): CausalResult {
  const bodies = sourceBodies.map(body => ({ ...body })).sort((a, b) => a.timeline - b.timeline || a.id - b.id);
  let contacts = 0;
  for (let pass = 0; pass < Math.max(1, Math.min(8, iterations)); pass++) {
    for (let a = 0; a < bodies.length; a++) for (let b = a + 1; b < bodies.length; b++) {
      const left = bodies[a]; const right = bodies[b];
      const overlapX = (left.width + right.width) * 0.5 - Math.abs(left.x - right.x);
      const overlapY = (left.height + right.height) * 0.5 - Math.abs(left.y - right.y);
      if (overlapX <= 0 || overlapY <= 0) continue;
      contacts++;
      const totalMass = left.inverseMass + right.inverseMass;
      if (totalMass <= 0) continue;
      const olderWins = left.timeline !== right.timeline;
      const leftShare = olderWins ? 0 : left.inverseMass / totalMass;
      const rightShare = olderWins ? 1 : right.inverseMass / totalMass;
      if (overlapX < overlapY) {
        const direction = left.x <= right.x ? -1 : 1;
        left.x += direction * overlapX * leftShare;
        right.x -= direction * overlapX * rightShare;
      } else {
        const direction = left.y <= right.y ? -1 : 1;
        left.y += direction * overlapY * leftShare;
        right.y -= direction * overlapY * rightShare;
      }
    }
  }
  const pressedSwitches = switches.filter(target => bodies.some(body => overlaps(body, target))).map(target => target.id).sort((a, b) => a - b);
  return { bodies, pressedSwitches, contacts };
}

function overlaps(a: Pick<TemporalBody, 'x' | 'y' | 'width' | 'height'>, b: Pick<TemporalBody, 'x' | 'y' | 'width' | 'height'>) {
  return Math.abs(a.x - b.x) * 2 < a.width + b.width && Math.abs(a.y - b.y) * 2 < a.height + b.height;
}
