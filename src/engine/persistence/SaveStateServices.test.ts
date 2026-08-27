import { describe, expect, it, vi } from 'vitest';
import { SaveStateBridge } from './SaveStateServices';

describe('save-state scene bridge', () => {
  it('routes commands only while the matching provider is attached', async () => {
    const bridge = new SaveStateBridge();
    const provider = { save: vi.fn(async () => undefined), load: vi.fn(async () => undefined) };
    await expect(bridge.save('neon_epoch_1')).rejects.toThrow('Launch Neon Epoch');
    bridge.attach(provider);
    await bridge.save('neon_epoch_1');
    await bridge.load('neon_epoch_1');
    expect(provider.save).toHaveBeenCalledWith('neon_epoch_1');
    expect(provider.load).toHaveBeenCalledWith('neon_epoch_1');
    bridge.detach(provider);
    expect(bridge.available).toBe(false);
  });
});
