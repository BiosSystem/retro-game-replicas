export type SpatialRingMode = 'SHARED' | 'MESSAGE';

export interface SpatialRing {
  mode: SpatialRingMode;
  buffer: SharedArrayBuffer | ArrayBuffer;
  header: Int32Array;
  samples: Float32Array;
  capacity: number;
}

export interface RelativisticAudioParameters {
  distanceMeters: number;
  listenerTowardSource: number;
  sourceTowardListener: number;
  timeDilation: number;
  speedOfSound: number;
}

export function sharedSpatialAudioAvailable() {
  return typeof SharedArrayBuffer !== 'undefined' && globalThis.crossOriginIsolated === true;
}

export function createSpatialRing(requestedFrames = 16_384, preferShared = true): SpatialRing {
  const capacity = Math.max(256, Math.min(262_144, Math.ceil(requestedFrames / 128) * 128));
  const bytes = 8 + capacity * Float32Array.BYTES_PER_ELEMENT;
  const shared = preferShared && sharedSpatialAudioAvailable();
  const buffer = shared ? new SharedArrayBuffer(bytes) : new ArrayBuffer(bytes);
  return { mode: shared ? 'SHARED' : 'MESSAGE', buffer, header: new Int32Array(buffer, 0, 2), samples: new Float32Array(buffer, 8, capacity), capacity };
}

export function writeSpatialRing(ring: SpatialRing, input: Float32Array) {
  if (ring.mode !== 'SHARED') return 0;
  const read = Atomics.load(ring.header, 0);
  let write = Atomics.load(ring.header, 1);
  const available = ring.capacity - (write - read);
  const count = Math.max(0, Math.min(input.length, available));
  for (let index = 0; index < count; index++) ring.samples[(write + index) % ring.capacity] = input[index];
  write += count;
  Atomics.store(ring.header, 1, write);
  return count;
}

export function propagationDelaySamples(distanceMeters: number, sampleRate: number, speedOfSound = 343) {
  if (!Number.isFinite(speedOfSound) || speedOfSound <= 0 || !Number.isFinite(sampleRate) || sampleRate <= 0) throw new Error('Invalid propagation constants');
  return Math.max(0, Math.min(sampleRate * 8, Math.round(Math.max(0, distanceMeters) / speedOfSound * sampleRate)));
}

export function relativisticDopplerRatio(listenerTowardSource: number, sourceTowardListener: number, timeDilation = 1, speedOfSound = 343) {
  if (![listenerTowardSource, sourceTowardListener, timeDilation, speedOfSound].every(Number.isFinite) || speedOfSound <= 0) throw new Error('Invalid Doppler parameters');
  const listener = Math.max(-speedOfSound * 0.9, Math.min(speedOfSound * 0.9, listenerTowardSource));
  const source = Math.max(-speedOfSound * 0.9, Math.min(speedOfSound * 0.9, sourceTowardListener));
  const classical = (speedOfSound + listener) / (speedOfSound - source);
  return Math.max(0.25, Math.min(4, classical * Math.max(0.25, Math.min(4, timeDilation))));
}

export class PropagationDelayLine {
  private readonly samples: Float32Array;
  private writeIndex = 0;

  constructor(maximumDelaySamples: number) {
    this.samples = new Float32Array(Math.max(2, Math.min(524_288, Math.ceil(maximumDelaySamples) + 2)));
  }

  process(input: Float32Array, output: Float32Array, delaySamples: number, pitchRatio = 1) {
    if (output.length !== input.length) throw new Error('Audio block lengths differ');
    const delay = Math.max(0, Math.min(this.samples.length - 2, delaySamples));
    const ratio = Math.max(0.25, Math.min(4, pitchRatio));
    for (let index = 0; index < input.length; index++) {
      this.samples[this.writeIndex] = input[index];
      const fractionalRead = this.writeIndex - delay + index * (ratio - 1);
      const wrapped = ((fractionalRead % this.samples.length) + this.samples.length) % this.samples.length;
      const left = Math.floor(wrapped);
      const blend = wrapped - left;
      output[index] = this.samples[left] * (1 - blend) + this.samples[(left + 1) % this.samples.length] * blend;
      this.writeIndex = (this.writeIndex + 1) % this.samples.length;
    }
    return output;
  }
}

function workletSource() {
  return `class BiosRelativisticSpatialProcessor extends AudioWorkletProcessor {
constructor(){super();this.header=null;this.samples=null;this.capacity=0;this.queue=[];this.offset=0;this.ratio=1;this.delay=0;this.phase=0;this.hold=0;this.history=new Float32Array(Math.ceil(sampleRate*8)+2);this.historyWrite=0;this.port.onmessage=e=>{if(e.data.type==='shared'){this.header=new Int32Array(e.data.buffer,0,2);this.samples=new Float32Array(e.data.buffer,8);this.capacity=this.samples.length}else if(e.data.type==='block'){this.queue.push(new Float32Array(e.data.buffer));if(this.queue.length>16)this.queue.shift()}else if(e.data.type==='params'){this.ratio=Math.max(.25,Math.min(4,e.data.ratio));this.delay=Math.max(0,Math.min(this.history.length-2,e.data.delay))}}}
pull(){if(this.header&&this.samples){const read=Atomics.load(this.header,0),write=Atomics.load(this.header,1);if(read<write){const sample=this.samples[read%this.capacity];Atomics.store(this.header,0,read+1);return sample}}else if(this.queue.length){const block=this.queue[0],sample=block[this.offset++]||0;if(this.offset>=block.length){this.queue.shift();this.offset=0}return sample}return 0}
process(_inputs,outputs){const channels=outputs[0];if(!channels||!channels[0])return true;const out=channels[0];for(let i=0;i<out.length;i++){this.phase+=this.ratio;while(this.phase>=1){this.hold=this.pull();this.phase-=1}this.history[this.historyWrite]=this.hold;const read=(this.historyWrite-Math.floor(this.delay)+this.history.length)%this.history.length;out[i]=this.history[read];this.historyWrite=(this.historyWrite+1)%this.history.length}for(let c=1;c<channels.length;c++)channels[c].set(out);return true}}
registerProcessor('bios-relativistic-spatial',BiosRelativisticSpatialProcessor);`;
}

export interface SpatialAudioBridge {
  readonly node: AudioWorkletNode;
  readonly mode: SpatialRingMode;
  write(samples: Float32Array): number;
  configure(parameters: RelativisticAudioParameters): void;
  close(): void;
}

export async function installRelativisticSpatialWorklet(context: AudioContext, destination: AudioNode = context.destination): Promise<SpatialAudioBridge | null> {
  if (!context.audioWorklet || typeof AudioWorkletNode === 'undefined') return null;
  const url = URL.createObjectURL(new Blob([workletSource()], { type: 'text/javascript' }));
  try {
    await context.audioWorklet.addModule(url);
  } finally {
    URL.revokeObjectURL(url);
  }
  const node = new AudioWorkletNode(context, 'bios-relativistic-spatial', { numberOfOutputs: 1, outputChannelCount: [2] });
  const ring = createSpatialRing();
  if (ring.mode === 'SHARED') node.port.postMessage({ type: 'shared', buffer: ring.buffer });
  node.connect(destination);
  return {
    node,
    mode: ring.mode,
    write(samples) {
      if (ring.mode === 'SHARED') return writeSpatialRing(ring, samples);
      const copy = samples.slice();
      node.port.postMessage({ type: 'block', buffer: copy.buffer }, [copy.buffer]);
      return samples.length;
    },
    configure(parameters) {
      node.port.postMessage({
        type: 'params',
        ratio: relativisticDopplerRatio(parameters.listenerTowardSource, parameters.sourceTowardListener, parameters.timeDilation, parameters.speedOfSound),
        delay: propagationDelaySamples(parameters.distanceMeters, context.sampleRate, parameters.speedOfSound),
      });
    },
    close() { node.disconnect(); node.port.close(); },
  };
}
