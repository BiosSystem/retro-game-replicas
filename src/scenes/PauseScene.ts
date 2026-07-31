import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
    private sourceScene!: string;
    private options = ['RESUME', 'RESTART', 'SETTINGS', 'QUIT'];
    private selectedIndex = 0;
    private menuItems: Phaser.GameObjects.Text[] = [];

    constructor() {
        super('PauseScene');
    }

    init(data: any) {
        this.sourceScene = data.scene;
    }

    create() {
        // Semi-transparent overlay
        this.add.rectangle(320, 240, 640, 480, 0x000000, 0.75);

        this.add.text(320, 150, 'PAUSED', {
            fontFamily: "'Share Tech Mono', Courier",
            fontSize: '32px',
            color: '#00ffcc',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.selectedIndex = 0;
        this.menuItems = [];

        this.options.forEach((opt, idx) => {
            const t = this.add.text(320, 220 + (idx * 40), opt, {
                fontFamily: "'Share Tech Mono', Courier",
                fontSize: '24px',
                color: idx === 0 ? '#ffffff' : '#666666'
            }).setOrigin(0.5);
            this.menuItems.push(t);
        });

        // Small cooldown to prevent instant un-pausing if ESC is held
        this.time.delayedCall(200, () => {
            // Need to handle input using standard Phaser keyboard here because 
            // the main game's InputManager update cycle might be paused, but wait, InputManager runs globally.
            // Let's rely on standard events to avoid clash with game scene.
            this.input.keyboard?.on('keydown-ESC', () => this.resume());
            this.input.keyboard?.on('keydown-ArrowUp', () => this.navigate(-1));
            this.input.keyboard?.on('keydown-ArrowDown', () => this.navigate(1));
            this.input.keyboard?.on('keydown-SPACE', () => this.select());
            this.input.keyboard?.on('keydown-ENTER', () => this.select());
        });
    }

    private navigate(dir: number) {
        this.selectedIndex += dir;
        if (this.selectedIndex < 0) this.selectedIndex = this.options.length - 1;
        if (this.selectedIndex >= this.options.length) this.selectedIndex = 0;

        this.menuItems.forEach((item, idx) => {
            item.setColor(idx === this.selectedIndex ? '#ffffff' : '#666666');
            if (idx === this.selectedIndex) {
                item.setScale(1.1);
            } else {
                item.setScale(1.0);
            }
        });
    }

    private select() {
        switch (this.selectedIndex) {
            case 0:
                this.resume();
                break;
            case 1:
                this.scene.stop('PauseScene');
                const src = this.scene.get(this.sourceScene);
                if (src) {
                    // Need to cleanly restart physics
                    src.scene.restart();
                }
                break;
            case 2:
                // Launch settings over the pause menu
                this.scene.launch('SettingsScene', { scene: 'PauseScene' });
                break;
            case 3:
                this.scene.stop('PauseScene');
                this.scene.stop(this.sourceScene);
                this.scene.start('LobbyScene');
                break;
        }
    }

    private resume() {
        this.scene.resume(this.sourceScene);
        this.scene.stop();
    }
}
