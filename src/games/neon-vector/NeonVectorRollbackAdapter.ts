import { createNeonVectorRollbackState, neonVectorStateCodec, type NeonVectorRollbackState } from '../../core/netplay/ArcadeStateCodecs';
import { RollbackCoordinator, type RollbackSimulation } from '../../core/netplay/RollbackCoordinator';
import type { NetInputFrame } from '../../net/InputCodec';

export interface NeonVectorOpponentView { x: number; y: number; velocityX: number; velocityY: number; tint: number; trail: boolean; }
const simulation: RollbackSimulation<NeonVectorRollbackState> = { step(state, local, remote) { const players = state.players; players[0] += local.axisX / 127; players[1] += local.axisY / 127; players[4] += remote.axisX / 127; players[5] += remote.axisY / 127; state.frame++; } };
export class NeonVectorRollbackAdapter {
  readonly state = createNeonVectorRollbackState(); readonly rollback = new RollbackCoordinator(this.state, neonVectorStateCodec, simulation);
  advance(input: NetInputFrame) { this.rollback.advance(input); }
  receive(input: NetInputFrame) { return this.rollback.receiveRemote(input); }
  opponentView(): NeonVectorOpponentView { const p = this.state.players; return { x: p[4], y: p[5], velocityX: p[6], velocityY: p[7], tint: 0xff2ec4, trail: true }; }
  hash() { return this.rollback.stateHash(); }
}
