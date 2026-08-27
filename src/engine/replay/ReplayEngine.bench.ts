import { bench, describe } from 'vitest';
import { ReplayRecorder, replayCompression } from './ReplayEngine';
describe('replay ledger compression',()=>{bench('compress 36000 fixed input ticks',()=>{const recorder=new ReplayRecorder('TacticsScene',7);for(let tick=0;tick<36000;tick++)recorder.record(Math.floor(tick/180)%5);replayCompression(recorder.finish());},{time:500});});
