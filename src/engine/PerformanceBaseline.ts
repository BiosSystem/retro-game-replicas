import type { TelemetrySnapshot } from './FrameTelemetry';

export type PerformanceScenario = 'LOW' | 'MEDIUM' | 'HIGH';
export type BudgetStatus = 'PASS' | 'WARN';

export interface PerformanceBudget {
  p95FrameMs: number;
  droppedFramePercent: number;
  inputEventP95Ms: number;
  inputPollP95Ms: number;
  heapMegabytes: number;
  audioUnderruns: number;
}

export interface PerformanceSnapshot extends TelemetrySnapshot {
  scenario: PerformanceScenario;
  status: BudgetStatus;
  inputEventP95Ms: number;
  inputPollP95Ms: number;
  heapMegabytes: number | null;
  peakHeapMegabytes: number | null;
  audioUnderruns: number;
}

export const PERFORMANCE_BUDGETS: Readonly<Record<PerformanceScenario, PerformanceBudget>> = Object.freeze({
  LOW: { p95FrameMs: 18.5, droppedFramePercent: 5, inputEventP95Ms: 16.7, inputPollP95Ms: 1, heapMegabytes: 160, audioUnderruns: 0 },
  MEDIUM: { p95FrameMs: 21, droppedFramePercent: 10, inputEventP95Ms: 25, inputPollP95Ms: 1.5, heapMegabytes: 224, audioUnderruns: 0 },
  HIGH: { p95FrameMs: 25, droppedFramePercent: 18, inputEventP95Ms: 33.4, inputPollP95Ms: 2, heapMegabytes: 320, audioUnderruns: 0 },
});

const HIGH_LOAD_SCENES = new Set(['DanmakuScene', 'EpochScene', 'HorizonScene', 'SingularityScene', 'GenesisScene']);
const LOW_LOAD_SCENES = new Set(['LobbyScene', 'SnakeScene', 'PongScene', 'TetrisScene', 'MinesweeperScene']);

export function performanceScenarioForScene(sceneKey: string | undefined): PerformanceScenario {
  if (sceneKey && HIGH_LOAD_SCENES.has(sceneKey)) return 'HIGH';
  if (!sceneKey || LOW_LOAD_SCENES.has(sceneKey)) return 'LOW';
  return 'MEDIUM';
}

export function evaluatePerformance(snapshot: Omit<PerformanceSnapshot, 'status'>, budget = PERFORMANCE_BUDGETS[snapshot.scenario]): BudgetStatus {
  if (snapshot.samples < 2) return 'PASS';
  if (snapshot.p95FrameMs > budget.p95FrameMs || snapshot.droppedFramePercent > budget.droppedFramePercent) return 'WARN';
  if (snapshot.inputEventP95Ms > budget.inputEventP95Ms || snapshot.inputPollP95Ms > budget.inputPollP95Ms) return 'WARN';
  if (snapshot.peakHeapMegabytes !== null && snapshot.peakHeapMegabytes > budget.heapMegabytes) return 'WARN';
  return snapshot.audioUnderruns > budget.audioUnderruns ? 'WARN' : 'PASS';
}

export class PerformanceBaselineMonitor {
  private readonly inputEvents: SampleRing;
  private readonly inputPolls: SampleRing;
  private audioUnderruns = 0;
  private peakHeapMegabytes: number | null = null;

  constructor(capacity = 120) {
    this.inputEvents = new SampleRing(capacity);
    this.inputPolls = new SampleRing(capacity);
  }

  recordInputEvent(eventTime: number, sampledAt: number) {
    this.inputEvents.record(Math.max(0, sampledAt - normalizeEventTime(eventTime, sampledAt)));
  }

  recordInputPoll(durationMs: number) { this.inputPolls.record(durationMs); }
  recordAudioUnderrun(count = 1) { this.audioUnderruns += Math.max(1, Math.min(1024, Math.floor(Number.isFinite(count) ? count : 1))); }

  snapshot(frame: TelemetrySnapshot, sceneKey: string | undefined, heapMegabytes = readHeapMegabytes()): PerformanceSnapshot {
    if (heapMegabytes !== null) this.peakHeapMegabytes = Math.max(this.peakHeapMegabytes ?? 0, heapMegabytes);
    const base = {
      ...frame,
      scenario: performanceScenarioForScene(sceneKey),
      inputEventP95Ms: this.inputEvents.p95(),
      inputPollP95Ms: this.inputPolls.p95(),
      heapMegabytes,
      peakHeapMegabytes: this.peakHeapMegabytes,
      audioUnderruns: this.audioUnderruns,
    };
    return { ...base, status: evaluatePerformance(base) };
  }
}

class SampleRing {
  private readonly values: Float32Array;
  private cursor = 0;
  private count = 0;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 2) throw new Error('Performance sample capacity must be at least two');
    this.values = new Float32Array(capacity);
  }

  record(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 1000) return;
    this.values[this.cursor] = value;
    this.cursor = (this.cursor + 1) % this.values.length;
    this.count = Math.min(this.values.length, this.count + 1);
  }

  p95() {
    if (!this.count) return 0;
    const ordered = Array.from(this.values.slice(0, this.count)).sort((a, b) => a - b);
    return ordered[Math.min(ordered.length - 1, Math.ceil(ordered.length * 0.95) - 1)];
  }
}

function normalizeEventTime(eventTime: number, sampledAt: number) {
  if (!Number.isFinite(eventTime) || eventTime < 0 || eventTime > sampledAt + 1000) return sampledAt;
  return eventTime;
}

function readHeapMegabytes() {
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return memory ? memory.usedJSHeapSize / 1048576 : null;
}
