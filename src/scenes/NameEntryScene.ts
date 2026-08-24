import Phaser from 'phaser';
import { SaveManager } from '../engine/SaveManager';

export default class NameEntryScene extends Phaser.Scene {
    private sourceScene!: string;
    private score!: number;
    private difficulty!: string;
    
    private initials: string[] = ['A', 'A', 'A'];
    private currentIndex = 0;
    private charDisplays: Phaser.GameObjects.Text[] = [];

    private chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?.- ";

    constructor() {
        super('NameEntryScene');
    }

    init(data: any) {
        this.sourceScene = data.scene;
        this.score = data.score;
        this.difficulty = data.difficulty;
    }

    create() {
        // Overlay background
        this.add.rectangle(320, 240, 640, 480, 0x000022, 0.9);
        
        this.add.text(320, 100, 'NEW HIGH SCORE!', {
            fontFamily: "'Share Tech Mono', Courier",
            fontSize: '36px',
            color: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(320, 150, `SCORE: ${this.score}`, {
            fontFamily: "'Share Tech Mono', Courier",
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(320, 200, 'ENTER INITIALS', {
            fontFamily: "'Share Tech Mono', Courier",
            fontSize: '18px',
            color: '#00ffcc'
        }).setOrigin(0.5);

        this.initials = ['A', 'A', 'A'];
        this.currentIndex = 0;
        this.charDisplays = [];

        for (let i = 0; i < 3; i++) {
            const t = this.add.text(260 + (i * 60), 260, this.initials[i], {
                fontFamily: "'Share Tech Mono', Courier",
                fontSize: '48px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.charDisplays.push(t);
        }

        this.updateDisplays();

        this.time.delayedCall(200, () => {
            this.input.keyboard?.on('keydown-ArrowUp', () => this.changeChar(1));
            this.input.keyboard?.on('keydown-ArrowDown', () => this.changeChar(-1));
            this.input.keyboard?.on('keydown-ArrowLeft', () => this.moveIndex(-1));
            this.input.keyboard?.on('keydown-ArrowRight', () => this.moveIndex(1));
            this.input.keyboard?.on('keydown-SPACE', () => this.confirmChar());
            this.input.keyboard?.on('keydown-ENTER', () => this.confirmChar());
        });
    }

    private updateDisplays() {
        this.charDisplays.forEach((t, i) => {
            t.setText(this.initials[i]);
            if (i === this.currentIndex) {
                t.setColor('#00ffcc');
                t.setShadow(0, 0, '#00ffcc', 10, false, true);
                t.setScale(1.2);
            } else {
                t.setColor('#ffffff');
                t.setShadow(0, 0, '#000', 0, false, false);
                t.setScale(1.0);
            }
        });
    }

    private changeChar(dir: number) {
        let charCode = this.chars.indexOf(this.initials[this.currentIndex]);
        charCode += dir;
        if (charCode < 0) charCode = this.chars.length - 1;
        if (charCode >= this.chars.length) charCode = 0;
        this.initials[this.currentIndex] = this.chars[charCode];
        this.updateDisplays();
    }

    private moveIndex(dir: number) {
        this.currentIndex += dir;
        if (this.currentIndex < 0) this.currentIndex = 0;
        if (this.currentIndex > 2) this.currentIndex = 2;
        this.updateDisplays();
    }

    private confirmChar() {
        if (this.currentIndex < 2) {
            this.currentIndex++;
            this.updateDisplays();
        } else {
            // Done
            const name = this.initials.join('');
            SaveManager.submitScore(this.sourceScene, this.difficulty, this.score, name);
            this.scene.stop('NameEntryScene');
            
            // Restart the game scene
            const src = this.scene.get(this.sourceScene);
            if (src) {
                src.scene.restart({ difficulty: this.difficulty });
            } else {
                this.scene.start('LobbyScene');
            }
        }
    }
}
