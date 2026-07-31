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

        this.checkAndInjectVirtualPad();
    }

    private static checkAndInjectVirtualPad() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) return;

        const container = document.createElement('div');
        container.id = 'virtual-pad';
        
        container.innerHTML = `
            <style>
                #virtual-pad {
                    position: absolute; bottom: 20px; left: 0; right: 0;
                    display: flex; justify-content: space-between; padding: 0 20px;
                    pointer-events: none; z-index: 9999;
                }
                .d-pad, .action-pad { pointer-events: auto; display: grid; gap: 5px; }
                .d-pad { grid-template-columns: repeat(3, 50px); grid-template-rows: repeat(3, 50px); }
                .action-pad { display: flex; align-items: flex-end; }
                .v-btn {
                    background: rgba(0, 255, 204, 0.2); border: 2px solid rgba(0, 255, 204, 0.5);
                    border-radius: 50%; color: #00ffcc; font-family: monospace; font-weight: bold;
                    display: flex; align-items: center; justify-content: center; user-select: none;
                    touch-action: none;
                }
                .v-btn:active { background: rgba(0, 255, 204, 0.5); }
                .up { grid-column: 2; grid-row: 1; }
                .left { grid-column: 1; grid-row: 2; }
                .right { grid-column: 3; grid-row: 2; }
                .down { grid-column: 2; grid-row: 3; }
                .action { width: 70px; height: 70px; border-radius: 50%; }
            </style>
            <div class="d-pad">
                <div class="v-btn up" data-key="ArrowUp">W</div>
                <div class="v-btn left" data-key="ArrowLeft">A</div>
                <div class="v-btn right" data-key="ArrowRight">D</div>
                <div class="v-btn down" data-key="ArrowDown">S</div>
            </div>
            <div class="action-pad">
                <div class="v-btn action" data-key="Space">FIRE</div>
            </div>
        `;

        document.body.appendChild(container);

        const buttons = document.querySelectorAll('.v-btn');
        buttons.forEach(btn => {
            const key = btn.getAttribute('data-key')!;
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.simulateTouch(key, true); });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); this.simulateTouch(key, false); });
            btn.addEventListener('touchcancel', (e) => { e.preventDefault(); this.simulateTouch(key, false); });
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
