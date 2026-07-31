import Phaser from 'phaser';
import { AchievementManager, ACHIEVEMENTS } from '../engine/AchievementManager';
import { AudioEngine } from '../engine/AudioEngine';

export default class AchievementsScene extends Phaser.Scene {
    constructor() {
        super('AchievementsScene');
    }

    create() {
        const bg = this.add.rectangle(320, 240, 640, 480, 0x000000, 0.9);
        bg.setInteractive();
        
        this.add.text(320, 50, 'ACHIEVEMENTS', {
            fontFamily: "'Share Tech Mono', Courier",
            fontSize: '36px',
            color: '#ff00cc',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const unlocked = new Set(AchievementManager.getUnlocked());
        
        let y = 120;
        for (const key in ACHIEVEMENTS) {
            const ach = ACHIEVEMENTS[key];
            const isUnlocked = unlocked.has(key);
            
            const color = isUnlocked ? '#00ffcc' : '#444444';
            const icon = isUnlocked ? '🏆' : '🔒';
            
            this.add.text(100, y, `${icon} ${ach.title}`, {
                fontFamily: "'Share Tech Mono', Courier",
                fontSize: '22px',
                color: color,
                fontStyle: 'bold'
            });
            
            this.add.text(140, y + 25, ach.description, {
                fontFamily: "'Share Tech Mono', Courier",
                fontSize: '14px',
                color: isUnlocked ? '#ffffff' : '#666666'
            });
            
            y += 70;
        }

        this.add.text(320, 440, 'ESC TO CLOSE', {
            fontFamily: "'Share Tech Mono', Courier",
            fontSize: '14px',
            color: '#888888'
        }).setOrigin(0.5);

        this.time.delayedCall(100, () => {
            this.input.keyboard?.on('keydown-ESC', () => {
                AudioEngine.playTone(400, 'square', 0.1);
                this.scene.stop('AchievementsScene');
            });
        });
    }
}
