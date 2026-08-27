import { describe, expect, it, vi } from 'vitest';
import { FullscreenController, type FullscreenDocument, type FullscreenTarget } from './FullscreenController';

describe('fullscreen controller', () => {
  it('enters and exits only when the browser exposes both standard API methods', async () => {
    const documentPort: FullscreenDocument = { fullscreenElement: null };
    const target: FullscreenTarget = {
      requestFullscreen: vi.fn(async () => { documentPort.fullscreenElement = target; }),
    };
    documentPort.exitFullscreen = vi.fn(async () => { documentPort.fullscreenElement = null; });
    const controller = new FullscreenController(target, documentPort);

    expect(controller.status()).toBe('READY');
    await expect(controller.toggle()).resolves.toBe(true);
    expect(controller.status()).toBe('ACTIVE');
    await expect(controller.toggle()).resolves.toBe(true);
    expect(controller.status()).toBe('READY');
    expect(target.requestFullscreen).toHaveBeenCalledOnce();
    expect(documentPort.exitFullscreen).toHaveBeenCalledOnce();
  });

  it('reports an unavailable or rejected browser path without throwing', async () => {
    const missing = new FullscreenController({}, { fullscreenElement: null });
    expect(missing.status()).toBe('UNAVAILABLE');
    await expect(missing.toggle()).resolves.toBe(false);

    const documentPort: FullscreenDocument = { fullscreenElement: null, exitFullscreen: vi.fn(async () => undefined) };
    const rejected = new FullscreenController({ requestFullscreen: vi.fn(async () => { throw new Error('Denied'); }) }, documentPort);
    await expect(rejected.toggle()).resolves.toBe(false);
  });
});
