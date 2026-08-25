export interface Vec3 { x: number; y: number; z: number; }
export interface Portal { id: number; linkedId: number; position: Vec3; normal: Vec3; up: Vec3; halfWidth: number; halfHeight: number; }
export interface PortalBody { id: number; position: Vec3; previousPosition: Vec3; velocity: Vec3; gravity: Vec3; portalCooldown: number; }
export interface PortalTransition { body: PortalBody; portalId?: number; }

export function transitionBody(source: PortalBody, portals: readonly Portal[], deltaSeconds: number): PortalTransition {
  const body = cloneBody(source);
  body.portalCooldown = Math.max(0, body.portalCooldown - Math.max(0, deltaSeconds));
  if (body.portalCooldown > 0) return { body };
  for (const entry of portals) {
    const exit = portals.find(portal => portal.id === entry.linkedId);
    if (!exit || !crosses(body.previousPosition, body.position, entry)) continue;
    body.position = transformPoint(body.position, entry, exit);
    body.previousPosition = add(body.position, scale(normalize(exit.normal), .03));
    body.velocity = transformVector(body.velocity, entry, exit);
    body.gravity = transformVector(body.gravity, entry, exit);
    body.portalCooldown = .08;
    return { body, portalId: entry.id };
  }
  return { body };
}

export function transitionProjectileBuffer(values: Float32Array, portals: readonly Portal[]) {
  if (values.length % 9 !== 0) throw new Error('Portal projectile buffer must contain nine values per projectile');
  const output = values.slice();
  for (let offset = 0; offset < output.length; offset += 9) {
    const body: PortalBody = { id: offset / 9, previousPosition: { x: output[offset], y: output[offset + 1], z: output[offset + 2] }, position: { x: output[offset + 3], y: output[offset + 4], z: output[offset + 5] }, velocity: { x: output[offset + 6], y: output[offset + 7], z: output[offset + 8] }, gravity: { x: 0, y: -1, z: 0 }, portalCooldown: 0 };
    const result = transitionBody(body, portals, 1 / 60).body;
    output[offset + 3] = result.position.x; output[offset + 4] = result.position.y; output[offset + 5] = result.position.z;
    output[offset + 6] = result.velocity.x; output[offset + 7] = result.velocity.y; output[offset + 8] = result.velocity.z;
  }
  return output;
}

export function transformPoint(point: Vec3, entry: Portal, exit: Portal) {
  const local = toLocal(sub(point, entry.position), entry);
  return add(exit.position, fromLocal({ x: -local.x, y: local.y, z: -local.z }, exit));
}

export function transformVector(vector: Vec3, entry: Portal, exit: Portal) {
  const local = toLocal(vector, entry);
  return fromLocal({ x: -local.x, y: local.y, z: -local.z }, exit);
}

function crosses(previous: Vec3, current: Vec3, portal: Portal) {
  const before = dot(sub(previous, portal.position), normalize(portal.normal));
  const after = dot(sub(current, portal.position), normalize(portal.normal));
  if (before <= 0 || after > 0) return false;
  const local = toLocal(sub(current, portal.position), portal);
  return Math.abs(local.x) <= portal.halfWidth && Math.abs(local.y) <= portal.halfHeight;
}
function toLocal(value: Vec3, portal: Portal) { const n = normalize(portal.normal), u = normalize(portal.up), r = normalize(cross(u, n)); return { x: dot(value, r), y: dot(value, u), z: dot(value, n) }; }
function fromLocal(value: Vec3, portal: Portal) { const n = normalize(portal.normal), u = normalize(portal.up), r = normalize(cross(u, n)); return add(add(scale(r, value.x), scale(u, value.y)), scale(n, value.z)); }
function cloneBody(body: PortalBody): PortalBody { return { ...body, position: { ...body.position }, previousPosition: { ...body.previousPosition }, velocity: { ...body.velocity }, gravity: { ...body.gravity } }; }
export function magnitude(value: Vec3) { return Math.hypot(value.x, value.y, value.z); }
export function normalize(value: Vec3) { const length = magnitude(value) || 1; return scale(value, 1 / length); }
export function dot(a: Vec3, b: Vec3) { return a.x * b.x + a.y * b.y + a.z * b.z; }
export function cross(a: Vec3, b: Vec3) { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
export function add(a: Vec3, b: Vec3) { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
export function sub(a: Vec3, b: Vec3) { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
export function scale(value: Vec3, amount: number) { return { x: value.x * amount, y: value.y * amount, z: value.z * amount }; }
