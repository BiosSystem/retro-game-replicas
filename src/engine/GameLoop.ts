export class GameLoop {
    private lastTime: number = 0;
    private accumulator: number = 0;
    private readonly step: number = 1 / 60; // 60 FPS logic update
    private animationId: number = 0;
    private maxDelta: number = 0.25;

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

        let frameTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        if (frameTime > this.maxDelta) {
            frameTime = this.maxDelta;
        }

        this.accumulator += frameTime;

        while (this.accumulator >= this.step) {
            this.updateFn(this.step);
            this.accumulator -= this.step;
        }

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
