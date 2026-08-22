export class InputManager {
    private static keys: Set<string> = new Set();
    private static gamepadState: Record<number, Record<string, boolean>> = {};
    private static connectedPads: Set<number> = new Set();

    public static initialize() {
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });

        window.addEventListener('gamepadconnected', (e: any) => {
            const gp = e.gamepad;
            this.connectedPads.add(gp.index);
            this.gamepadState[gp.index] = {};
            this.updateIndicator();
            console.log(`Gamepad connected: ${gp.id}`);
        });

        window.addEventListener('gamepaddisconnected', (e: any) => {
            const gp = e.gamepad;
            this.connectedPads.delete(gp.index);
            delete this.gamepadState[gp.index];
            this.updateIndicator();
            console.log(`Gamepad disconnected: ${gp.id}`);
        });

        this.checkAndInjectVirtualPad();
        this.injectIndicator();
    }

    private static injectIndicator() {
        const container = document.createElement('div');
        container.id = 'gamepad-indicator';
        container.style.position = 'absolute';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.color = '#00ffcc';
        container.style.fontFamily = 'monospace';
        container.style.zIndex = '9999';
        container.style.display = 'none';
        container.innerHTML = '🎮 P1 Connected';
        document.body.appendChild(container);
    }

    private static updateIndicator() {
        const el = document.getElementById('gamepad-indicator');
        if (!el) return;
        if (this.connectedPads.size > 0) {
            el.style.display = 'block';
            el.innerHTML = `🎮 ${this.connectedPads.size} Gamepad(s) Connected`;
        } else {
            el.style.display = 'none';
        }
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
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (let i = 0; i < gamepads.length; i++) {
            const gp = gamepads[i];
            if (!gp) continue;
            
            if (!this.gamepadState[i]) this.gamepadState[i] = {};
            const state = this.gamepadState[i];

            state['UP'] = !!(gp.buttons[12]?.pressed || (gp.axes[1] !== undefined && gp.axes[1] < -0.5));
            state['DOWN'] = !!(gp.buttons[13]?.pressed || (gp.axes[1] !== undefined && gp.axes[1] > 0.5));
            state['LEFT'] = !!(gp.buttons[14]?.pressed || (gp.axes[0] !== undefined && gp.axes[0] < -0.5));
            state['RIGHT'] = !!(gp.buttons[15]?.pressed || (gp.axes[0] !== undefined && gp.axes[0] > 0.5));
            state['FIRE'] = !!(gp.buttons[0]?.pressed || gp.buttons[1]?.pressed || gp.buttons[2]?.pressed || gp.buttons[3]?.pressed);
        }
    }

    public static isDown(code: string): boolean {
        let isPressed = this.keys.has(code);
        
        const p1State = this.gamepadState[0];
        if (p1State) {
            if (code === 'ArrowUp' || code === 'KeyW') isPressed = isPressed || !!p1State['UP'];
            if (code === 'ArrowDown' || code === 'KeyS') isPressed = isPressed || !!p1State['DOWN'];
            if (code === 'ArrowLeft' || code === 'KeyA') isPressed = isPressed || !!p1State['LEFT'];
            if (code === 'ArrowRight' || code === 'KeyD') isPressed = isPressed || !!p1State['RIGHT'];
            if (code === 'Space') isPressed = isPressed || !!p1State['FIRE'];
        }
        
        return isPressed;
    }

    public static isP1Down(action: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'FIRE'): boolean {
        const keys: Record<string, string[]> = {
            'UP': ['ArrowUp', 'KeyW'],
            'DOWN': ['ArrowDown', 'KeyS'],
            'LEFT': ['ArrowLeft', 'KeyA'],
            'RIGHT': ['ArrowRight', 'KeyD'],
            'FIRE': ['Space']
        };
        let pressed = keys[action].some(k => this.keys.has(k));
        if (this.gamepadState[0] && this.gamepadState[0][action]) pressed = true;
        return pressed;
    }

    public static isP2Down(action: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'FIRE'): boolean {
        const keys: Record<string, string[]> = {
            'UP': ['KeyI'],
            'DOWN': ['KeyK'],
            'LEFT': ['KeyJ'],
            'RIGHT': ['KeyL'],
            'FIRE': ['Enter']
        };
        let pressed = keys[action].some(k => this.keys.has(k));
        if (this.gamepadState[1] && this.gamepadState[1][action]) pressed = true;
        return pressed;
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
