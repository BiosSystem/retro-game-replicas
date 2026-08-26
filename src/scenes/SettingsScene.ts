import Phaser from 'phaser';
import { AudioEngine } from '../engine/AudioEngine';
import { PreferenceStore, type CabinetTheme } from '../engine/PreferenceStore';
import { CRT_PRESETS, nextCrtPreset, parseCrtPreset } from '../engine/graphics/CrtShaderPipeline';
import { parseDisplayAspect } from '../engine/graphics/DisplayScaler';

export default class SettingsScene extends Phaser.Scene {
    private sourceScene!: string;
    private options = ['RESUME', 'CABINET THEME', 'REBIND FIRE', 'CRT PRESET', 'DISPLAY ASPECT', 'REDUCE MOTION', 'VOLUME +10%', 'VOLUME -10%', 'BGM +10%', 'BGM -10%', 'WIPE SAVE DATA'];
    private selectedIndex = 0;
    private menuItems: Phaser.GameObjects.Text[] = [];

    constructor() {
        super('SettingsScene');
    }

    init(data: any) {
        this.sourceScene = data.scene;
    }

    create() {
        // Overlay background
        const bg = this.add.rectangle(320, 240, 640, 480, 0x000000, 0.8);
        bg.setInteractive(); // block clicks
        
        this.add.text(320, 78, 'CABINET CONTROL', {
            fontFamily: "'Share Tech Mono', Courier",
            fontSize: '36px',
            color: '#00ffcc',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.selectedIndex = 0;
        this.menuItems = [];

        this.options.forEach((opt, idx) => {
            const y = 128 + (idx * 31);
            const text = this.add.text(320, y, opt, {
                fontFamily: "'Share Tech Mono', Courier",
                fontSize: '20px',
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
    }

    private getOptionLabel(option: string) {
        const preferences = new PreferenceStore(localStorage).load();
        if (option === 'CABINET THEME') return `${option}: ${preferences.theme}`;
        if (option === 'REBIND FIRE') return `${option}: ${preferences.bindings.FIRE[0]}`;
        if (option === 'CRT PRESET') return `${option}: ${CRT_PRESETS[this.currentCrtPreset()].label.toUpperCase()}`;
        if (option === 'DISPLAY ASPECT') return `${option}: ${parseDisplayAspect(localStorage.getItem('arcade_display_aspect'))}`;
        if (option === 'REDUCE MOTION') return `${option}: ${localStorage.getItem('arcade_reduced_motion') === 'true' ? 'ON' : 'OFF'}`;
        return option;
    }

    private selectOption() {
        const opt = this.options[this.selectedIndex];
        AudioEngine.playTone(600, 'square', 0.1);
        
        if (opt === 'RESUME') {
            this.closeSettings();
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
