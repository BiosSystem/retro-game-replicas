export const GENETIC_WORKGROUP_SIZE = 64;
export const GENETIC_FITNESS_WGSL = `struct Habitat { temperature: f32, moisture: f32, fluid: f32, elevation: f32 }
@group(0) @binding(0) var<storage, read> genomes: array<f32>;
@group(0) @binding(1) var<storage, read_write> fitness: array<f32>;
@group(0) @binding(2) var<uniform> habitat: Habitat;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id: vec3u) { if (id.x >= arrayLength(&fitness)) { return; } let offset = id.x * 8u; var difference = abs(genomes[offset] - habitat.temperature) + abs(genomes[offset + 1u] - habitat.moisture) + abs(genomes[offset + 2u] - habitat.fluid) + abs(genomes[offset + 3u] - habitat.elevation); fitness[id.x] = max(0.0, 1.0 - difference * 0.25); }`;
export function geneticDispatchSize(population: number) { return Math.ceil(Math.max(0, Math.min(4096, Math.floor(population))) / GENETIC_WORKGROUP_SIZE); }
