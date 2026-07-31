import Phaser from 'phaser';

export class VFXManager {
    static initTexture(scene: Phaser.Scene) {
        if (!scene.textures.exists('vfx_particle')) {
            const gfx = scene.add.graphics();
            gfx.fillStyle(0xffffff, 1);
            gfx.fillRect(0, 0, 4, 4);
            gfx.generateTexture('vfx_particle', 4, 4);
            gfx.destroy();
        }
    }

    static playExplosion(scene: Phaser.Scene, x: number, y: number, color: number = 0xffffff) {
        this.initTexture(scene);
        const emitter = scene.add.particles(0, 0, 'vfx_particle', {
            x: x,
            y: y,
            speed: { min: 50, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            lifespan: 500,
            tint: color,
            quantity: 25,
            blendMode: 'ADD',
            emitting: false
        });
        
        emitter.explode(25, x, y);

        scene.time.delayedCall(600, () => {
            emitter.destroy();
        });
    }

    static playHit(scene: Phaser.Scene, x: number, y: number, color: number = 0x00ffcc) {
        this.initTexture(scene);
        const emitter = scene.add.particles(0, 0, 'vfx_particle', {
            x: x,
            y: y,
            speed: { min: 20, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 200,
            tint: color,
            quantity: 8,
            blendMode: 'ADD',
            emitting: false
        });

        emitter.explode(8, x, y);

        scene.time.delayedCall(300, () => {
            emitter.destroy();
        });
    }

    static screenShake(scene: Phaser.Scene, intensity: number = 0.015, duration: number = 150) {
        scene.cameras.main.shake(duration, intensity);
    }

    static floatingText(scene: Phaser.Scene, x: number, y: number, text: string, color: string = '#00ff00') {
        const floatText = scene.add.text(x, y, text, {
            fontSize: '18px',
            color: color,
            fontFamily: 'Courier',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        scene.tweens.add({
            targets: floatText,
            y: y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Quad.easeOut',
            onComplete: () => floatText.destroy()
        });
    }
}
