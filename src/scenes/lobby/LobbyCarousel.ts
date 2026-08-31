export interface LobbyCarouselState {
  selectedIndex: number;
  position: number;
  velocity: number;
}

export class LobbyCarousel {
  private readonly itemCount: number;
  private selectedIndex = 0;
  private position = 0;
  private velocity = 0;

  constructor(itemCount: number) {
    if (!Number.isInteger(itemCount) || itemCount < 1) throw new Error('Carousel requires at least one item');
    this.itemCount = itemCount;
  }

  select(index: number) { this.selectedIndex = wrap(index, this.itemCount); }
  move(delta: number) { this.select(this.selectedIndex + delta); }

  update(deltaMs: number): LobbyCarouselState {
    const seconds = Math.min(Math.max(deltaMs, 0), 50) / 1000;
    const distance = shortestDistance(this.position, this.selectedIndex, this.itemCount);
    this.velocity += distance * 72 * seconds;
    this.velocity *= Math.exp(-14 * seconds);
    this.position = wrapPosition(this.position + this.velocity * seconds, this.itemCount);
    if (Math.abs(distance) < 0.001 && Math.abs(this.velocity) < 0.001) {
      this.position = this.selectedIndex;
      this.velocity = 0;
    }
    return this.snapshot();
  }

  snapshot(): LobbyCarouselState { return { selectedIndex: this.selectedIndex, position: this.position, velocity: this.velocity }; }
}

function wrap(value: number, length: number) { return ((Math.trunc(value) % length) + length) % length; }
function wrapPosition(value: number, length: number) { return ((value % length) + length) % length; }
function shortestDistance(from: number, to: number, length: number) {
  const raw = to - from;
  const wrapped = ((raw + length / 2) % length + length) % length - length / 2;
  return Math.abs(wrapped + length / 2) < 0.000001 ? length / 2 : wrapped;
}
