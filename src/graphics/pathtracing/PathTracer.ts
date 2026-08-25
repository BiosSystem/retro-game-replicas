export interface Vec3 { x: number; y: number; z: number; }
export interface PathMaterial { albedo: Vec3; emission: Vec3; roughness: number; metallic: number; transmission: number; ior: number; }
export interface PathSphere { center: Vec3; radius: number; material: PathMaterial; }
export interface PathScene { spheres: readonly PathSphere[]; sky: Vec3; }
export interface PathSample { color: Vec3; depth: number; normal: Vec3; bounces: number; }
export interface PathFrame { width: number; height: number; color: Float32Array<ArrayBuffer>; depth: Float32Array<ArrayBuffer>; normal: Float32Array<ArrayBuffer>; checksum: number; rays: number; }

interface Hit { distance: number; point: Vec3; normal: Vec3; sphere: PathSphere; }

export function tracePath(scene: PathScene, origin: Vec3, direction: Vec3, seed = 1, maximumBounces = 6): PathSample {
  if (scene.spheres.length > 1024) throw new Error('Path scene exceeds 1,024 primitives');
  let rayOrigin = origin, rayDirection = normalize(direction), throughput = vec(1), radiance = vec(0), state = seed | 0, depth = 1000, firstNormal = vec(0), bounceCount = 0;
  for (let bounce = 0; bounce < Math.max(1, Math.min(8, maximumBounces)); bounce++) {
    bounceCount++; const hit = intersectScene(scene, rayOrigin, rayDirection); if (!hit) { radiance = add(radiance, multiply(throughput, scene.sky)); break; }
    if (bounce === 0) { depth = hit.distance; firstNormal = hit.normal; }
    const material = hit.sphere.material; radiance = add(radiance, multiply(throughput, material.emission)); throughput = multiply(throughput, material.albedo);
    state = random(state); const randomVector = normalize({ x: unit(state) * 2 - 1, y: unit(random(state)) * 2 - 1, z: unit(random(random(state))) * 2 - 1 }); const reflected = reflect(rayDirection, hit.normal);
    const entering = dot(rayDirection, hit.normal) < 0, orientedNormal = entering ? hit.normal : scale(hit.normal, -1), eta = entering ? 1 / Math.max(1, material.ior) : Math.max(1, material.ior), refracted = refract(rayDirection, orientedNormal, eta);
    const fresnel = schlick(Math.abs(dot(scale(rayDirection, -1), orientedNormal)), material.ior), chooseTransmission = refracted && material.transmission > 0 && unit(state ^ 0x51ed270b) > fresnel && unit(state ^ 0x9e3779b9) < material.transmission;
    if (chooseTransmission && refracted) { rayDirection = normalize(add(refracted, scale(randomVector, material.roughness * .08))); rayOrigin = add(hit.point, scale(orientedNormal, -.003)); }
    else { const diffuse = normalize(add(hit.normal, randomVector)); rayDirection = normalize(add(scale(diffuse, 1 - material.metallic), scale(reflected, material.metallic + (1 - material.roughness) * .35))); rayOrigin = add(hit.point, scale(orientedNormal, .003)); }
    if (bounce >= 3) { const survival = Math.max(.1, Math.min(.95, Math.max(throughput.x, throughput.y, throughput.z))); if (unit(state ^ bounce) > survival) break; throughput = scale(throughput, 1 / survival); }
  }
  return { color: radiance, depth, normal: firstNormal, bounces: bounceCount };
}

export function renderPathFrame(scene: PathScene, width = 64, height = 36, samplesPerPixel = 1, frame = 0): PathFrame {
  const w = Math.max(1, Math.min(256, Math.floor(width))), h = Math.max(1, Math.min(144, Math.floor(height))), spp = Math.max(1, Math.min(8, Math.floor(samplesPerPixel))); if (w * h * spp > 262_144) throw new Error('Path frame ray budget exceeded');
  const color = new Float32Array(w * h * 3), depth = new Float32Array(w * h), normal = new Float32Array(w * h * 3); let checksum = 2166136261;
  for (let pixel = 0; pixel < w * h; pixel++) { const x = pixel % w, y = Math.floor(pixel / w); let sum = vec(0), first: PathSample | undefined; for (let sample = 0; sample < spp; sample++) { const jitter = unit(mix(pixel ^ Math.imul(sample + 1, 0x9e3779b9) ^ frame)), u = ((x + jitter) / w - .5) * 1.6, v = (.5 - (y + unit(mix(pixel ^ sample ^ 71))) / h) * .9, traced = tracePath(scene, { x: 0, y: 1.2, z: -7 }, { x: u, y: v, z: 1 }, pixel ^ frame ^ sample); first ??= traced; sum = add(sum, traced.color); } const averaged = scale(sum, 1 / spp), offset = pixel * 3; color[offset] = averaged.x; color[offset + 1] = averaged.y; color[offset + 2] = averaged.z; depth[pixel] = first?.depth ?? 1000; normal[offset] = first?.normal.x ?? 0; normal[offset + 1] = first?.normal.y ?? 0; normal[offset + 2] = first?.normal.z ?? 0; checksum = Math.imul(checksum ^ Math.round(averaged.x * 4096) ^ Math.round(averaged.y * 8192) ^ Math.round(averaged.z * 16384), 16777619); }
  return { width: w, height: h, color, depth, normal, checksum: checksum >>> 0, rays: w * h * spp };
}

export function singularityPathScene(seed = 1): PathScene { const hue = unit(mix(seed)); return { sky: { x: .008, y: .014, z: .035 }, spheres: [
  { center: { x: 0, y: -1001, z: 4 }, radius: 1000, material: material({ x: .18, y: .22, z: .3 }, .7, 0) },
  { center: { x: -1.5, y: .1, z: 3 }, radius: 1.1, material: material({ x: .2 + hue * .4, y: .12, z: .7 }, .18, .8) },
  { center: { x: 1.4, y: .15, z: 3.4 }, radius: 1.15, material: { ...material({ x: .78, y: .9, z: 1 }, .04, .05), transmission: .92, ior: 1.5 } },
  { center: { x: 0, y: 5, z: 2 }, radius: .7, material: { ...material(vec(1), 0, 0), emission: { x: 5, y: 3.5, z: 7 } } },
  ] }; }

function material(albedo: Vec3, roughness: number, metallic: number): PathMaterial { return { albedo, emission: vec(0), roughness, metallic, transmission: 0, ior: 1.5 }; }
function intersectScene(scene: PathScene, origin: Vec3, direction: Vec3): Hit | undefined { let closest = Infinity, selected: Hit | undefined; for (const sphere of scene.spheres) { const offset = sub(origin, sphere.center), b = dot(offset, direction), c = dot(offset, offset) - sphere.radius * sphere.radius, discriminant = b * b - c; if (discriminant < 0) continue; const root = Math.sqrt(discriminant), distance = -b - root > .001 ? -b - root : -b + root; if (distance <= .001 || distance >= closest) continue; const point = add(origin, scale(direction, distance)); closest = distance; selected = { distance, point, normal: normalize(sub(point, sphere.center)), sphere }; } return selected; }
function reflect(direction: Vec3, normal: Vec3) { return sub(direction, scale(normal, 2 * dot(direction, normal))); }
function refract(direction: Vec3, normal: Vec3, eta: number): Vec3 | undefined { const cosine = Math.min(1, dot(scale(direction, -1), normal)), perpendicular = scale(add(direction, scale(normal, cosine)), eta), parallelSquared = 1 - dot(perpendicular, perpendicular); return parallelSquared < 0 ? undefined : add(perpendicular, scale(normal, -Math.sqrt(parallelSquared))); }
function schlick(cosine: number, ior: number) { const base = ((1 - ior) / (1 + ior)) ** 2; return base + (1 - base) * (1 - cosine) ** 5; }
function random(value: number) { value ^= value << 13; value ^= value >>> 17; value ^= value << 5; return value | 0; } function mix(value: number) { return random(Math.imul(value ^ value >>> 16, 0x45d9f3b)); } function unit(value: number) { return (value >>> 0) / 4294967296; }
function vec(value: number): Vec3 { return { x: value, y: value, z: value }; } function add(a: Vec3, b: Vec3): Vec3 { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; } function sub(a: Vec3, b: Vec3): Vec3 { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; } function scale(a: Vec3, value: number): Vec3 { return { x: a.x * value, y: a.y * value, z: a.z * value }; } function multiply(a: Vec3, b: Vec3): Vec3 { return { x: a.x * b.x, y: a.y * b.y, z: a.z * b.z }; } function dot(a: Vec3, b: Vec3) { return a.x * b.x + a.y * b.y + a.z * b.z; } function normalize(a: Vec3): Vec3 { const length = Math.hypot(a.x, a.y, a.z) || 1; return scale(a, 1 / length); }
