export class GameLoop {
    private lastTime: number = 0;
    private accumulator: number = 0;
    private readonly step: number = 1 / 60; // 60 FPS logic update
    private animationId: number = 0;
    private readonly maxDelta: number = 0.05;
    private readonly maxUpdatesPerFrame: number = 4;

    private updateFn: (dt: number) => void;
    private renderFn: (interpolation: number) => void;

    constructor(
        updateFn: (dt: number) => void,
        renderFn: (interpolation: number) => void
    ) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
    }

    private loop = (time: number) => {
        if (this.lastTime === 0) {
            this.lastTime = time;
            this.animationId = requestAnimationFrame(this.loop);
            return;
        }

        const frameTime = clampFrameDelta(time - this.lastTime, this.maxDelta * 1000) / 1000;
        this.lastTime = time;

        this.accumulator += frameTime;

        let updates = 0;
        while (this.accumulator >= this.step && updates < this.maxUpdatesPerFrame) {
            this.updateFn(this.step);
            this.accumulator -= this.step;
            updates += 1;
        }
        if (updates === this.maxUpdatesPerFrame) this.accumulator = Math.min(this.accumulator, this.step);

        const interpolation = this.accumulator / this.step;
        this.renderFn(interpolation);

        this.animationId = requestAnimationFrame(this.loop);
    };

    public start() {
        this.lastTime = 0;
        this.accumulator = 0;
        this.animationId = requestAnimationFrame(this.loop);
    }

    public stop() {
        cancelAnimationFrame(this.animationId);
    }
}

export function clampFrameDelta(deltaMs: number, maximumMs = 50) {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return 0;
    const maximum = Number.isFinite(maximumMs) ? Math.max(1, Math.min(250, maximumMs)) : 50;
    return Math.min(deltaMs, maximum);
}
