import Phaser from 'phaser';
import { decodeCartridge, type NeonCartridge } from '../../core/scripting/CartridgeCodec';
import { HostBridge } from '../../core/scripting/HostBridge';
import { NEON_INVADER_CARTRIDGE, NEON_INVADER_STATE } from '../../core/scripting/demo/neon-invader.cart';
import { NeonBytecodeVM, NeonVmError, NeonVmQuotaError } from '../../core/scripting/vm/NeonBytecodeVM';
import { AudioEngine } from '../../engine/AudioEngine';
import { createNineSlicePanel } from '../../ui/NineSlicePanel';
import { mountNineSlicePanel } from '../../ui/NineSlicePanelRenderer';

interface DrawCommand { pathId: number; x: number; y: number; scale: number; color: number; }
const MAX_COMMANDS = 64; const FRAME_QUOTA = 100_000;

export default class CartridgePlayerScene extends Phaser.Scene {
  private vm: NeonBytecodeVM | undefined;
  private cartridge: NeonCartridge | undefined;
  private graphics!: Phaser.GameObjects.Graphics;
  private status!: Phaser.GameObjects.Text;
  private title!: Phaser.GameObjects.Text;
  private readonly commands: DrawCommand[] = Array.from({ length: MAX_COMMANDS }, () => ({ pathId: 0, x: 0, y: 0, scale: 1, color: 0 }));
  private commandCount = 0;
  private lastInstructions = 0;
  private errorText: Phaser.GameObjects.Text | undefined;
  private keys: Record<string, Phaser.Input.Keyboard.Key> | undefined;

  constructor() { super('CartridgePlayerScene'); }

  create() {
    this.add.rectangle(320, 240, 640, 480, 0x02040b); mountNineSlicePanel(this, 320, 240, 620, 446, createNineSlicePanel('HOMEBREW STUDIO // CARTRIDGE PLAYER', 'EMERALD_VECTOR'));
    this.graphics = this.add.graphics().setDepth(20); this.title = this.add.text(320, 78, '', { fontFamily: 'Courier', fontSize: '16px', color: '#88ffcc' }).setOrigin(.5).setDepth(21);
    this.status = this.add.text(22, 28, '', { fontFamily: 'Courier', fontSize: '9px', color: '#aaffdd' }).setDepth(21);
    this.add.text(320, 458, 'ARROWS OR A/D MOVE   SPACE FIRE   ENTER LOAD NEON INVADER   L LOAD FILE   ESC LOBBY', { fontFamily: 'Courier', fontSize: '8px', color: '#78a898' }).setOrigin(.5).setDepth(21);
    this.keys = this.input.keyboard?.addKeys('LEFT,RIGHT,A,D,SPACE,ENTER,L,ESC') as Record<string, Phaser.Input.Keyboard.Key> | undefined;
    this.input.keyboard?.on('keydown-ENTER', () => this.loadBuiltin()); this.input.keyboard?.on('keydown-L', () => this.openFilePicker()); this.input.keyboard?.on('keydown-ESC', () => this.scene.start('LobbyScene'));
    const drop = (event: DragEvent) => { event.preventDefault(); const file = event.dataTransfer?.files[0]; if (file) void this.loadFile(file); };
    this.game.canvas.addEventListener('dragover', event => event.preventDefault()); this.game.canvas.addEventListener('drop', drop); this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.canvas.removeEventListener('drop', drop));
    this.loadBuiltin();
  }

  update() {
    if (!this.vm || !this.cartridge) return;
    this.commandCount = 0;
    try { this.vm.rewind(); this.lastInstructions = this.vm.step(FRAME_QUOTA).executed; this.renderCommands(); this.renderStatus(); this.markCanvas('READY'); }
    catch (error) { this.showError(error instanceof NeonVmQuotaError ? 'Instruction quota exceeded' : error instanceof NeonVmError ? error.message : 'Cartridge runtime failure'); }
  }

  loadBuiltin() { this.loadCartridge(NEON_INVADER_CARTRIDGE); }
  loadCartridge(source: ArrayBuffer | Uint8Array) {
    try {
      this.cartridge = decodeCartridge(source); const bridge = new HostBridge({ drawVectorPath: (pathId, x, y, scale, color) => this.pushDraw(pathId, x, y, scale, color), playSynthNote: (_channel, _patch, note, volume) => { AudioEngine.initialize(); AudioEngine.playTone(440 * 2 ** ((note - 69) / 12), 'square', Math.max(.03, volume / 1800)); }, readInputBitmask: () => this.inputMask(), readTime: () => this.time.now | 0 });
      this.vm = new NeonBytecodeVM(this.cartridge.bytecode, bridge); this.vm.writeHeapInt32(NEON_INVADER_STATE.playerX, 320); this.vm.writeHeapInt32(NEON_INVADER_STATE.score, 0); this.vm.writeHeapInt32(NEON_INVADER_STATE.lives, 3); this.errorText?.destroy(); this.errorText = undefined; this.title.setText(`${this.cartridge.metadata.title} // ${this.cartridge.metadata.author}`);
    } catch (error) { this.vm = undefined; this.showError(error instanceof Error ? error.message : 'Invalid cartridge'); }
  }

  private inputMask() {
    let mask = 0; if (this.keys?.LEFT.isDown || this.keys?.A.isDown) mask |= 1; if (this.keys?.RIGHT.isDown || this.keys?.D.isDown) mask |= 2; if (this.keys?.SPACE.isDown) mask |= 4;
    const gamepad = navigator.getGamepads?.()[0]; if (gamepad) { if (gamepad.axes[0] < -.35 || gamepad.buttons[14]?.pressed) mask |= 1; if (gamepad.axes[0] > .35 || gamepad.buttons[15]?.pressed) mask |= 2; if (gamepad.buttons[0]?.pressed) mask |= 4; } return mask;
  }
  private pushDraw(pathId: number, x: number, y: number, scale: number, color: number) { if (this.commandCount === MAX_COMMANDS) return; const command = this.commands[this.commandCount++]; command.pathId = pathId; command.x = x; command.y = y; command.scale = scale; command.color = color; }
  private renderCommands() { this.graphics.clear(); for (let index = 0; index < this.commandCount; index += 1) { const command = this.commands[index]; this.graphics.lineStyle(Math.max(1, command.scale), command.color, .95); if (command.pathId === 1) this.graphics.strokeTriangle(command.x, command.y - 14, command.x - 15, command.y + 12, command.x + 15, command.y + 12); else if (command.pathId === 2) { this.graphics.strokeRect(command.x - 13, command.y - 8, 26, 16); this.graphics.lineBetween(command.x - 8, command.y - 12, command.x + 8, command.y - 12); } else if (command.pathId === 3) this.graphics.lineBetween(command.x, command.y, command.x, command.y - 16); } }
  private renderStatus() { if (!this.vm) return; const score = this.vm.readHeapInt32(NEON_INVADER_STATE.score); const lives = this.vm.readHeapInt32(NEON_INVADER_STATE.lives); this.status.setText(`VM ${this.lastInstructions.toString().padStart(4, '0')} / ${FRAME_QUOTA} OPS   HEAP 12 B LIVE / 1 MiB BOUND   SCORE ${score.toString().padStart(5, '0')}   LIVES ${lives}`); }
  private showError(message: string) { this.errorText?.destroy(); const panel = mountNineSlicePanel(this, 320, 248, 360, 100, createNineSlicePanel('CARTRIDGE ERROR', 'MAGENTA_HEAT')).panel.setDepth(40); const text = this.add.text(320, 250, `${message}\nPress ENTER to load Neon Invader`, { fontFamily: 'Courier', fontSize: '11px', color: '#ffb0d8', align: 'center', wordWrap: { width: 320 } }).setOrigin(.5).setDepth(41); this.errorText = text; this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => panel.destroy()); this.markCanvas('ERROR'); }
  private openFilePicker() { const input = document.createElement('input'); input.type = 'file'; input.accept = '.neongame,application/octet-stream'; input.onchange = () => { const file = input.files?.[0]; if (file) void this.loadFile(file); }; input.click(); }
  private async loadFile(file: File) { this.loadCartridge(await file.arrayBuffer()); }
  private markCanvas(state: 'READY' | 'ERROR') { const canvas = this.game.canvas; canvas.dataset.arcadeScene = 'CartridgePlayerScene'; canvas.dataset.cartridgeState = state; canvas.dataset.cartridgeTitle = this.cartridge?.metadata.title ?? ''; canvas.dataset.cartridgeInstructions = String(this.lastInstructions); canvas.dataset.cartridgeHeap = this.vm ? '12' : '0'; canvas.dataset.cartridgePlayerX = this.vm ? String(this.vm.readHeapInt32(NEON_INVADER_STATE.playerX)) : ''; canvas.dataset.cartridgeScore = this.vm ? String(this.vm.readHeapInt32(NEON_INVADER_STATE.score)) : ''; }
}
