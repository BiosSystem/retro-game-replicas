import Phaser from 'phaser';
import { AudioEngine } from '../../engine/AudioEngine';
import { createCloth } from '../../engine/physics/SoftBodySolver';
import { voronoiShatter, type Fragment } from '../../engine/physics/VoronoiShatter';
import { InputManager } from '../../engine/InputManager';
import { solveFabrik, type Joint } from '../../graphics/kinematics/Kinematics';
import { inputChecksum, type NetInputFrame } from '../../net/InputCodec';
import { RollbackEngine } from '../../net/rollback/RollbackEngine';
import { initialKombatState, KOMBAT_ADAPTER, kombatInput, type FighterState } from './KombatSystems';
export default class NeonKombatScene extends Phaser.Scene {
  private rollback = new RollbackEngine(initialKombatState(), KOMBAT_ADAPTER); private gfx!: Phaser.GameObjects.Graphics; private hud!: Phaser.GameObjects.Text; private accumulator = 0; private frame = 0; private cape = createCloth(6, 8, 7); private fragments: Fragment[] = [];
  constructor() { super('KombatScene'); }

  private drawArena() {
    const g = this.gfx;
    g.fillGradientStyle(0x10091f, 0x10091f, 0x172538, 0x172538).fillRect(0, 98, 640, 310);
    g.fillStyle(0x7d5860, .45).fillCircle(320, 185, 56);
    for (let index = 0; index < 14; index++) {
      const height = 38 + (index * 31) % 83; const x = index * 48;
      g.fillStyle(0x0b1423).fillRect(x, 330 - height, 42, height + 30);
      for (let y = 340 - height; y < 330; y += 15) g.fillStyle(0x538382, .4).fillRect(x + 8, y, 5, 3).fillRect(x + 25, y, 5, 3);
    }
    for (const x of [20, 600]) g.fillStyle(0x302739).fillRect(x, 100, 20, 308).fillStyle(0x685059).fillRect(x + 2, 100, 3, 308);
    g.fillStyle(0x38435b).fillRect(0, 402, 640, 6);
    g.lineStyle(1, 0x706072, .35);
    for (let x = -120; x < 800; x += 80) g.lineBetween(x, 480, 320 + (x - 320) * .55, 408);
    g.lineBetween(0, 436, 640, 436).lineBetween(0, 472, 640, 472);
  }
  create() { this.rollback = new RollbackEngine(initialKombatState(), KOMBAT_ADAPTER); this.accumulator = 0; this.frame = 0; this.cape = createCloth(6, 8, 7); this.fragments = []; this.gfx = this.add.graphics(); this.hud = this.add.text(10, 62, '', { fontFamily: 'Courier', fontSize: '13px', color: '#fff' }).setDepth(5); this.add.text(320, 18, 'NEON KOMBAT // MOONLIT ROOFTOPS', { fontFamily: 'Courier', fontSize: '18px', color: '#ffcc00', fontStyle: 'bold' }).setOrigin(.5).setDepth(5); this.input.keyboard?.on('keydown-ESC', () => this.scene.start('LobbyScene')); AudioEngine.playTrack('kombat'); }
  update(_time: number, delta: number) { this.accumulator += Math.min(50, delta); while (this.accumulator >= 1000 / 60) { this.accumulator -= 1000 / 60; this.step(); } this.cape.step(Math.min(.05, delta / 1000), 280, 3); this.draw(); }
  simulateDesync(frames = 180, delay = 8) { const reference = new RollbackEngine(initialKombatState(), KOMBAT_ADAPTER), late = new RollbackEngine(initialKombatState(), KOMBAT_ADAPTER), queue: NetInputFrame[] = []; for (let frame = 1; frame <= Math.max(1, Math.min(600, frames)); frame++) { const local = kombatInput(frame, frame % 47 === 0 ? 16 : 0, frame % 80 < 40 ? 127 : -127), remote = kombatInput(frame, frame % 53 === 0 ? 16 : 0, frame % 90 < 45 ? -127 : 127); reference.receiveRemote(remote); reference.advance(local); late.advance(local); queue.push(remote); if (queue.length > delay) late.receiveRemote(queue.shift()!); } for (const input of queue) late.receiveRemote(input); return { reference: reference.snapshot().checksum, late: late.snapshot().checksum, metrics: late.snapshot().metrics }; }
  private step() { const frame = ++this.frame, p1 = this.read(frame, 1), p2 = this.read(frame, 2); this.rollback.receiveRemote(p2); const snapshot = this.rollback.advance(p1); if (snapshot.state.p1.health < 700 && this.fragments.length === 0) this.fragments = voronoiShatter(640, 70, { x: snapshot.state.p1.x, y: 35 }, 18, 77); }
  private read(frame: number, player: 1 | 2) { const down = (action: 'UP' | 'LEFT' | 'RIGHT' | 'FIRE') => player === 1 ? InputManager.isP1Down(action) : InputManager.isP2Down(action), buttons = (down('FIRE') ? 16 : 0) | (down('UP') ? 1 : 0), axisX = down('LEFT') ? -127 : down('RIGHT') ? 127 : 0; return { frame, buttons, axisX, axisY: 0, checksum: inputChecksum(frame, buttons, axisX, 0) }; }
  private draw() { const snapshot = this.rollback.snapshot(), state = snapshot.state; this.gfx.clear().fillStyle(0x070313).fillRect(0, 0, 640, 480).fillStyle(0x221144).fillRect(0, 408, 640, 72); this.drawArena(); for (const fragment of this.fragments) { this.gfx.fillStyle(0x552266, .5); if (fragment.vertices.length >= 3) this.gfx.fillPoints(fragment.vertices, true); } this.drawFighter(state.p1, 0x00ffcc); this.drawFighter(state.p2, 0xff2e88); this.gfx.fillStyle(0x111111).fillRect(40, 42, 240, 12).fillRect(360, 42, 240, 12).fillStyle(0x00ffcc).fillRect(40, 42, 240 * state.p1.health / 1000, 12).fillStyle(0xff2e88).fillRect(600 - 240 * state.p2.health / 1000, 42, 240 * state.p2.health / 1000, 12); for (let i = 0; i < this.cape.x.length; i++) { const row = Math.floor(i / 6); this.gfx.fillStyle(0xffcc00, .25).fillCircle(state.p1.x - 24 + this.cape.x[i] * .35, state.p1.y - 65 + row * 2 + this.cape.y[i] * .25, 2); } this.hud.setText(`P1  ${Math.ceil(state.p1.health / 10)}%       TIME ${Math.ceil(state.roundTicks / 60)}       P2  ${Math.ceil(state.p2.health / 10)}%`); }
  private drawFighter(f: FighterState, color: number) {
    const g = this.gfx; const body = f.hitstun ? 0xffe0c7 : color;
    const lean = f.hitstun ? -f.facing * 6 : f.action ? f.facing * 3 : 0;
    g.fillStyle(0x01030a, .65).fillEllipse(f.x, f.y + 2, 46, 10);
    g.fillStyle(0x15212e).fillRoundedRect(f.x - 13 + lean, f.y - 51, 26, 37, 5);
    g.fillStyle(body).fillTriangle(f.x - 13 + lean, f.y - 49, f.x + 13 + lean, f.y - 49, f.x + lean, f.y - 24);
    g.fillStyle(0x30364b).fillCircle(f.x + lean, f.y - 60, 11);
    g.fillStyle(0xefd0a0).fillRect(f.x - 7 + lean, f.y - 63, 14, 7);
    g.fillStyle(body).fillRect(f.x - 10 + lean, f.y - 57, 20, 6);
    const pose = f.action === 1 ? f.facing * 28 : 0;
    for (const side of [-1, 1]) {
      const shoulder = { x: f.x + lean + side * 8, y: f.y - 43 };
      const target = { x: f.x + side * 16 + pose, y: f.y - 25 + (f.hitstun ? 8 : 0) };
      const joints: Joint[] = [shoulder, { x: shoulder.x + side * 10, y: shoulder.y + 12 }, target];
      const arm = solveFabrik(joints, [16, 16], target, 3);
      g.lineStyle(9, 0x111623).beginPath().moveTo(arm[0].x, arm[0].y).lineTo(arm[1].x, arm[1].y).lineTo(arm[2].x, arm[2].y).strokePath();
      g.lineStyle(5, body).beginPath().moveTo(arm[0].x, arm[0].y).lineTo(arm[1].x, arm[1].y).lineTo(arm[2].x, arm[2].y).strokePath();
      g.fillStyle(0xe4c299).fillCircle(arm[2].x, arm[2].y, 4);
    }
    const kick = f.action === 2 ? f.facing * 38 : 0;
    g.lineStyle(9, 0x243144).lineBetween(f.x - 6, f.y - 14, f.x - 13, f.y).lineBetween(f.x + 6, f.y - 14, f.x + 13 + kick, f.y - (kick ? 24 : 0));
    g.fillStyle(body).fillRect(f.x - 18, f.y - 5, 14, 6).fillRect(f.x + 7 + kick, f.y - (kick ? 29 : 5), 16, 6);
  }
}
