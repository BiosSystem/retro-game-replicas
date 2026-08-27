export interface BranchInput { frame: number; mask: number; }
export interface TimeClone { id: number; sourceStart: number; sourceEnd: number; playhead: number; active: boolean; }

export class TimelineBrancher {
  private readonly masks = new Map<number, number>();
  private readonly clones: TimeClone[] = [];
  private nextId = 1;

  recordInput(frame: number, mask: number) {
    this.masks.set(frame, mask & 0xffff);
    if (this.masks.size > 1800) this.masks.delete(Math.min(...this.masks.keys()));
  }

  spawn(sourceStart: number, sourceEnd: number): TimeClone {
    if (!Number.isInteger(sourceStart) || sourceEnd < sourceStart) throw new Error('Invalid clone interval');
    if (sourceEnd - sourceStart >= 1800) throw new Error('Clone interval exceeds temporal history');
    if (this.clones.filter(clone => clone.active).length >= 8) throw new Error('Time clone limit reached');
    const clone = { id: this.nextId++, sourceStart, sourceEnd, playhead: sourceStart, active: true };
    this.clones.push(clone);
    return { ...clone };
  }

  step(): Array<{ clone: TimeClone; mask: number }> {
    const result: Array<{ clone: TimeClone; mask: number }> = [];
    for (const clone of this.clones) {
      if (!clone.active) continue;
      result.push({ clone: { ...clone }, mask: this.masks.get(clone.playhead) ?? 0 });
      clone.playhead++;
      if (clone.playhead > clone.sourceEnd) clone.active = false;
    }
    return result;
  }

  active() { return this.clones.filter(clone => clone.active).map(clone => ({ ...clone })); }
}
