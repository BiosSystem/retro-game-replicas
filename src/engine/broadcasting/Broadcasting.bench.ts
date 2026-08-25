import { bench, describe } from 'vitest';
import { muxBroadcastChunk } from './BroadcastMuxer';

const payload = new Uint8Array(1024); const chunk = { type: 'delta' as const, timestamp: 1, duration: 16, byteLength: payload.length, copyTo: (target: AllowSharedBufferSource) => { const view = target as ArrayBufferView<ArrayBufferLike>; new Uint8Array(view.buffer, view.byteOffset, view.byteLength).set(payload); } };
describe('broadcast framing', () => { bench('frame one thousand encoded chunks', () => { for (let index = 0; index < 1000; index++) muxBroadcastChunk('video', 'avc1.42001f', chunk); }); });
