export interface Vec3 { x: number; y: number; z: number; }
export interface TraceMaterial { albedo: Vec3; emission: Vec3; roughness: number; metallic: number; }
export interface TraceBox { id: number; minimum: Vec3; maximum: Vec3; material: TraceMaterial; }
export interface BvhNode { minimum: Vec3; maximum: Vec3; left: number; right: number; first: number; count: number; }
export interface Bvh { nodes: BvhNode[]; boxes: TraceBox[]; }
export interface RayHit { box: TraceBox; distance: number; point: Vec3; normal: Vec3; }

export function buildBvh(source: readonly TraceBox[], maximumLeafSize = 4): Bvh {
  if (source.length > 4096) throw new Error('BVH box limit exceeded');
  const boxes = source.map(box => ({ ...box, minimum: { ...box.minimum }, maximum: { ...box.maximum }, material: { ...box.material, albedo: { ...box.material.albedo }, emission: { ...box.material.emission } } }));
  const nodes: BvhNode[] = [];
  const build = (first: number, count: number): number => {
    const index = nodes.length; const bounds = boundsFor(boxes, first, count);
    nodes.push({ ...bounds, left: -1, right: -1, first, count });
    if (count <= Math.max(1, maximumLeafSize)) return index;
    const extent = sub(bounds.maximum, bounds.minimum); const axis: keyof Vec3 = extent.x >= extent.y && extent.x >= extent.z ? 'x' : extent.y >= extent.z ? 'y' : 'z';
    const sorted = boxes.slice(first, first + count).sort((a, b) => center(a)[axis] - center(b)[axis]); boxes.splice(first, count, ...sorted);
    const leftCount = Math.floor(count / 2); const left = build(first, leftCount), right = build(first + leftCount, count - leftCount);
    nodes[index] = { ...nodes[index], left, right, count: 0 };
    return index;
  };
  if (boxes.length) build(0, boxes.length);
  return { nodes, boxes };
}

export function traceBvh(bvh: Bvh, origin: Vec3, direction: Vec3, maximumDistance = 1000): RayHit | undefined {
  if (!bvh.nodes.length) return undefined;
  const inverse = { x: 1 / safe(direction.x), y: 1 / safe(direction.y), z: 1 / safe(direction.z) };
  const stack = new Int32Array(64); let top = 0; stack[top++] = 0; let closest = maximumDistance; let selected: TraceBox | undefined;
  while (top) {
    const node = bvh.nodes[stack[--top]];
    if (!hitBounds(origin, inverse, node.minimum, node.maximum, closest)) continue;
    if (node.count) {
      for (let i = node.first; i < node.first + node.count; i++) { const distance = boxDistance(origin, inverse, bvh.boxes[i]); if (distance > 0 && distance < closest) { closest = distance; selected = bvh.boxes[i]; } }
    } else { if (top + 2 > stack.length) throw new Error('BVH traversal stack exceeded'); stack[top++] = node.left; stack[top++] = node.right; }
  }
  if (!selected) return undefined;
  const point = add(origin, scale(direction, closest));
  return { box: selected, distance: closest, point, normal: boxNormal(point, selected) };
}

export function traceGlobalIllumination(bvh: Bvh, origin: Vec3, direction: Vec3, light: Vec3, bounces = 2, seed = 1) {
  let rayOrigin = origin, rayDirection = normalize(direction), throughput = { x: 1, y: 1, z: 1 }, radiance = { x: 0, y: 0, z: 0 }, state = seed | 0;
  for (let bounce = 0; bounce < Math.max(1, Math.min(3, bounces)); bounce++) {
    const hit = traceBvh(bvh, rayOrigin, rayDirection); if (!hit) { radiance = add(radiance, multiply(throughput, { x: .012, y: .018, z: .035 })); break; }
    radiance = add(radiance, multiply(throughput, hit.box.material.emission));
    const lightDirection = normalize(sub(light, hit.point)); const lightDistance = length(sub(light, hit.point));
    const shadow = traceBvh(bvh, add(hit.point, scale(hit.normal, .002)), lightDirection, lightDistance - .01);
    const lambert = shadow ? 0 : Math.max(0, dot(hit.normal, lightDirection));
    radiance = add(radiance, scale(multiply(throughput, hit.box.material.albedo), lambert * .72));
    throughput = multiply(throughput, hit.box.material.albedo);
    state = random(state); const jitter = { x: ((state >>> 8) & 255) / 255 - .5, y: ((state >>> 16) & 255) / 255 - .5, z: ((state >>> 24) & 255) / 255 - .5 };
    const reflected = sub(rayDirection, scale(hit.normal, 2 * dot(rayDirection, hit.normal)));
    rayDirection = normalize(add(scale(reflected, hit.box.material.metallic), scale(add(hit.normal, jitter), hit.box.material.roughness)));
    rayOrigin = add(hit.point, scale(hit.normal, .002));
  }
  return radiance;
}

function boundsFor(boxes: TraceBox[], first: number, count: number) { const minimum = { x: Infinity, y: Infinity, z: Infinity }, maximum = { x: -Infinity, y: -Infinity, z: -Infinity }; for (let i = first; i < first + count; i++) { const box = boxes[i]; minimum.x = Math.min(minimum.x, box.minimum.x); minimum.y = Math.min(minimum.y, box.minimum.y); minimum.z = Math.min(minimum.z, box.minimum.z); maximum.x = Math.max(maximum.x, box.maximum.x); maximum.y = Math.max(maximum.y, box.maximum.y); maximum.z = Math.max(maximum.z, box.maximum.z); } return { minimum, maximum }; }
function center(box: TraceBox) { return scale(add(box.minimum, box.maximum), .5); }
function hitBounds(origin: Vec3, inverse: Vec3, minimum: Vec3, maximum: Vec3, closest: number) { const tx1 = (minimum.x - origin.x) * inverse.x, tx2 = (maximum.x - origin.x) * inverse.x, ty1 = (minimum.y - origin.y) * inverse.y, ty2 = (maximum.y - origin.y) * inverse.y, tz1 = (minimum.z - origin.z) * inverse.z, tz2 = (maximum.z - origin.z) * inverse.z; const near = Math.max(Math.min(tx1, tx2), Math.min(ty1, ty2), Math.min(tz1, tz2), 0); const far = Math.min(Math.max(tx1, tx2), Math.max(ty1, ty2), Math.max(tz1, tz2), closest); return far >= near; }
function boxDistance(origin: Vec3, inverse: Vec3, box: TraceBox) { const tx1 = (box.minimum.x - origin.x) * inverse.x, tx2 = (box.maximum.x - origin.x) * inverse.x, ty1 = (box.minimum.y - origin.y) * inverse.y, ty2 = (box.maximum.y - origin.y) * inverse.y, tz1 = (box.minimum.z - origin.z) * inverse.z, tz2 = (box.maximum.z - origin.z) * inverse.z; return Math.max(Math.min(tx1, tx2), Math.min(ty1, ty2), Math.min(tz1, tz2), 0); }
function boxNormal(point: Vec3, box: TraceBox): Vec3 { const distances = [{ d: Math.abs(point.x - box.minimum.x), n: { x: -1, y: 0, z: 0 } }, { d: Math.abs(point.x - box.maximum.x), n: { x: 1, y: 0, z: 0 } }, { d: Math.abs(point.y - box.minimum.y), n: { x: 0, y: -1, z: 0 } }, { d: Math.abs(point.y - box.maximum.y), n: { x: 0, y: 1, z: 0 } }, { d: Math.abs(point.z - box.minimum.z), n: { x: 0, y: 0, z: -1 } }, { d: Math.abs(point.z - box.maximum.z), n: { x: 0, y: 0, z: 1 } }]; return distances.sort((a, b) => a.d - b.d)[0].n; }
function random(value: number) { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return value | 0; }
function safe(value: number) { return Math.abs(value) < 1e-8 ? (value < 0 ? -1e-8 : 1e-8) : value; }
function normalize(v: Vec3) { const l = length(v) || 1; return scale(v, 1 / l); } function length(v: Vec3) { return Math.hypot(v.x, v.y, v.z); } function dot(a: Vec3, b: Vec3) { return a.x * b.x + a.y * b.y + a.z * b.z; } function add(a: Vec3, b: Vec3) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; } function sub(a: Vec3, b: Vec3) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; } function scale(v: Vec3, s: number) { return { x: v.x * s, y: v.y * s, z: v.z * s }; } function multiply(a: Vec3, b: Vec3) { return { x: a.x * b.x, y: a.y * b.y, z: a.z * b.z }; }
