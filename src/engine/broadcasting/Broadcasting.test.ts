import { describe, expect, it } from 'vitest';
import { BitrateController } from './BitrateController';
import { demuxBroadcastChunk, muxBroadcastChunk } from './BroadcastMuxer';
import { probeBroadcastSupport } from './WebCodecsBroadcaster';

describe('WebCodecs broadcast pipeline', () => {
  it('frames video and audio chunks for application transport', () => {
    const packet = muxBroadcastChunk('video', 'avc1.42001f', { type: 'key', timestamp: 42, duration: 16, byteLength: 3, copyTo: target => { const view = target as ArrayBufferView<ArrayBufferLike>; new Uint8Array(view.buffer, view.byteOffset, view.byteLength).set([1, 2, 3]); } });
    expect(demuxBroadcastChunk(packet)).toMatchObject({ track: 'video', codec: 'avc1.42001f', timestamp: 42, key: true, payload: new Uint8Array([1, 2, 3]) });
  });
  it('reduces bitrate under frame or queue pressure', () => {
    const controller = new BitrateController(400_000, 2_500_000, 8_000_000);
    expect(controller.sample({ encodeQueue: 6, frameTimeMs: 24 })).toBe(2_000_000);
  });
  it('increases bitrate only after a sustained calm window', () => {
    const controller = new BitrateController(400_000, 1_000_000, 8_000_000);
    for (let index = 0; index < 29; index++) controller.sample({ encodeQueue: 0, frameTimeMs: 10 });
    expect(controller.current()).toBe(1_000_000); expect(controller.sample({ encodeQueue: 0, frameTimeMs: 10 })).toBe(1_100_000);
  });
  it('reports unsupported WebCodecs environments without throwing', async () => expect((await probeBroadcastSupport()).supported).toBe(false));
});
