/*
 * Copyright (c) 2026 by BiosSystem Open Source Community. All Rights Reserved.
 * Universal Retro Arcade | https://github.com/BiosSystem/retro-game-replicas
 */
import Phaser from 'phaser';
import { SaveManager } from '../engine/SaveManager';
import { AchievementManager } from '../engine/AchievementManager';
import { AudioEngine } from '../engine/AudioEngine';
import { InputManager } from '../engine/InputManager';
import { AttractController, CreditLedger } from '../ui/menu/ArcadeSession';
import { mountGameScene } from '../ui/menu/SceneLifecycle';
import type { ArcadeMode } from '../multiplayer/CoopSession';
type MenuMode = 'GAME_SELECT' | 'DIFFICULTY_SELECT';

const PALETTE = {
  bg:       0x000005,
  primary:  '#00ff6e',
  dim:      '#006e30',
  accent:   '#00ffcc',
  warn:     '#ffcc00',
  danger:   '#ff2255',
  white:    '#ffffff',
  muted:    '#888888',
};

export default class LobbyScene extends Phaser.Scene {
  private games = [
    { name: 'SNAKE EVOLUTION',  scene: 'SnakeScene',       icon: '🐍' },
    { name: 'NEON PONG',        scene: 'PongScene',         icon: '🏓' },
    { name: 'NEON VECTOR',      scene: 'AsteroidsScene',    icon: '🚀' },
    { name: 'NEON BREAKOUT',    scene: 'BreakoutScene',     icon: '🧱' },
    { name: 'FROGGIE CROSSER',  scene: 'FroggerScene',      icon: '🐸' },
    { name: 'SPACE DEFENDERS',  scene: 'InvadersScene',     icon: '👾' },
    { name: 'TETRIS PULSE',     scene: 'TetrisScene',       icon: '🟦' },
    { name: 'MINESWEEPER',      scene: 'MinesweeperScene',  icon: '💣' },
    { name: 'PIXEL RUNNER',     scene: 'RunnerScene',       icon: '🏃' },
    { name: 'BRAVE BIRD',       scene: 'BirdScene',         icon: '🐦' },
    { name: 'CYBER CHASM',      scene: 'CyberScene',        icon: '⚡' },
    { name: 'NEON RETRO RACER', scene: 'RacerScene',        icon: '🏁' },
    { name: 'NEON CYBER-CASTER',scene: 'RaycasterScene',     icon: '🔫' },
    { name: 'META-ARCADE HALL', scene: 'MetaArcadeScene',    icon: '🏛️' },
    { name: 'NEON TACTICS',     scene: 'TacticsScene',       icon: '♟️' },
    { name: 'NEON LABYRINTH',   scene: 'LabyrinthScene',     icon: '🕸️' },
    { name: 'NEON DANMAKU',     scene: 'DanmakuScene',       icon: '✦' },
    { name: 'NEON KOMBAT',      scene: 'KombatScene',        icon: '🥊' },
    { name: 'NEON ODYSSEY',     scene: 'OdysseyScene',       icon: '◉' },
    { name: 'NEON CHRONO',      scene: 'ChronoScene',        icon: '⌛' },
    { name: 'NEON PARADOX',     scene: 'ParadoxScene',       icon: '◇' },
  ];

  private difficulties = [
    { name: 'EASY',    id: 'EASY',   color: PALETTE.accent,  desc: 'Relaxed pace, forgiving AI.' },
    { name: 'NORMAL',  id: 'NORMAL', color: PALETTE.primary, desc: 'Balanced arcade challenge.' },
    { name: 'HARD',    id: 'HARD',   color: PALETTE.warn,    desc: 'High speed, aggressive AI.' },
    { name: 'EXPERT',  id: 'EXPERT', color: PALETTE.danger,  desc: 'Maximum velocity. Extreme.' },
  ];

  private selectedGameIndex  = 0;
  private selectedDiffIndex  = 1;
  private gameItems: Phaser.GameObjects.Text[] = [];
  private diffItems: Phaser.GameObjects.Text[] = [];
  private mode: MenuMode = 'GAME_SELECT';
  private diffContainer!: Phaser.GameObjects.Container;
  private diffDescText!: Phaser.GameObjects.Text;
  private scanlineGfx!: Phaser.GameObjects.Graphics;
  private starGfx!: Phaser.GameObjects.Graphics;
  private biosFlash!: Phaser.GameObjects.Text;
  private secretBuffer = '';
  private credits!: CreditLedger;
  private attract!: AttractController;
  private creditText!: Phaser.GameObjects.Text;
  private attractText!: Phaser.GameObjects.Text;
  private previewGfx!: Phaser.GameObjects.Graphics;
  private nextAttractCycle = 0;
  private selectionCursor!: Phaser.GameObjects.Text;
  private arcadeMode: ArcadeMode = 'SOLO';
  private modeText!: Phaser.GameObjects.Text;

  constructor() { super('LobbyScene'); }

  create() {
    this.gameItems   = [];
    this.diffItems   = [];
    this.mode        = 'GAME_SELECT';
    this.secretBuffer = '';
    this.credits = new CreditLedger(localStorage);
    this.attract = new AttractController(30_000, this.time.now);
    this.nextAttractCycle = this.time.now + 30_000;
    this.input.keyboard?.removeAllListeners();

    // Reset gamepad flags
    this.gamepadConnected = false;
    this.padLastState = { up: false, down: false, button: false, back: false };

    this.buildStarfield();
    this.buildScanlines();
    this.buildHeader();
    this.buildGameList();
    this.buildFooter();
    this.buildDiffModal();
    this.buildBiosFlash();
    this.buildCoinOp();
    this.buildPreview();
    this.modeText = this.add.text(616, 420, '', { fontFamily: 'Courier', fontSize: '12px', color: PALETTE.warn }).setOrigin(1, 0.5);
    this.updateModeText();
    this.buildCrtShader();
    this.bindKeys();
    this.bindGamepad();
    AudioEngine.playTrack('plaza');
  }

  private gamepadConnected = false;
  private padLastState = { up: false, down: false, button: false, back: false };
  private isCrtEnabled = false;

  private buildCrtShader() {
    // We'll apply built-in Phaser FX for the CRT look
    this.isCrtEnabled = localStorage.getItem('arcade_crt') === 'true';
    if (this.isCrtEnabled) {
      this.applyCrt();
    }
  }

  private applyCrt() {
    const filters = this.cameras.main.filters.internal;
    filters.clear();
    filters.addBarrel(1.02);
    filters.addVignette(0.5, 0.5, 0.7);
    const color = filters.addColorMatrix();
    if (color && color.colorMatrix) {
      color.colorMatrix.sepia();
      color.colorMatrix.saturate(2);
    }
  }

  private toggleCrt() {
    this.isCrtEnabled = !this.isCrtEnabled;
    localStorage.setItem('arcade_crt', this.isCrtEnabled ? 'true' : 'false');
    if (this.isCrtEnabled) {
      this.applyCrt();
    } else {
      this.cameras.main.filters.internal.clear();
    }
  }


  private buildStarfield() {
    this.starGfx = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const x    = Phaser.Math.Between(0, 640);
      const y    = Phaser.Math.Between(0, 480);
      const size = Math.random() < 0.15 ? 1.5 : 0.8;
      const alpha = Phaser.Math.FloatBetween(0.2, 0.7);
      this.starGfx.fillStyle(0xffffff, alpha);
      this.starGfx.fillCircle(x, y, size);
    }
  }

  private buildScanlines() {
    this.scanlineGfx = this.add.graphics();
    this.scanlineGfx.setAlpha(0.07);
    this.scanlineGfx.setDepth(100);
    this.scanlineGfx.fillStyle(0x000000);
    for (let y = 0; y < 480; y += 4) {
      this.scanlineGfx.fillRect(0, y, 640, 2);
    }
  }

  private buildHeader() {
    // Top border line
    const line = this.add.graphics();
    line.lineStyle(1, 0x00ff6e, 0.4);
    line.lineBetween(40, 108, 600, 108);

    this.add.text(320, 30, '▸ UNIVERSAL RETRO ARCADE ◂', {
      fontFamily: "'Share Tech Mono', Courier",
      fontSize: '30px',
      color: PALETTE.primary,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(320, 66, 'BIOSYSTEM ENGINE - SELECT YOUR GAME', {
      fontFamily: "'Share Tech Mono', Courier",
      fontSize: '13px',
      color: PALETTE.dim,
      letterSpacing: 3,
    }).setOrigin(0.5);

    // Animated corner brackets
    this.add.text(20, 14, '┌─', { fontFamily: 'Courier', fontSize: '14px', color: PALETTE.dim }).setOrigin(0);
    this.add.text(620, 14, '─┐', { fontFamily: 'Courier', fontSize: '14px', color: PALETTE.dim }).setOrigin(1, 0);
    this.add.text(20, 466, '└─', { fontFamily: 'Courier', fontSize: '14px', color: PALETTE.dim }).setOrigin(0, 1);
    this.add.text(620, 466, '─┘', { fontFamily: 'Courier', fontSize: '14px', color: PALETTE.dim }).setOrigin(1, 1);
  }

  private buildGameList() {
    this.games.forEach((game, i) => {
      const isSelected = i === this.selectedGameIndex;
      const y          = 94 + i * 15;

      const label  = `${game.icon}  ${game.name}`;
      const color  = isSelected ? PALETTE.white : PALETTE.dim;
      const fsize  = isSelected ? '18px' : '16px';

      const item = this.add.text(320, y, label, {
        fontFamily: "'Share Tech Mono', Courier",
        fontSize: fsize,
        color,
      }).setOrigin(0.5);
      
      // Show highest score across normal/hard for display
      let maxData = SaveManager.getHighScoreData(game.scene, 'NORMAL');
      const diffs = ['HARD', 'EXPERT', 'EASY'];
      for (const d of diffs) {
          const dt = SaveManager.getHighScoreData(game.scene, d);
          if (dt.score > maxData.score) maxData = dt;
      }
      
      const scoreItem = this.add.text(490, y, `HI: ${maxData.score} [${maxData.name}]`, {
        fontFamily: "'Share Tech Mono', Courier",
        fontSize: '11px',
        color: PALETTE.muted,
      }).setOrigin(0, 0.5);

      if (isSelected) {
        item.setScale(1.06);
        this.selectionCursor = this.add.text(140, y, '▶', {
          fontFamily: 'Courier',
          fontSize: '18px',
          color: PALETTE.primary,
        }).setOrigin(0.5);
        scoreItem.setColor(PALETTE.accent);
      }

      this.gameItems.push(item);
    });
  }

  private buildFooter() {
    this.add.text(320, 458, 'UP/DOWN MOVE  SPACE SELECT  M MODE  C COIN  S SETTINGS  O MODS', {
      fontFamily: "'Share Tech Mono', Courier",
      fontSize: '11px',
      color: PALETTE.muted,
      letterSpacing: 1,
    }).setOrigin(0.5);
  }

  private buildCoinOp() {
    this.creditText = this.add.text(24, 438, '', { fontFamily: 'Courier', fontSize: '13px', color: PALETTE.warn }).setOrigin(0, 0.5);
    this.attractText = this.add.text(616, 438, '', { fontFamily: 'Courier', fontSize: '12px', color: PALETTE.accent }).setOrigin(1, 0.5);
    this.updateCreditText();
  }

  private buildPreview() {
    this.previewGfx = this.add.graphics().setDepth(5);
    this.drawPreview(0);
  }

  private drawPreview(phase: number) {
    const x = 76;
    const y = 275;
    const pulse = Math.sin(phase * 0.006) * 5;
    this.previewGfx.clear().lineStyle(1, 0x00ffcc, 0.45).strokeRoundedRect(24, 225, 104, 100, 4);
    this.previewGfx.lineStyle(2, 0x00ff6e, 0.9);
    const mode = this.selectedGameIndex % 3;
    if (mode === 0) this.previewGfx.strokeTriangle(x, y - 16 + pulse, x - 13, y + 13, x + 13, y + 13);
    else if (mode === 1) { this.previewGfx.strokeCircle(x, y, 18 + pulse * 0.2); this.previewGfx.lineBetween(42, y + pulse, 110, y - pulse); }
    else { this.previewGfx.strokeRect(x - 18, y - 18, 36, 36); this.previewGfx.lineBetween(x - 24, y, x + 24, y); }
  }

  private updateCreditText() {
    const state = this.credits.snapshot();
    this.creditText?.setText(state.freePlay ? 'FREE PLAY' : `CREDITS ${state.credits.toString().padStart(2, '0')}`);
  }

  private buildDiffModal() {
    this.diffContainer = this.add.container(0, 0);

    const bg = this.add.rectangle(320, 270, 420, 260, 0x020210, 0.97);
    bg.setStrokeStyle(1.5, 0x00ffcc, 0.7);
    this.diffContainer.add(bg);

    // Inner glow border (decorative)
    const innerBg = this.add.rectangle(320, 270, 410, 250, 0x00ffcc, 0.03);
    this.diffContainer.add(innerBg);

    const title = this.add.text(320, 160, 'DIFFICULTY', {
      fontFamily: "'Share Tech Mono', Courier",
      fontSize: '22px',
      color: PALETTE.accent,
      fontStyle: 'bold',
      letterSpacing: 6,
    }).setOrigin(0.5);
    this.diffContainer.add(title);

    this.difficulties.forEach((diff, i) => {
      const isSelected = i === this.selectedDiffIndex;
      const y          = 218 + i * 38;

      const item = this.add.text(320, y, `[ ${diff.name} ]`, {
        fontFamily: "'Share Tech Mono', Courier",
        fontSize: '20px',
        color: isSelected ? PALETTE.white : diff.color,
      }).setOrigin(0.5);

      if (isSelected) item.setScale(1.08);
      this.diffItems.push(item);
      this.diffContainer.add(item);
    });

    this.diffDescText = this.add.text(320, 380, this.difficulties[this.selectedDiffIndex].desc, {
      fontFamily: "'Share Tech Mono', Courier",
      fontSize: '13px',
      color: PALETTE.muted,
      align: 'center',
      wordWrap: { width: 380 },
    }).setOrigin(0.5);
    this.diffContainer.add(this.diffDescText);

    this.diffContainer.setVisible(false);
  }

  private buildBiosFlash() {
    this.biosFlash = this.add.text(320, 240,
      '⚡ BIOSYSTEM KERNEL ⚡\nTauri Quantum Core v2.0 - Active',
      {
        fontFamily: "'Share Tech Mono', Courier",
        fontSize: '18px',
        color: '#ffff00',
        align: 'center',
        backgroundColor: '#000000cc',
        padding: { x: 20, y: 12 },
      }
    ).setOrigin(0.5).setDepth(200).setAlpha(0).setVisible(false);
  }

  private bindKeys() {
    this.input.keyboard?.on('keydown-UP',    () => this.handleUp());
    this.input.keyboard?.on('keydown-DOWN',  () => this.handleDown());
    this.input.keyboard?.on('keydown-SPACE', () => this.handleSpace());
    this.input.keyboard?.on('keydown-ENTER', () => this.handleSpace());
    this.input.keyboard?.on('keydown-ESC',   () => this.handleEsc());
    this.input.keyboard?.on('keydown-S',     () => {
        if (this.mode !== 'DIFFICULTY_SELECT') this.scene.launch('SettingsScene', { scene: this.scene.key });
    });
    this.input.keyboard?.on('keydown-A',     () => {
        if (this.mode !== 'DIFFICULTY_SELECT') this.scene.launch('AchievementsScene');
    });
    this.input.keyboard?.on('keydown-C', () => { this.registerActivity(); this.credits.insertCoin(); this.updateCreditText(); AudioEngine.playEffect('COIN'); });
    this.input.keyboard?.on('keydown-F', () => { this.registerActivity(); this.credits.toggleFreePlay(); this.updateCreditText(); AudioEngine.playEffect('POWER_UP'); });
    this.input.keyboard?.on('keydown-M', () => {
      const modes: ArcadeMode[] = ['SOLO', 'COOP', 'VERSUS'];
      this.arcadeMode = modes[(modes.indexOf(this.arcadeMode) + 1) % modes.length];
      this.updateModeText(); AudioEngine.playEffect('POWER_UP');
    });

    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      this.registerActivity();
      this.attractText.setText('');
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
        this.toggleCrt();
        return;
      }

      this.secretBuffer = (this.secretBuffer + e.key.toUpperCase()).slice(-10);
      if (this.secretBuffer.includes('BIOS')) {
        this.secretBuffer = '';
        this.triggerBiosEgg();
      }
    });
  }

  private bindGamepad() {
    this.input.gamepad?.once('connected', () => {
      this.gamepadConnected = true;
      this.add.text(320, 90, '🎮 GAMEPAD CONNECTED', {
        fontFamily: "'Share Tech Mono', Courier",
        fontSize: '14px',
        color: PALETTE.primary,
        fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0.8);
    });
  }

  update() {
    this.drawPreview(this.time.now);
    if (this.attract.isActive(this.time.now)) {
      this.attractText.setText('ATTRACT MODE');
      if (this.time.now >= this.nextAttractCycle) {
        this.nextAttractCycle = this.time.now + 4000;
        this.updateGameSelection(1);
      }
    }
    if (this.gamepadConnected && this.input.gamepad && this.input.gamepad.total > 0) {
      const pad = this.input.gamepad.getPad(0);
      if (!pad) return;

      const up = pad.up || pad.leftStick.y < -0.5;
      const down = pad.down || pad.leftStick.y > 0.5;
      const button = !!(pad.A || pad.B || pad.X || pad.Y);
      const back = !!(pad.B || pad.L1);

      if (up && !this.padLastState.up) { this.registerActivity(); this.handleUp(); }
      if (down && !this.padLastState.down) { this.registerActivity(); this.handleDown(); }
      if (button && !this.padLastState.button) { this.registerActivity(); this.handleSpace(); }
      if (back && !this.padLastState.back) { this.registerActivity(); this.handleEsc(); }

      this.padLastState = { up, down, button, back };
    }
  }

  private triggerBiosEgg() {
    this.biosFlash.setVisible(true).setAlpha(0);
    this.tweens.add({
      targets: this.biosFlash,
      alpha:   1,
      duration: 200,
      yoyo:    true,
      hold:    1800,
      onComplete: () => this.biosFlash.setVisible(false),
    });
  }

  handleUp()    { this.mode === 'GAME_SELECT' ? this.updateGameSelection(-1) : this.updateDiffSelection(-1); }
  handleDown()  { this.mode === 'GAME_SELECT' ? this.updateGameSelection(1)  : this.updateDiffSelection(1); }

  handleSpace() {
    if (this.mode === 'GAME_SELECT') {
      this.mode = 'DIFFICULTY_SELECT';
      this.gameItems.forEach(item => item.setAlpha(0.18));
      this.diffContainer.setVisible(true).setScale(0.88).setAlpha(0);
      this.tweens.add({ targets: this.diffContainer, scale: 1, alpha: 1, duration: 180, ease: 'Back.easeOut' });
    } else {
      if (!this.credits.consume()) {
        this.diffDescText.setText('INSERT COIN - PRESS C');
        AudioEngine.playTone(120, 'square', 0.15);
        return;
      }
      this.updateCreditText();
      const game = this.games[this.selectedGameIndex];
      const diff = this.difficulties[this.selectedDiffIndex];
      this.cameras.main.fade(200, 0, 0, 0);
      this.time.delayedCall(200, async () => {
          InputManager.configureArcadeMode(this.arcadeMode, ['AsteroidsScene', 'RunnerScene', 'PongScene'].includes(game.scene));
          AchievementManager.recordPlay(game.scene);
          if (game.scene === 'InvadersScene') AudioEngine.playTrack('space');
          else if (game.scene === 'RunnerScene') AudioEngine.playTrack('sprint');
          else if (game.scene === 'RacerScene') AudioEngine.playTrack('racer');
          else if (game.scene === 'RaycasterScene') AudioEngine.playTrack('caster');
          else if (game.scene === 'TacticsScene') AudioEngine.playTrack('tactics');
          else if (game.scene === 'LabyrinthScene') AudioEngine.playTrack('labyrinth');
          else if (game.scene === 'DanmakuScene') AudioEngine.playTrack('danmaku');
          else if (game.scene === 'KombatScene') AudioEngine.playTrack('kombat');
          else if (game.scene === 'OdysseyScene') AudioEngine.playTrack('odyssey');
          else if (game.scene === 'AsteroidsScene') AudioEngine.playTrack('vector');
          else AudioEngine.stopTrack();
          await mountGameScene({
            has: key => Boolean(this.scene.manager.keys[key]),
            add: (key, SceneClass) => this.scene.add(key, SceneClass, false),
            start: (key, sceneData) => this.scene.start(key, sceneData),
          }, game.scene, { difficulty: diff.id, mode: this.arcadeMode });
      });
    }
  }

  handleEsc() {
    if (this.mode === 'DIFFICULTY_SELECT') {
      this.mode = 'GAME_SELECT';
      this.gameItems.forEach(item => item.setAlpha(1));
      this.tweens.add({
        targets: this.diffContainer,
        alpha: 0, scale: 0.9,
        duration: 120,
        onComplete: () => this.diffContainer.setVisible(false),
      });
    }
  }

  updateGameSelection(change: number) {
    const prev = this.selectedGameIndex;
    this.selectedGameIndex = Phaser.Math.Wrap(prev + change, 0, this.games.length);

    this.gameItems[prev].setColor(PALETTE.dim).setScale(1).setFontSize('18px');
    this.gameItems[this.selectedGameIndex].setColor(PALETTE.white).setScale(1.06).setFontSize('20px');
    this.selectionCursor?.setY(96 + this.selectedGameIndex * 17);

    this.tweens.add({ targets: this.gameItems[this.selectedGameIndex], scale: 1.1, duration: 80, yoyo: true });
  }

  updateDiffSelection(change: number) {
    const prev    = this.selectedDiffIndex;
    const prevDiff = this.difficulties[prev];
    this.diffItems[prev].setColor(prevDiff.color).setScale(1);

    this.selectedDiffIndex = Phaser.Math.Wrap(prev + change, 0, this.difficulties.length);
    this.diffItems[this.selectedDiffIndex].setColor(PALETTE.white).setScale(1.08);
    this.diffDescText.setText(this.difficulties[this.selectedDiffIndex].desc);

    this.tweens.add({ targets: this.diffItems[this.selectedDiffIndex], scale: 1.14, duration: 80, yoyo: true });
  }

  private registerActivity() {
    this.attract.registerInput(this.time.now);
    this.nextAttractCycle = this.time.now + 30_000;
  }

  private updateModeText() { this.modeText?.setText(`MODE ${this.arcadeMode}`); }
}
