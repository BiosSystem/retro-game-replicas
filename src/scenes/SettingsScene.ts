import Phaser from 'phaser';
import { AudioEngine } from '../engine/AudioEngine';

export default class SettingsScene extends Phaser.Scene {
    private sourceScene!: string;
    private options = ['RESUME', 'TOGGLE CRT', 'VOLUME +10%', 'VOLUME -10%', 'WIPE SAVE DATA'];
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
        
        this.add.text(320, 100, 'SETTINGS', {
            fontFamily: "'Share Tech Mono', Courier",
            fontSize: '36px',
            color: '#00ffcc',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.selectedIndex = 0;
        this.menuItems = [];

        this.options.forEach((opt, idx) => {
            const y = 180 + (idx * 40);
            const text = this.add.text(320, y, opt, {
                fontFamily: "'Share Tech Mono', Courier",
                fontSize: '24px',
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
            if (idx === this.selectedIndex) {
                item.setColor('#ffff00');
                item.setText(`> ${this.options[idx]} <`);
            } else {
                item.setColor('#ffffff');
                item.setText(this.options[idx]);
            }
        });
    }

    private selectOption() {
        const opt = this.options[this.selectedIndex];
        AudioEngine.playTone(600, 'square', 0.1);
        
        if (opt === 'RESUME') {
            this.closeSettings();
        } else if (opt === 'TOGGLE CRT') {
            const isEnabled = localStorage.getItem('arcade_crt') === 'true';
            localStorage.setItem('arcade_crt', isEnabled ? 'false' : 'true');
            // If lobby is active, we should trigger a refresh or let the player reboot the game to see changes.
            // For now, it will apply on the next game load.
        } else if (opt === 'VOLUME +10%') {
            const vol = Math.min(1.0, parseFloat(localStorage.getItem('retro_master_volume') || '0.5') + 0.1);
            AudioEngine.setVolume(vol);
        } else if (opt === 'VOLUME -10%') {
            const vol = Math.max(0.0, parseFloat(localStorage.getItem('retro_master_volume') || '0.5') - 0.1);
            AudioEngine.setVolume(vol);
        } else if (opt === 'WIPE SAVE DATA') {
            if (confirm('Are you sure you want to delete all leaderboards and settings?')) {
                localStorage.clear();
                window.location.reload();
            }
        }
    }

    private closeSettings() {
        this.scene.stop('SettingsScene');
        if (this.sourceScene === 'LobbyScene') {
            // Lobby doesn't pause, so we just stop settings
            const lobby = this.scene.get('LobbyScene') as any;
            if (lobby && typeof lobby.applyCrt === 'function') {
                if (localStorage.getItem('arcade_crt') === 'true') {
                    lobby.applyCrt();
                } else {
                    lobby.cameras.main.filters.internal.clear();
                }
            }
        } else {
            // Restore caller if it was paused
            this.scene.resume(this.sourceScene);
        }
    }
}
