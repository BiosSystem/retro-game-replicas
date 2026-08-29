import Phaser from 'phaser';
import { AudioEngine } from '../engine/AudioEngine';
import { PreferenceStore, type CabinetTheme } from '../engine/PreferenceStore';
import { CRT_PRESETS, nextCrtOverscan, nextCrtPreset, nextCrtQuality, nextCrtScanlinePhase, parseCrtOverscan, parseCrtPreset, parseCrtQuality, parseCrtScanlinePhase } from '../engine/graphics/CrtShaderPipeline';
import { parseDisplayAspect } from '../engine/graphics/DisplayScaler';
import { FullscreenController } from '../engine/FullscreenController';
import { InputManager } from '../engine/InputManager';
import { readGamepadMenuInput, type GamepadMenuState } from '../engine/input/GamepadMenuInput';
import { createNeonPanel } from '../ui/arcade/NeonUi';
import { nextVisualMode, readVisualMode, writeVisualMode } from '../graphics/VisualMode';

export default class SettingsScene extends Phaser.Scene {
    private sourceScene!: string;
    private options = ['RESUME', 'FULLSCREEN', 'CABINET THEME', 'REBIND FIRE', 'CRT PRESET', 'VISUAL MODE', 'CRT QUALITY', 'CRT OVERSCAN', 'SCANLINE PHASE', 'DISPLAY ASPECT', 'TELEMETRY', 'REDUCE MOTION', 'SOUND', 'VOLUME +10%', 'VOLUME -10%', 'BGM +10%', 'BGM -10%', 'WIPE SAVE DATA'];
    private selectedIndex = 0;
    private menuItems: Phaser.GameObjects.Text[] = [];
    private fullscreen: FullscreenController | null = null;
    private gamepadState: GamepadMenuState = { up: false, down: false, left: false, right: false, confirm: false, back: false };
    private selectionGlow!: Phaser.GameObjects.Container;

    constructor() {
        super('SettingsScene');
    }

    init(data: any) {
        this.sourceScene = data.scene;
    }

    create() {
        const arcadeRoot = document.getElementById('app');
        this.fullscreen = arcadeRoot ? new FullscreenController(arcadeRoot, document) : null;
        InputManager.setLegacyGamepadKeyboardBridgeSuspended(true, this.scene.key);
        this.events.once('shutdown', () => InputManager.setLegacyGamepadKeyboardBridgeSuspended(false, this.scene.key));
        // Overlay background
        const bg = this.add.rectangle(320, 240, 640, 480, 0x000000, 0.8);
        bg.setInteractive(); // block clicks
        createNeonPanel(this, 320, 250, 500, 450, 0x00ffcc, .9);
        this.selectionGlow = createNeonPanel(this, 320, 72, 360, 20, 0xffff00, .34);
        
        this.add.text(320, 46, 'CABINET CONTROL', {
            fontFamily: "'Share Tech Mono', Courier",
            fontSize: '36px',
            color: '#00ffcc',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.selectedIndex = 0;
        this.menuItems = [];

        this.options.forEach((opt, idx) => {
            const y = 72 + (idx * 22);
            const text = this.add.text(320, y, opt, {
                fontFamily: "'Share Tech Mono', Courier",
                fontSize: '17px',
                color: '#ffffff'
            }).setOrigin(0.5);
            this.menuItems.push(text);
        });

        this.updateMenu();

        this.time.delayedCall(100, () => {
            this.input.keyboard?.on('keydown-ArrowUp', () => this.moveSelection(-1));
            this.input.keyboard?.on('keydown-ArrowDown', () => this.moveSelection(1));
            this.input.keyboard?.on('keydown-ENTER', () => this.selectOption());
            this.input.keyboard?.on('keydown-SPACE', () => this.selectOption());
            this.input.keyboard?.on('keydown-ESC', () => this.closeSettings());
        });
    }

    private moveSelection(dir: number) {
        this.selectedIndex += dir;
        if (this.selectedIndex < 0) this.selectedIndex = this.options.length - 1;
        if (this.selectedIndex >= this.options.length) this.selectedIndex = 0;
        this.updateMenu();
        AudioEngine.playTone(400, 'sine', 0.05);
    }

    private updateMenu() {
        this.menuItems.forEach((item, idx) => {
            const label = this.getOptionLabel(this.options[idx]);
            if (idx === this.selectedIndex) {
                item.setColor('#ffff00');
                item.setText(`> ${label} <`);
            } else {
                item.setColor('#ffffff');
                item.setText(label);
            }
        });
        this.tweens.add({ targets: this.selectionGlow, y: 72 + this.selectedIndex * 22, duration: 90, ease: 'Quad.Out' });
    }

    update() {
        const next = readGamepadMenuInput(InputManager.getGamepadFrames());
        if (next.up && !this.gamepadState.up) this.moveSelection(-1);
        if (next.down && !this.gamepadState.down) this.moveSelection(1);
        if (next.confirm && !this.gamepadState.confirm) this.selectOption();
        if (next.back && !this.gamepadState.back) this.closeSettings();
        this.gamepadState = next;
    }

    private getOptionLabel(option: string) {
        const preferences = new PreferenceStore(localStorage).load();
        if (option === 'CABINET THEME') return `${option}: ${preferences.theme}`;
        if (option === 'FULLSCREEN') return `${option}: ${this.fullscreen?.status() ?? 'UNAVAILABLE'}`;
        if (option === 'REBIND FIRE') return `${option}: ${preferences.bindings.FIRE[0]}`;
        if (option === 'CRT PRESET') return `${option}: ${CRT_PRESETS[this.currentCrtPreset()].label.toUpperCase()}`;
        if (option === 'VISUAL MODE') return `${option}: ${readVisualMode(localStorage) === 'OVERDRIVE_2026' ? '2026 OVERDRIVE' : 'CLASSIC 1980S'}`;
        if (option === 'CRT QUALITY') return `${option}: ${parseCrtQuality(localStorage.getItem('arcade_crt_quality'))}`;
        if (option === 'CRT OVERSCAN') return `${option}: ${Math.round(parseCrtOverscan(localStorage.getItem('arcade_crt_overscan')) * 100)}%`;
        if (option === 'SCANLINE PHASE') return `${option}: ${parseCrtScanlinePhase(localStorage.getItem('arcade_crt_scanline_phase')).toFixed(2)}`;
        if (option === 'DISPLAY ASPECT') return `${option}: ${parseDisplayAspect(localStorage.getItem('arcade_display_aspect'))}`;
        if (option === 'TELEMETRY') return `${option}: ${localStorage.getItem('arcade_telemetry') === 'true' ? 'ON' : 'OFF'}`;
        if (option === 'REDUCE MOTION') return `${option}: ${localStorage.getItem('arcade_reduced_motion') === 'true' ? 'ON' : 'OFF'}`;
        if (option === 'SOUND') return `${option}: ${localStorage.getItem('retro_sound_muted') === 'true' ? 'OFF' : 'ON'}`;
        return option;
    }

    private selectOption() {
        const opt = this.options[this.selectedIndex];
        AudioEngine.playTone(600, 'square', 0.1);
        
        if (opt === 'RESUME') {
            this.closeSettings();
        } else if (opt === 'FULLSCREEN') {
            void this.fullscreen?.toggle().then(() => this.updateMenu());
        } else if (opt === 'CABINET THEME') {
            const store = new PreferenceStore(localStorage);
            const themes: CabinetTheme[] = ['NEON', 'CLASSIC', 'CYBER', 'AMBER'];
            const current = store.load().theme;
            store.setTheme(themes[(themes.indexOf(current) + 1) % themes.length]);
            window.dispatchEvent(new Event('arcade-settings-change'));
            this.updateMenu();
        } else if (opt === 'REBIND FIRE') {
            const store = new PreferenceStore(localStorage);
            this.menuItems[this.selectedIndex].setText('PRESS A KEY');
            this.input.keyboard?.once('keydown', (event: KeyboardEvent) => {
                if (event.code !== 'Escape') store.setBinding('FIRE', [event.code]);
                window.dispatchEvent(new Event('arcade-settings-change'));
                this.updateMenu();
            });
        } else if (opt === 'CRT PRESET') {
            const preset = nextCrtPreset(this.currentCrtPreset());
            localStorage.setItem('arcade_crt_preset', preset);
            localStorage.setItem('arcade_crt', preset === 'BYPASS' ? 'false' : 'true');
            window.dispatchEvent(new Event('arcade-settings-change'));
            this.updateMenu();
        } else if (opt === 'VISUAL MODE') {
            const mode = nextVisualMode(readVisualMode(localStorage));
            writeVisualMode(localStorage, mode);
            localStorage.setItem('arcade_crt_preset', mode === 'OVERDRIVE_2026' ? 'TRINITRON_1990S' : 'ARCADE_CRT_1980S');
            localStorage.setItem('arcade_crt', 'true');
            window.dispatchEvent(new Event('arcade-settings-change'));
            this.updateMenu();
        } else if (opt === 'CRT QUALITY') {
            localStorage.setItem('arcade_crt_quality', nextCrtQuality(parseCrtQuality(localStorage.getItem('arcade_crt_quality'))));
            window.dispatchEvent(new Event('arcade-settings-change'));
            this.updateMenu();
        } else if (opt === 'CRT OVERSCAN') {
            localStorage.setItem('arcade_crt_overscan', nextCrtOverscan(parseCrtOverscan(localStorage.getItem('arcade_crt_overscan'))).toString());
            window.dispatchEvent(new Event('arcade-settings-change'));
            this.updateMenu();
        } else if (opt === 'SCANLINE PHASE') {
            localStorage.setItem('arcade_crt_scanline_phase', nextCrtScanlinePhase(parseCrtScanlinePhase(localStorage.getItem('arcade_crt_scanline_phase'))).toString());
            window.dispatchEvent(new Event('arcade-settings-change'));
            this.updateMenu();
        } else if (opt === 'DISPLAY ASPECT') {
            const aspect = parseDisplayAspect(localStorage.getItem('arcade_display_aspect')) === '4:3' ? '16:9' : '4:3';
            localStorage.setItem('arcade_display_aspect', aspect);
            window.dispatchEvent(new Event('arcade-settings-change'));
            this.updateMenu();
        } else if (opt === 'REDUCE MOTION') {
            const isEnabled = localStorage.getItem('arcade_reduced_motion') === 'true';
            localStorage.setItem('arcade_reduced_motion', isEnabled ? 'false' : 'true');
            window.dispatchEvent(new Event('arcade-settings-change'));
            this.updateMenu();
        } else if (opt === 'TELEMETRY') {
            const isEnabled = localStorage.getItem('arcade_telemetry') === 'true';
            localStorage.setItem('arcade_telemetry', isEnabled ? 'false' : 'true');
            window.dispatchEvent(new Event('arcade-settings-change'));
            this.updateMenu();
        } else if (opt === 'SOUND') {
            const muted = localStorage.getItem('retro_sound_muted') === 'true';
            localStorage.setItem('retro_sound_muted', muted ? 'false' : 'true');
            AudioEngine.setVolume(muted ? parseFloat(localStorage.getItem('retro_master_volume') || '0.5') : 0);
            this.updateMenu();
        } else if (opt === 'VOLUME +10%') {
            const vol = Math.min(1.0, parseFloat(localStorage.getItem('retro_master_volume') || '0.5') + 0.1);
            AudioEngine.setVolume(vol);
        } else if (opt === 'VOLUME -10%') {
            const vol = Math.max(0.0, parseFloat(localStorage.getItem('retro_master_volume') || '0.5') - 0.1);
            AudioEngine.setVolume(vol);
        } else if (opt === 'BGM +10%') {
            const vol = Math.min(1, parseFloat(localStorage.getItem('retro_music_volume') || '0.55') + 0.1);
            AudioEngine.setMusicVolume(vol);
        } else if (opt === 'BGM -10%') {
            const vol = Math.max(0, parseFloat(localStorage.getItem('retro_music_volume') || '0.55') - 0.1);
            AudioEngine.setMusicVolume(vol);
        } else if (opt === 'WIPE SAVE DATA') {
            if (confirm('Are you sure you want to delete all leaderboards and settings?')) {
                localStorage.clear();
                window.location.reload();
            }
        }
    }

    private closeSettings() {
        this.scene.stop('SettingsScene');
        if (this.sourceScene !== 'LobbyScene') this.scene.resume(this.sourceScene);
    }

    private currentCrtPreset() {
        return parseCrtPreset(localStorage.getItem('arcade_crt_preset'), localStorage.getItem('arcade_crt') === 'true' ? 'ARCADE_CRT_1980S' : 'BYPASS');
    }
}
