import { describe, expect, it, vi } from 'vitest';
import { registerOfflineRuntime } from './OfflineRuntime';

describe('offline runtime registration', () => {
  it('registers the root worker without using the HTTP cache for updates', async () => {
    const register = vi.fn().mockResolvedValue({});
    const serviceWorker = { register, ready: Promise.resolve({}) };

    await expect(registerOfflineRuntime(serviceWorker, true, true)).resolves.toBe('READY');
    expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/', updateViaCache: 'none' });
  });

  it('reports unsupported and failed environments without blocking startup', async () => {
    await expect(registerOfflineRuntime(undefined, true, true)).resolves.toBe('UNSUPPORTED');
    await expect(registerOfflineRuntime({ register: vi.fn().mockRejectedValue(new Error('blocked')), ready: Promise.resolve({}) }, true, true)).resolves.toBe('ERROR');
    await expect(registerOfflineRuntime({ register: vi.fn(), ready: Promise.resolve({}) }, false, true)).resolves.toBe('UNSUPPORTED');
    await expect(registerOfflineRuntime({ register: vi.fn(), ready: Promise.resolve({}) }, true, false)).resolves.toBe('UNSUPPORTED');
  });
});
