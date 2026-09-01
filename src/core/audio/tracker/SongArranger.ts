export class SongArranger {
  private position = 0;
  readonly order: Uint16Array;
  readonly loopPosition: number;

  constructor(order: Uint16Array, loopPosition = 0) {
    if (order.length === 0) throw new Error('A tracker song requires at least one order entry');
    if (loopPosition < 0 || loopPosition >= order.length) throw new Error('Song loop position is outside the order table');
    this.order = order; this.loopPosition = loopPosition;
  }

  currentPatternId() { return this.order[this.position]; }
  currentPosition() { return this.position; }
  reset() { this.position = 0; }
  advance() { this.position = this.position + 1 < this.order.length ? this.position + 1 : this.loopPosition; return this.currentPatternId(); }
}
