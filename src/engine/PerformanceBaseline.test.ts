import { describe, expect, it } from 'vitest';
import { evaluatePerformance, PerformanceBaselineMonitor, performanceScenarioForScene } from './PerformanceBaseline';

const frame = { fps: 60, meanFrameMs: 16, p95FrameMs: 17, droppedFramePercent: 0, samples: 120 };

describe('performance baseline monitor', () => {
  it('classifies representative low, medium, and high-load scenes', () => {
    expect(performanceScenarioForScene('LobbyScene')).toBe('LOW');
    expect(performanceScenarioForScene('AsteroidsScene')).toBe('MEDIUM');
    expect(performanceScenarioForScene('DanmakuScene')).toBe('HIGH');
  });

  it('keeps bounded input samples and reports stable p95 values', () => {
    const monitor = new PerformanceBaselineMonitor(4);
    for (const value of [1, 2, 3, 30, 4]) monitor.recordInputEvent(100, 100 + value);
    for (const value of [.2, .4, .6, 4, .8]) monitor.recordInputPoll(value);
    const snapshot = monitor.snapshot(frame, 'LobbyScene', 64);
    expect(snapshot.inputEventP95Ms).toBe(30);
    expect(snapshot.inputPollP95Ms).toBe(4);
    expect(snapshot.peakHeapMegabytes).toBe(64);
    expect(snapshot.status).toBe('WARN');
  });

  it('tracks peak heap and audio underruns without changing the frame sample', () => {
    const monitor = new PerformanceBaselineMonitor();
    expect(monitor.snapshot(frame, 'DanmakuScene', 80).status).toBe('PASS');
    monitor.recordAudioUnderrun();
    const snapshot = monitor.snapshot(frame, 'DanmakuScene', 40);
    expect(snapshot.audioUnderruns).toBe(1);
    expect(snapshot.peakHeapMegabytes).toBe(80);
    expect(snapshot.samples).toBe(frame.samples);
    expect(snapshot.status).toBe('WARN');
  });

  it('evaluates insufficient warm-up samples as passing', () => {
    const snapshot = { ...frame, samples: 1, scenario: 'LOW' as const, inputEventP95Ms: 999, inputPollP95Ms: 999, heapMegabytes: 999, peakHeapMegabytes: 999, audioUnderruns: 99 };
    expect(evaluatePerformance(snapshot)).toBe('PASS');
  });
});
