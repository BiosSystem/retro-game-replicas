export interface SliceRect { x: number; y: number; width: number; height: number; }

export function nineSliceLayout(width: number, height: number, border = 4): SliceRect[] {
  const w = Math.max(border * 2, width), h = Math.max(border * 2, height), middleW = w - border * 2, middleH = h - border * 2;
  return [0, border, border + middleW].flatMap(x => [0, border, border + middleH].map(y => ({ x, y, width: x === border ? middleW : border, height: y === border ? middleH : border })));
}
