import { bench, describe } from 'vitest';
import { buildFlowField, dispatchUnits, generateTacticsMap } from './TacticsSystems';
describe('RTS swarm scale',()=>{const map=generateTacticsMap(17,64,64);const field=buildFlowField(map,{x:58,y:58});const units=new Float32Array(10000*4);for(let i=0;i<10000;i++){units[i*4]=2+(i%4);units[i*4+1]=2+((i>>2)%4);}bench('dispatch 10000 RTS units',()=>{dispatchUnits(units,field.directions,map.width,10000);},{time:500});});
