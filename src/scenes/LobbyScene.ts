/*
 * Copyright (c) 2026 by BiosSystem Open Source Community. All Rights Reserved.
 * BiosSystem Neon Arcade | https://github.com/BiosSystem/retro-game-replicas
 */
import Phaser from 'phaser';
import { SaveManager } from '../engine/SaveManager';
import { AchievementManager } from '../engine/AchievementManager';
import { AudioEngine } from '../engine/AudioEngine';
import { InputManager } from '../engine/InputManager';
import { GamepadButton } from '../engine/input/GamepadHandler';
import { AttractController, CreditLedger } from '../ui/menu/ArcadeSession';
import { mountGameScene } from '../ui/menu/SceneLifecycle';
import type { ArcadeMode } from '../multiplayer/CoopSession';
import { ARCADE_DIFFICULTIES, ARCADE_GAMES } from './ArcadeCatalog';
import { drawRetroAvatar } from '../ui/profile/RetroProfile';
import { CabinetPalette, createNineSlicePanel, type CabinetPaletteName } from '../ui/NineSlicePanel';
import { mountNineSlicePanel } from '../ui/NineSlicePanelRenderer';
import { loadPlayerProfileCard, setPlayerProfilePalette } from '../ui/PlayerProfileCard';
import { LobbyCarousel } from './lobby/LobbyCarousel';
import { cabinetAudioManager } from '../core/audio/CabinetAudioManager';
import type { TRACKS } from '../audio/bgm/tracks';
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

const CABINET_TRACKS: Partial<Record<string, keyof typeof TRACKS>> = {
  InvadersScene: 'space', RunnerScene: 'sprint', RacerScene: 'racer', RaycasterScene: 'caster', TacticsScene: 'tactics',
  LabyrinthScene: 'labyrinth', DanmakuScene: 'danmaku', KombatScene: 'kombat', OdysseyScene: 'odyssey', AsteroidsScene: 'vector',
};

export default class LobbyScene extends Phaser.Scene {
  private readonly games = ARCADE_GAMES;
  private readonly difficulties = ARCADE_DIFFICULTIES;

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
  private carousel = new LobbyCarousel(this.games.length);
  private palette: CabinetPaletteName = 'CYAN_SYNTH';
  private profilePaletteText!: Phaser.GameObjects.Text;
  private marqueeText!: Phaser.GameObjects.Text;
  private customizedCabinets = new Set<string>();

  constructor() { super('LobbyScene'); }

  create() {
    this.gameItems   = [];
    this.diffItems   = [];
    this.mode        = 'GAME_SELECT';
    this.secretBuffer = '';
    this.carousel = new LobbyCarousel(this.games.length);
    this.customizedCabinets = readCustomizedCabinetScenes();
    this.credits = new CreditLedger(localStorage);
    this.attract = new AttractController(30_000, this.time.now);
    this.nextAttractCycle = this.time.now + 30_000;
    this.input.keyboard?.removeAllListeners();

    this.padLastState = { up: false, down: false, button: false, back: false, start: false, achievements: false, profile: false };

    this.buildStarfield();
    this.buildScanlines();
    this.buildHeader();
    this.buildGameList();
    this.buildFooter();
    this.buildDiffModal();
    this.buildBiosFlash();
    this.buildCoinOp();
    this.buildPreview();
    this.buildProfile();
    this.modeText = this.add.text(616, 420, '', { fontFamily: 'Courier', fontSize: '12px', color: PALETTE.warn }).setOrigin(1, 0.5);
    this.updateModeText();
    this.bindKeys();
    AudioEngine.playTrack('plaza');
  }

  private padLastState = { up: false, down: false, button: false, back: false, start: false, achievements: false, profile: false };


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

    this.add.text(320, 30, '▸ BIOSSYSTEM NEON ARCADE ◂', {
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
      const y          = 92 + i * 12;

      const label  = `${game.icon}  ${game.name}`;
      const color  = isSelected ? PALETTE.white : PALETTE.dim;
      const fsize  = isSelected ? '17px' : '15px';

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
    this.add.text(320, 458, 'MOVE  FIRE SELECT  Y ACH  X PROFILE  T THEME  M MODE  C COIN  START SETTINGS', {
      fontFamily: "'Share Tech Mono', Courier",
      fontSize: '11px',
      color: PALETTE.muted,
      letterSpacing: 1,
    }).setOrigin(0.5);
  }

  private buildProfile() {
    const card = loadPlayerProfileCard(localStorage);
    const profile = card.profile;
    this.palette = card.palette;
    mountNineSlicePanel(this, 590, 57, 76, 76, createNineSlicePanel('PROFILE', this.palette)).panel.setDepth(6);
    const avatar = this.add.graphics().setDepth(7); drawRetroAvatar(avatar, 590, 53, 48, profile.avatarSeed);
    this.add.text(590, 87, profile.name, { fontFamily: 'Courier', fontSize: '10px', color: '#ffffff' }).setOrigin(.5).setDepth(7);
    this.add.text(590, 98, card.title, { fontFamily: 'Courier', fontSize: '7px', color: '#8899aa' }).setOrigin(.5).setDepth(7);
    this.profilePaletteText = this.add.text(590, 107, `${card.pingLabel}  ${paletteLabel(this.palette)}`, { fontFamily: 'Courier', fontSize: '6px', color: CabinetPalette[this.palette] }).setOrigin(.5).setDepth(7);
  }

  private buildCoinOp() {
    this.creditText = this.add.text(24, 438, '', { fontFamily: 'Courier', fontSize: '13px', color: PALETTE.warn }).setOrigin(0, 0.5);
    this.attractText = this.add.text(616, 438, '', { fontFamily: 'Courier', fontSize: '12px', color: PALETTE.accent }).setOrigin(1, 0.5);
    this.updateCreditText();
  }

  private buildPreview() {
    this.previewGfx = this.add.graphics().setDepth(5);
    this.marqueeText = this.add.text(76, 218, this.games[this.selectedGameIndex].name, { fontFamily: "'Share Tech Mono', Courier", fontSize: '9px', color: PALETTE.accent, align: 'center', wordWrap: { width: 110 } }).setOrigin(.5).setDepth(6);
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
    if (this.customizedCabinets.has(this.games[this.selectedGameIndex].scene)) {
      this.previewGfx.lineStyle(2, 0xff2ec4, .8).strokeRect(29, 231, 96, 88).lineBetween(33, 312, 120, 239).lineBetween(33, 239, 120, 312);
    }
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

    this.diffDescText = this.add.text(320, 380, this.difficulties[this.selectedDiffIndex].description, {
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
    this.input.keyboard?.on('keydown-P', () => {
      if (this.mode !== 'DIFFICULTY_SELECT') this.scene.launch('ProfileScene');
    });
    this.input.keyboard?.on('keydown-C', () => { this.registerActivity(); this.credits.insertCoin(); this.updateCreditText(); AudioEngine.playEffect('COIN'); });
    this.input.keyboard?.on('keydown-F', () => { this.registerActivity(); this.credits.toggleFreePlay(); this.updateCreditText(); AudioEngine.playEffect('POWER_UP'); });
    this.input.keyboard?.on('keydown-M', () => {
      const modes: ArcadeMode[] = ['SOLO', 'COOP', 'VERSUS'];
      this.arcadeMode = modes[(modes.indexOf(this.arcadeMode) + 1) % modes.length];
      this.updateModeText(); AudioEngine.playEffect('POWER_UP');
    });
    this.input.keyboard?.on('keydown-T', () => this.cyclePalette());

    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      this.registerActivity();
      this.attractText.setText('');
      this.secretBuffer = (this.secretBuffer + e.key.toUpperCase()).slice(-10);
      if (this.secretBuffer.includes('BIOS')) {
        this.secretBuffer = '';
        this.triggerBiosEgg();
      }
    });
  }

  update(_time: number, delta: number) {
    const carousel = this.carousel.update(delta);
    this.previewGfx.setX((carousel.position - this.selectedGameIndex) * 10);
    this.drawPreview(this.time.now);
    if (this.attract.isActive(this.time.now)) {
      this.attractText.setText('ATTRACT MODE');
      if (this.time.now >= this.nextAttractCycle) {
        this.nextAttractCycle = this.time.now + 4000;
        this.updateGameSelection(1);
      }
    }
    const pad = InputManager.getGamepadFrames()[0];
    if (pad) {
      const up = Boolean(pad.buttons & GamepadButton.DPAD_UP) || pad.leftY < -0.5;
      const down = Boolean(pad.buttons & GamepadButton.DPAD_DOWN) || pad.leftY > 0.5;
      const button = Boolean(pad.buttons & GamepadButton.SOUTH);
      const back = Boolean(pad.buttons & (GamepadButton.EAST | GamepadButton.SELECT));
      const start = Boolean(pad.buttons & GamepadButton.START);
      const achievements = Boolean(pad.buttons & GamepadButton.NORTH);
      const profile = Boolean(pad.buttons & GamepadButton.WEST);

      if (up && !this.padLastState.up) { this.registerActivity(); this.handleUp(); }
      if (down && !this.padLastState.down) { this.registerActivity(); this.handleDown(); }
      if (button && !this.padLastState.button) { this.registerActivity(); this.handleSpace(); }
      if (back && !this.padLastState.back) { this.registerActivity(); this.handleEsc(); }
      if (start && !this.padLastState.start && this.mode !== 'DIFFICULTY_SELECT') this.scene.launch('SettingsScene', { scene: this.scene.key });
      if (achievements && !this.padLastState.achievements && this.mode !== 'DIFFICULTY_SELECT') this.scene.launch('AchievementsScene');
      if (profile && !this.padLastState.profile && this.mode !== 'DIFFICULTY_SELECT') this.scene.launch('ProfileScene');

      this.padLastState = { up, down, button, back, start, achievements, profile };
    } else {
      this.padLastState = { up: false, down: false, button: false, back: false, start: false, achievements: false, profile: false };
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
          await cabinetAudioManager.play(game.scene, CABINET_TRACKS[game.scene]);
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
    this.carousel.select(this.selectedGameIndex);

    this.gameItems[prev].setColor(PALETTE.dim).setScale(1).setFontSize('18px');
    this.gameItems[this.selectedGameIndex].setColor(PALETTE.white).setScale(1.06).setFontSize('20px');
    this.selectionCursor?.setY(92 + this.selectedGameIndex * 12);
    this.marqueeText?.setText(this.games[this.selectedGameIndex].name);

    this.tweens.add({ targets: this.gameItems[this.selectedGameIndex], scale: 1.1, duration: 80, yoyo: true });
  }

  updateDiffSelection(change: number) {
    const prev    = this.selectedDiffIndex;
    const prevDiff = this.difficulties[prev];
    this.diffItems[prev].setColor(prevDiff.color).setScale(1);

    this.selectedDiffIndex = Phaser.Math.Wrap(prev + change, 0, this.difficulties.length);
    this.diffItems[this.selectedDiffIndex].setColor(PALETTE.white).setScale(1.08);
    this.diffDescText.setText(this.difficulties[this.selectedDiffIndex].description);

    this.tweens.add({ targets: this.diffItems[this.selectedDiffIndex], scale: 1.14, duration: 80, yoyo: true });
  }

  private registerActivity() {
    this.attract.registerInput(this.time.now);
    this.nextAttractCycle = this.time.now + 30_000;
  }

  private updateModeText() { this.modeText?.setText(`MODE ${this.arcadeMode}`); }

  private cyclePalette() {
    const palettes = Object.keys(CabinetPalette) as CabinetPaletteName[];
    const next = palettes[(palettes.indexOf(this.palette) + 1) % palettes.length];
    this.palette = setPlayerProfilePalette(localStorage, next).palette;
    this.profilePaletteText?.setColor(CabinetPalette[this.palette]).setText(`LOCAL 0MS  ${paletteLabel(this.palette)}`);
    AudioEngine.playEffect('POWER_UP');
  }
}

function readCustomizedCabinetScenes() {
  try {
    const stored = JSON.parse(localStorage.getItem('bios_cabinet_skin_meta_v1') ?? '[]') as unknown;
    return new Set(Array.isArray(stored) ? stored.filter((scene): scene is string => typeof scene === 'string' && /^[A-Za-z][A-Za-z0-9]*Scene$/.test(scene)) : []);
  } catch { localStorage.removeItem('bios_cabinet_skin_meta_v1'); return new Set<string>(); }
}

function paletteLabel(palette: CabinetPaletteName) { return palette.replace('_', ' '); }
