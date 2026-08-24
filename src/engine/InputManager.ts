import { PreferenceStore, type ControlAction } from './PreferenceStore';
import { MultiInput, type PlayerInputState } from '../multiplayer/MultiInput';
import { ArcadeModeRouter } from '../multiplayer/ArcadeModeRouter';
import type { ArcadeMode } from '../multiplayer/CoopSession';

export class InputManager {
    private static keys: Set<string> = new Set();
    private static gamepadState: Record<number, Record<string, boolean>> = {};
    private static connectedPads: Set<number> = new Set();
    private static bindings: Record<ControlAction, string[]>;
    private static multi = new MultiInput();
    private static modeRouter = new ArcadeModeRouter();
    private static playerState: Record<1 | 2, PlayerInputState> = {
        1: { UP: false, DOWN: false, LEFT: false, RIGHT: false, FIRE: false },
        2: { UP: false, DOWN: false, LEFT: false, RIGHT: false, FIRE: false }
    };
    private static networkPlayer: PlayerInputState = { UP: false, DOWN: false, LEFT: false, RIGHT: false, FIRE: false };

    public static initialize() {
        this.refreshBindings();
        window.addEventListener('arcade-settings-change', () => this.refreshBindings());
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
            this.multi.setKey(e.code, true);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
            this.multi.setKey(e.code, false);
        });

        window.addEventListener('gamepadconnected', (e: GamepadEvent) => {
            const gp = e.gamepad;
            this.connectedPads.add(gp.index);
            this.gamepadState[gp.index] = {};
            this.updateIndicator();
            console.log(`Gamepad connected: ${gp.id}`);
        });

        window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
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
        const status = this.modeRouter.getStatus();
        if (this.connectedPads.size > 0 || status.mode !== 'SOLO') {
            el.style.display = 'block';
            const relay = status.mode === 'VERSUS' && !status.nativeDualControl ? ` | P${status.relayPlayer} TURN` : '';
            el.textContent = `${status.mode}${relay} | ${this.connectedPads.size} PAD(S)`;
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
                <div class="v-btn up" data-key="KeyW">W</div>
                <div class="v-btn left" data-key="KeyA">A</div>
                <div class="v-btn right" data-key="KeyD">D</div>
                <div class="v-btn down" data-key="KeyS">S</div>
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
        if (this.modeRouter.tick(performance.now())) this.updateIndicator();
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const snapshots = Array.from(gamepads).filter((pad): pad is Gamepad => Boolean(pad)).map(pad => ({
            index: pad.index, connected: pad.connected, axes: Array.from(pad.axes), buttons: pad.buttons.map(button => button.pressed)
        }));
        const detected = new Set(snapshots.map(pad => pad.index));
        if (detected.size !== this.connectedPads.size || [...detected].some(index => !this.connectedPads.has(index))) {
            this.connectedPads = detected;
            this.updateIndicator();
        }
        this.playerState = this.multi.poll(snapshots);
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
        const player1 = this.playerState[1][action] || this.bindings[action].some(k => this.keys.has(k));
        return this.modeRouter.primary(action, player1, this.playerState[2][action]);
    }

    public static isP2Down(action: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'FIRE'): boolean {
        return this.playerState[2][action] || this.networkPlayer[action];
    }

    public static setNetworkPlayerState(state: PlayerInputState) { this.networkPlayer = { ...state }; }

    public static configureArcadeMode(mode: ArcadeMode, nativeDualControl = false) {
        this.modeRouter.configure(mode, nativeDualControl, performance.now());
        this.updateIndicator();
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

    private static refreshBindings() {
        this.bindings = new PreferenceStore(localStorage).load().bindings;
    }
}
