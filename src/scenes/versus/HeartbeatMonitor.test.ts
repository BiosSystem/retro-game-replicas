import { expect, it } from 'vitest';
import { HeartbeatMonitor } from './HeartbeatMonitor';

it('interrupts, recovers, and expires a fifteen-second reconnect grace period', () => {
  const monitor = new HeartbeatMonitor(); monitor.reset(0);
  expect(monitor.tick(3001)).toBe('INTERRUPTED'); expect(monitor.secondsRemaining(3001)).toBe(15);
  expect(monitor.observe(4000)).toBe('CONNECTED'); expect(monitor.tick(7001)).toBe('INTERRUPTED');
  expect(monitor.tick(22001)).toBe('FORFEIT');
});
