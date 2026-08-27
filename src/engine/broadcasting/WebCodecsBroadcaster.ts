import { BitrateController } from './BitrateController';
import { muxBroadcastChunk, type EncodedChunkLike } from './BroadcastMuxer';

interface VideoEncoderLike { encodeQueueSize: number; configure(config: object): void; encode(frame: VideoFrameLike, options?: { keyFrame?: boolean }): void; close(): void; }
interface VideoFrameLike { close(): void; }
interface AudioDataLike { close(): void; }
interface AudioEncoderLike { configure(config: object): void; encode(data: AudioDataLike): void; close(): void; }
interface AudioEncoderConstructor {
  new(init: { output(chunk: EncodedChunkLike): void; error(error: DOMException): void }): AudioEncoderLike;
  isConfigSupported(config: object): Promise<{ supported?: boolean }>;
}
interface TrackProcessorLike { readable: { getReader(): ReadableStreamDefaultReader<AudioDataLike> }; }
interface TrackProcessorConstructor { new(init: { track: MediaStreamTrack }): TrackProcessorLike; }
interface VideoFrameConstructor { new(source: HTMLCanvasElement, init: { timestamp: number }): VideoFrameLike; }
interface VideoEncoderConstructor {
  new(init: { output(chunk: EncodedChunkLike): void; error(error: DOMException): void }): VideoEncoderLike;
  isConfigSupported(config: object): Promise<{ supported?: boolean; config?: object }>;
}

export interface BroadcastSupport { supported: boolean; codec: string | null; reason?: string; }
export interface BroadcasterOptions { width: number; height: number; fps?: number; onPacket(packet: Uint8Array<ArrayBuffer>): void; onError?(error: Error): void; }

function constructors(): { Encoder?: VideoEncoderConstructor; Frame?: VideoFrameConstructor; AudioEncoder?: AudioEncoderConstructor; TrackProcessor?: TrackProcessorConstructor } {
  const scope = globalThis as typeof globalThis & { VideoEncoder?: VideoEncoderConstructor; VideoFrame?: VideoFrameConstructor; AudioEncoder?: AudioEncoderConstructor; MediaStreamTrackProcessor?: TrackProcessorConstructor };
  return { Encoder: scope.VideoEncoder, Frame: scope.VideoFrame, AudioEncoder: scope.AudioEncoder, TrackProcessor: scope.MediaStreamTrackProcessor };
}

export async function probeBroadcastSupport(width = 1280, height = 720, fps = 60): Promise<BroadcastSupport> {
  const { Encoder, Frame } = constructors();
  if (!Encoder || !Frame) return { supported: false, codec: null, reason: 'WebCodecs video encoding is unavailable' };
  for (const codec of ['av01.0.04M.08', 'avc1.42001f']) {
    try { if ((await Encoder.isConfigSupported({ codec, width, height, framerate: fps, bitrate: 2_500_000 })).supported) return { supported: true, codec }; } catch { continue; }
  }
  return { supported: false, codec: null, reason: 'No requested broadcast codec is supported' };
}

export function createAudioCaptureTap(context: AudioContext): MediaStreamAudioDestinationNode {
  return context.createMediaStreamDestination();
}

export class WebCodecsBroadcaster {
  private encoder: VideoEncoderLike | null = null;
  private codec: string | null = null;
  private frame = 0;
  private lastFrameTime = performance.now();
  private readonly fps: number;
  private readonly bitrate = new BitrateController();
  private configuredBitrate = 0;
  private audioEncoder: AudioEncoderLike | null = null;
  private audioReader: ReadableStreamDefaultReader<AudioDataLike> | null = null;
  private readonly canvas: HTMLCanvasElement;
  private readonly options: BroadcasterOptions;
  constructor(canvas: HTMLCanvasElement, options: BroadcasterOptions) { this.canvas = canvas; this.options = options; this.fps = options.fps ?? 60; }

  async start(): Promise<BroadcastSupport> {
    const support = await probeBroadcastSupport(this.options.width, this.options.height, this.fps); if (!support.supported || !support.codec) return support;
    const { Encoder } = constructors(); if (!Encoder) return { supported: false, codec: null, reason: 'Encoder disappeared during startup' };
    this.codec = support.codec;
    this.encoder = new Encoder({ output: chunk => this.options.onPacket(muxBroadcastChunk('video', support.codec as string, chunk)), error: error => this.options.onError?.(error) });
    this.configuredBitrate = this.bitrate.current();
    this.encoder.configure({ codec: support.codec, width: this.options.width, height: this.options.height, framerate: this.fps, bitrate: this.configuredBitrate, latencyMode: 'realtime' });
    return support;
  }

  capture(timestampMicroseconds: number): boolean {
    const { Frame } = constructors(); if (!this.encoder || !Frame || this.encoder.encodeQueueSize > 5) return false;
    const now = performance.now(); const nextBitrate = this.bitrate.sample({ encodeQueue: this.encoder.encodeQueueSize, frameTimeMs: now - this.lastFrameTime }); this.lastFrameTime = now;
    if (nextBitrate !== this.configuredBitrate && this.codec) { this.configuredBitrate = nextBitrate; this.encoder.configure({ codec: this.codec, width: this.options.width, height: this.options.height, framerate: this.fps, bitrate: nextBitrate, latencyMode: 'realtime' }); }
    const frame = new Frame(this.canvas, { timestamp: timestampMicroseconds });
    try { this.encoder.encode(frame, { keyFrame: this.frame++ % (this.fps * 2) === 0 }); } finally { frame.close(); }
    return true;
  }

  appendEncodedAudio(codec: string, chunk: EncodedChunkLike): void { this.options.onPacket(muxBroadcastChunk('audio', codec, chunk)); }
  async attachAudioStream(stream: MediaStream, codec = 'opus'): Promise<boolean> {
    const track = stream.getAudioTracks()[0]; const { AudioEncoder, TrackProcessor } = constructors(); if (!track || !AudioEncoder || !TrackProcessor) return false;
    const config = { codec, sampleRate: 48_000, numberOfChannels: 2, bitrate: 128_000 }; try { if (!(await AudioEncoder.isConfigSupported(config)).supported) return false; } catch { return false; }
    this.audioEncoder = new AudioEncoder({ output: chunk => this.appendEncodedAudio(codec, chunk), error: error => this.options.onError?.(error) }); this.audioEncoder.configure(config);
    this.audioReader = new TrackProcessor({ track }).readable.getReader(); void this.pumpAudio(); return true;
  }
  private async pumpAudio(): Promise<void> {
    const reader = this.audioReader, encoder = this.audioEncoder; if (!reader || !encoder) return;
    try { while (this.audioReader === reader) { const next = await reader.read(); if (next.done) break; try { encoder.encode(next.value); } finally { next.value.close(); } } } catch (error) { if (this.audioReader === reader) this.options.onError?.(error as Error); }
  }
  targetBitrate(): number { return this.bitrate.current(); }
  stop(): void { this.encoder?.close(); this.encoder = null; this.codec = null; this.configuredBitrate = 0; const reader = this.audioReader; this.audioReader = null; void reader?.cancel(); this.audioEncoder?.close(); this.audioEncoder = null; }
}
