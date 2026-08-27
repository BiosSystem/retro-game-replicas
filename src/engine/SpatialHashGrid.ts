export interface Bounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class SpatialHashGrid {
  private readonly cells = new Map<string, Bounds[]>();
  private readonly cellSize: number;

  constructor(cellSize = 64) {
    if (cellSize <= 0) throw new Error('Cell size must be positive');
    this.cellSize = cellSize;
  }

  clear() { this.cells.clear(); }

  insert(bounds: Bounds) {
    for (const key of this.keysFor(bounds)) {
      const cell = this.cells.get(key) ?? [];
      cell.push(bounds);
      this.cells.set(key, cell);
    }
  }

  query(area: Bounds): Bounds[] {
    const found = new Map<string, Bounds>();
    for (const key of this.keysFor(area)) {
      for (const bounds of this.cells.get(key) ?? []) {
        if (this.intersects(area, bounds)) found.set(bounds.id, bounds);
      }
    }
    return [...found.values()];
  }

  private keysFor(bounds: Bounds) {
    const minX = Math.floor(bounds.x / this.cellSize);
    const minY = Math.floor(bounds.y / this.cellSize);
    const maxX = Math.floor((bounds.x + bounds.width) / this.cellSize);
    const maxY = Math.floor((bounds.y + bounds.height) / this.cellSize);
    const keys: string[] = [];
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) keys.push(`${x}:${y}`);
    }
    return keys;
  }

  private intersects(a: Bounds, b: Bounds) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }
}
