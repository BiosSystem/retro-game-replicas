export class InputManager {
    private static keys: Set<string> = new Set();
    private static gamepadState: Record<string, boolean> = {};

    public static initialize() {
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
    }

    public static update() {
        // Poll gamepad API
        this.gamepadState = {};
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (!gp) continue;

            // Simple mapping for standard gamepads
            if (gp.buttons[12]?.pressed) this.gamepadState['ArrowUp'] = true;
            if (gp.buttons[13]?.pressed) this.gamepadState['ArrowDown'] = true;
            if (gp.buttons[14]?.pressed) this.gamepadState['ArrowLeft'] = true;
            if (gp.buttons[15]?.pressed) this.gamepadState['ArrowRight'] = true;
            if (gp.buttons[0]?.pressed) this.gamepadState['Space'] = true; // A button
            
            // Analog stick deadzone
            if (gp.axes[1] < -0.5) this.gamepadState['ArrowUp'] = true;
            if (gp.axes[1] > 0.5) this.gamepadState['ArrowDown'] = true;
            if (gp.axes[0] < -0.5) this.gamepadState['ArrowLeft'] = true;
            if (gp.axes[0] > 0.5) this.gamepadState['ArrowRight'] = true;
        }
    }

    public static isDown(code: string): boolean {
        return this.keys.has(code) || !!this.gamepadState[code];
    }

    public static simulateTouch(code: string, isDown: boolean) {
        if (isDown) {
            this.keys.add(code);
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        } else {
            this.keys.delete(code);
        }
    }
}
