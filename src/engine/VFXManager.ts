import Phaser from 'phaser';
import { PooledParticleSystem } from '../graphics/PooledParticleSystem';
import { playModAudioEvent } from '../audio/patches/ModAudioBridge';
import { readVisualMode } from '../graphics/VisualMode';
import { SpriteGPULayer } from '../graphics/SpriteGPULayer';
import { requestVisualHitStop } from '../graphics/VisualFrameFreeze';

interface ScenePool { particles: PooledParticleSystem; graphics: Phaser.GameObjects.Graphics; gpu: SpriteGPULayer; }

export class VFXManager {
    private static readonly pools = new WeakMap<Phaser.Scene, ScenePool>();

    static playExplosion(scene: Phaser.Scene, x: number, y: number, color = 0xffffff) {
        this.getPool(scene).particles.emit({ x, y, count: this.scaleCount(28), speedMin: 50, speedMax: 210, lifeMs: 520, color, size: 4 });
        this.getPool(scene).gpu.burst({ x, y, color, count: this.scaleCount(34), critical: true });
        this.applyDirectionalTrauma(scene, x, y, 1);
        this.runCollisionHooks(scene);
    }

    static playHit(scene: Phaser.Scene, x: number, y: number, color = 0x00ffcc) {
        this.getPool(scene).particles.emit({ x, y, count: this.scaleCount(9), speedMin: 20, speedMax: 110, lifeMs: 220, color, size: 3 });
        this.getPool(scene).gpu.burst({ x, y, color, count: this.scaleCount(12) });
        this.applyDirectionalTrauma(scene, x, y, 0.45);
    }

    static playEngineExhaust(scene: Phaser.Scene, x: number, y: number, color = 0xff2ec4) {
        this.getPool(scene).particles.emit({ x, y, count: this.scaleCount(5), speedMin: 18, speedMax: 76, lifeMs: 260, color, size: 3 });
        this.getPool(scene).gpu.burst({ x, y, color, count: this.scaleCount(7) });
    }

    static screenShake(scene: Phaser.Scene, intensity = 0.015, duration = 150) {
        scene.cameras.main.shake(duration, intensity);
        if (this.isOverdrive()) {
            const visualDuration = intensity >= 0.02 ? 50 : intensity >= 0.012 ? 40 : 30;
            requestVisualHitStop(performance.now(), visualDuration);
            document.documentElement.style.setProperty('--impact-trauma', Math.min(1, intensity * 35).toFixed(3));
        }
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
        const gpu = new SpriteGPULayer(scene);
        gpu.setEnabled(this.isOverdrive());
        const pool: ScenePool = { particles: new PooledParticleSystem(4096), graphics: scene.add.graphics().setDepth(90).setBlendMode(Phaser.BlendModes.ADD), gpu };
        const update = (_time: number, delta: number) => {
            gpu.setEnabled(this.isOverdrive());
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

    private static isOverdrive() {
        return typeof localStorage !== 'undefined' && readVisualMode(localStorage) === 'OVERDRIVE_2026';
    }

    private static applyDirectionalTrauma(scene: Phaser.Scene, x: number, y: number, magnitude: number) {
        if (!this.isOverdrive()) return;
        const camera = scene.cameras.main;
        const horizontal = x < camera.midPoint.x ? 1 : -1;
        const vertical = y < camera.midPoint.y ? 1 : -1;
        const app = document.getElementById('app');
        if (!app) return;
        app.style.setProperty('--impact-offset-x', `${(horizontal * magnitude).toFixed(2)}px`);
        app.style.setProperty('--impact-offset-y', `${(vertical * magnitude).toFixed(2)}px`);
        app.classList.add('impact-directional');
        window.setTimeout(() => app.classList.remove('impact-directional'), 55);
    }

    private static runCollisionHooks(scene: Phaser.Scene) {
        const stage = Number(scene.registry.get('stage')) || 1;
        playModAudioEvent('COLLISION', stage);
    }
}
