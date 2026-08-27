import { bench, describe } from 'vitest';
import { FrameTelemetry } from './FrameTelemetry';

describe('telemetry ring stress', () => {
  const telemetry = new FrameTelemetry(240);
  bench('record 100000 frames and calculate a snapshot', () => {
    for (let index = 0; index < 100000; index++) telemetry.record(16 + index % 5);
    telemetry.snapshot();
  });
});
