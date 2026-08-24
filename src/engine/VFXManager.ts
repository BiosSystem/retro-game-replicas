import Phaser from 'phaser';
import { PooledParticleSystem } from '../graphics/PooledParticleSystem';
import { playModAudioEvent } from '../audio/patches/ModAudioBridge';

interface ScenePool { particles: PooledParticleSystem; graphics: Phaser.GameObjects.Graphics; }

export class VFXManager {
    private static readonly pools = new WeakMap<Phaser.Scene, ScenePool>();

    static playExplosion(scene: Phaser.Scene, x: number, y: number, color = 0xffffff) {
        this.getPool(scene).particles.emit({ x, y, count: this.scaleCount(28), speedMin: 50, speedMax: 210, lifeMs: 520, color, size: 4 });
        this.runCollisionHooks(scene);
    }

    static playHit(scene: Phaser.Scene, x: number, y: number, color = 0x00ffcc) {
        this.getPool(scene).particles.emit({ x, y, count: this.scaleCount(9), speedMin: 20, speedMax: 110, lifeMs: 220, color, size: 3 });
    }

    static screenShake(scene: Phaser.Scene, intensity = 0.015, duration = 150) {
        scene.cameras.main.shake(duration, intensity);
        document.documentElement.classList.add('impact-chromatic');
        window.setTimeout(() => document.documentElement.classList.remove('impact-chromatic'), duration);
    }

    static floatingText(scene: Phaser.Scene, x: number, y: number, text: string, color = '#00ff00') {
        const floatText = scene.add.text(x, y, text, { fontSize: '18px', color, fontFamily: 'Courier', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5);
        scene.tweens.add({ targets: floatText, y: y - 40, alpha: 0, duration: 800, ease: 'Quad.easeOut', onComplete: () => floatText.destroy() });
    }

    private static getPool(scene: Phaser.Scene) {
        const existing = this.pools.get(scene);
        if (existing) return existing;
        const pool: ScenePool = { particles: new PooledParticleSystem(4096), graphics: scene.add.graphics().setDepth(90).setBlendMode(Phaser.BlendModes.ADD) };
        const update = (_time: number, delta: number) => {
            pool.particles.update(delta); pool.graphics.clear();
            pool.particles.forEachActive((x, y, size, color, alpha) => pool.graphics.fillStyle(color, alpha).fillRect(x, y, size, size));
        };
        scene.events.on('update', update);
        scene.events.once('shutdown', () => { scene.events.off('update', update); pool.graphics.destroy(); this.pools.delete(scene); });
        this.pools.set(scene, pool);
        return pool;
    }

    private static scaleCount(count: number) {
        const quality = document.documentElement.dataset.quality;
        const scale = quality === 'low' ? 0.35 : quality === 'medium' ? 0.65 : 1;
        return Math.max(1, Math.round(count * scale));
    }

    private static runCollisionHooks(scene: Phaser.Scene) {
        const stage = Number(scene.registry.get('stage')) || 1;
        playModAudioEvent('COLLISION', stage);
    }
}
