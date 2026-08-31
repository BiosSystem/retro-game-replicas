export type ArcadeButtonState = 'IDLE' | 'HOVER' | 'PRESSED' | 'DISABLED';
export class ArcadeButton {
  state: ArcadeButtonState = 'IDLE';
  readonly label: string;
  private readonly onPress?: () => void;

  constructor(label: string, onPress?: () => void) { this.label = label; this.onPress = onPress; }
  hover() { if (this.state !== 'DISABLED') this.state = 'HOVER'; }
  press() { if (this.state === 'DISABLED') return; this.state = 'PRESSED'; this.onPress?.(); }
  release() { if (this.state !== 'DISABLED') this.state = 'HOVER'; }
  disable(disabled = true) { this.state = disabled ? 'DISABLED' : 'IDLE'; }
}
