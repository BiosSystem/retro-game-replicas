import { PreferenceStore, type ControlAction } from './PreferenceStore';
import { MultiInput, type PlayerInputState } from '../multiplayer/MultiInput';
import { ArcadeModeRouter } from '../multiplayer/ArcadeModeRouter';
import type { ArcadeMode } from '../multiplayer/CoopSession';
import { GamepadButton, GamepadHandler, type GamepadFrame } from './input/GamepadHandler';

export class InputManager {
    private static keys: Set<string> = new Set();
    private static connectedPads: Set<number> = new Set();
    private static gamepads = new GamepadHandler();
    private static bindings: Record<ControlAction, string[]>;
    private static multi = new MultiInput();
    private static modeRouter = new ArcadeModeRouter();
    private static playerState: Record<1 | 2, PlayerInputState> = {
        1: { UP: false, DOWN: false, LEFT: false, RIGHT: false, FIRE: false },
        2: { UP: false, DOWN: false, LEFT: false, RIGHT: false, FIRE: false }
    };
    private static networkPlayer: PlayerInputState = { UP: false, DOWN: false, LEFT: false, RIGHT: false, FIRE: false };
    private static replayMask: number | null = null;
    private static legacyGamepadKeyboardBridge = false;
    private static legacyGamepadState: PlayerInputState = emptyPlayerState();

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
            this.updateIndicator();
            console.log(`Gamepad connected: ${gp.id}`);
        });

        window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => {
            const gp = e.gamepad;
            this.connectedPads.delete(gp.index);
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
        const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
        if (!hasTouch || document.getElementById('virtual-pad')) return;

        const container = document.createElement('div');
        container.id = 'virtual-pad';
        container.setAttribute('role', 'group');
        container.setAttribute('aria-label', 'Arcade touch controls');
        
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
                    padding: 0; touch-action: none;
                }
                .v-btn:active { background: rgba(0, 255, 204, 0.5); }
                .up { grid-column: 2; grid-row: 1; }
                .left { grid-column: 1; grid-row: 2; }
                .right { grid-column: 3; grid-row: 2; }
                .down { grid-column: 2; grid-row: 3; }
                .action { width: 70px; height: 70px; border-radius: 50%; }
            </style>
            <div class="d-pad">
                <button type="button" class="v-btn up" data-key="KeyW" aria-label="Move up">W</button>
                <button type="button" class="v-btn left" data-key="KeyA" aria-label="Move left">A</button>
                <button type="button" class="v-btn right" data-key="KeyD" aria-label="Move right">D</button>
                <button type="button" class="v-btn down" data-key="KeyS" aria-label="Move down">S</button>
            </div>
            <div class="action-pad">
                <button type="button" class="v-btn action" data-key="Space" aria-label="Fire or select">FIRE</button>
            </div>
        `;

        document.body.appendChild(container);

        const buttons = container.querySelectorAll<HTMLButtonElement>('.v-btn');
        buttons.forEach(btn => {
            const key = btn.getAttribute('data-key')!;
            btn.addEventListener('pointerdown', event => { event.preventDefault(); btn.setPointerCapture(event.pointerId); this.simulateTouch(key, true); });
            for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
                btn.addEventListener(type, event => { event.preventDefault(); this.simulateTouch(key, false); });
            }
        });
    }

    public static update(frameTime = performance.now()) {
        if (this.modeRouter.tick(performance.now())) this.updateIndicator();
        const frames = this.gamepads.poll(frameTime);
        const snapshots = frames.map(pad => ({
            index: pad.index, connected: pad.connected, axes: [pad.leftX, pad.leftY, pad.rightX, pad.rightY], buttonMask: pad.buttons
        }));
        const detected = new Set(snapshots.map(pad => pad.index));
        if (detected.size !== this.connectedPads.size || [...detected].some(index => !this.connectedPads.has(index))) {
            this.connectedPads = detected;
            this.updateIndicator();
        }
        this.playerState = this.multi.poll(snapshots);
        if (this.legacyGamepadKeyboardBridge) this.syncLegacyGamepadKeys(frames);
    }

    public static isDown(code: string): boolean {
        let isPressed = this.keys.has(code);
        
        const p1State = this.playerState[1];
        if (p1State) {
            if (code === 'ArrowUp' || code === 'KeyW') isPressed = isPressed || p1State.UP;
            if (code === 'ArrowDown' || code === 'KeyS') isPressed = isPressed || p1State.DOWN;
            if (code === 'ArrowLeft' || code === 'KeyA') isPressed = isPressed || p1State.LEFT;
            if (code === 'ArrowRight' || code === 'KeyD') isPressed = isPressed || p1State.RIGHT;
            if (code === 'Space') isPressed = isPressed || p1State.FIRE;
        }
        
        return isPressed;
    }

    public static isP1Down(action: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'FIRE'): boolean {
        if (this.replayMask !== null) return Boolean(this.replayMask & maskFor(action));
        const player1 = this.playerState[1][action] || this.bindings[action].some(k => this.keys.has(k));
        return this.modeRouter.primary(action, player1, this.playerState[2][action]);
    }

    public static isP2Down(action: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'FIRE'): boolean {
        return this.playerState[2][action] || this.networkPlayer[action];
    }

    public static setNetworkPlayerState(state: PlayerInputState) { this.networkPlayer = { ...state }; }
    public static setReplayMask(mask: number | null) { this.replayMask = mask === null ? null : Math.max(0, Math.min(31, mask | 0)); }
    public static setLegacyGamepadKeyboardBridge(active: boolean) {
        if (this.legacyGamepadKeyboardBridge === active) return;
        this.legacyGamepadKeyboardBridge = active;
        if (!active) this.releaseLegacyGamepadKeys();
    }
    public static getP1Mask() { return (this.isP1Down('UP') ? 1 : 0) | (this.isP1Down('DOWN') ? 2 : 0) | (this.isP1Down('LEFT') ? 4 : 0) | (this.isP1Down('RIGHT') ? 8 : 0) | (this.isP1Down('FIRE') ? 16 : 0); }
    public static getGamepadFrames(): readonly GamepadFrame[] { return this.gamepads.getFrames(); }

    public static configureArcadeMode(mode: ArcadeMode, nativeDualControl = false) {
        this.modeRouter.configure(mode, nativeDualControl, performance.now());
        this.updateIndicator();
    }

    public static simulateTouch(code: string, isDown: boolean) {
        for (const emittedCode of touchCodes(code)) dispatchVirtualKey(emittedCode, isDown);
        if (isDown && navigator.vibrate) navigator.vibrate(10);
    }

    private static refreshBindings() {
        this.bindings = new PreferenceStore(localStorage).load().bindings;
    }

    private static syncLegacyGamepadKeys(frames: readonly GamepadFrame[]) {
        const gamepad = frames[0];
        const buttons = gamepad?.buttons ?? 0;
        this.syncLegacyGamepadKey('UP', Boolean(buttons & GamepadButton.DPAD_UP) || (gamepad?.leftY ?? 0) < -0.5);
        this.syncLegacyGamepadKey('DOWN', Boolean(buttons & GamepadButton.DPAD_DOWN) || (gamepad?.leftY ?? 0) > 0.5);
        this.syncLegacyGamepadKey('LEFT', Boolean(buttons & GamepadButton.DPAD_LEFT) || (gamepad?.leftX ?? 0) < -0.5);
        this.syncLegacyGamepadKey('RIGHT', Boolean(buttons & GamepadButton.DPAD_RIGHT) || (gamepad?.leftX ?? 0) > 0.5);
        this.syncLegacyGamepadKey('FIRE', Boolean(buttons & (GamepadButton.SOUTH | GamepadButton.EAST | GamepadButton.WEST | GamepadButton.NORTH)));
    }

    private static syncLegacyGamepadKey(action: keyof PlayerInputState, pressed: boolean) {
        if (pressed === this.legacyGamepadState[action]) return;
        this.legacyGamepadState[action] = pressed;
        dispatchVirtualKey(LEGACY_GAMEPAD_KEYS[action], pressed);
    }

    private static releaseLegacyGamepadKeys() {
        for (const action of LEGACY_ACTIONS) {
            if (this.legacyGamepadState[action]) dispatchVirtualKey(LEGACY_GAMEPAD_KEYS[action], false);
        }
        this.legacyGamepadState = emptyPlayerState();
    }
}

function maskFor(action: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'FIRE') { return { UP: 1, DOWN: 2, LEFT: 4, RIGHT: 8, FIRE: 16 }[action]; }
function emptyPlayerState(): PlayerInputState { return { UP: false, DOWN: false, LEFT: false, RIGHT: false, FIRE: false }; }
const LEGACY_GAMEPAD_KEYS: Record<keyof PlayerInputState, string> = { UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight', FIRE: 'Space' };
const LEGACY_ACTIONS: readonly (keyof PlayerInputState)[] = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'FIRE'];
function touchCodes(code: string) { return { KeyW: ['KeyW', 'ArrowUp'], KeyS: ['KeyS', 'ArrowDown'], KeyA: ['KeyA', 'ArrowLeft'], KeyD: ['KeyD', 'ArrowRight'], Space: ['Space'] }[code] ?? [code]; }
function dispatchVirtualKey(code: string, pressed: boolean) {
    const key = { KeyW: 'w', KeyS: 's', KeyA: 'a', KeyD: 'd', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', Space: ' ' }[code] ?? code;
    const keyCode = { KeyW: 87, KeyS: 83, KeyA: 65, KeyD: 68, ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Space: 32 }[code] ?? 0;
    const event = new KeyboardEvent(pressed ? 'keydown' : 'keyup', { code, key, bubbles: true, cancelable: true });
    Object.defineProperties(event, { keyCode: { value: keyCode }, which: { value: keyCode } });
    window.dispatchEvent(event);
}
