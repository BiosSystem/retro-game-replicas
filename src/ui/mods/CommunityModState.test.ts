import { describe, expect, it } from 'vitest';
import { ModRuntime } from '../../mods/ModRuntime';
import { CommunityModState, CommunityModStorage, fetchModJson, validateModUrl } from './CommunityModState';

class MemoryStorage { value: string | null = null; getItem() { return this.value; } setItem(_key: string, value: string) { this.value = value; } }
const manifest = JSON.stringify({ apiVersion: 1, id: 'grid-rush', name: 'Grid Rush', version: '1.0.0', stage: { hazards: [{ lane: 1, offset: 0.25, speed: 1.2, kind: 'SPIKE' }], skin: { primary: '#00ffcc', secondary: '#ff0055' } }, hooks: [] });

describe('community mod manager state', () => {
  it('validates, imports, persists, hydrates, and removes mods', () => {
    const storage = new MemoryStorage(); const state = new CommunityModState(new CommunityModStorage(storage), new ModRuntime());
    expect(state.import(manifest).valid).toBe(true); expect(state.list()[0].id).toBe('grid-rush');
    const hydrated = new CommunityModState(new CommunityModStorage(storage), new ModRuntime()); expect(hydrated.hydrate()).toHaveLength(1);
    expect(hydrated.remove('grid-rush')).toBe(true);
  });

  it('preserves the active version when replacement validation fails', () => {
    const state = new CommunityModState(new CommunityModStorage(new MemoryStorage()), new ModRuntime()); state.import(manifest);
    expect(state.import(manifest.replace('"version":"1.0.0"', '"version":"bad"')).valid).toBe(false);
    expect(state.list()).toHaveLength(1);
  });

  it('allows only credential-free HTTPS URLs', () => {
    expect(validateModUrl('https://mods.example/stage.json').hostname).toBe('mods.example');
    expect(() => validateModUrl('http://mods.example/stage.json')).toThrow('HTTPS');
    expect(() => validateModUrl('https://user:pass@mods.example/stage.json')).toThrow('credentials');
  });

  it('rejects oversized URL responses before reading the body', async () => {
    const fetcher = async () => new Response(manifest, { status: 200, headers: { 'content-length': '70000' } });
    await expect(fetchModJson('https://mods.example/stage.json', fetcher)).rejects.toThrow('64 KiB');
  });
});
