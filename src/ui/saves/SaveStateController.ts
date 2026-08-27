import { arcadeSaveStates, epochSaveBridge } from '../../engine/persistence/SaveStateServices';
import type { SerializedSaveState } from '../../engine/persistence/SaveState';

const SLOTS = [
  { id: 'neon_epoch', label: 'AUTOSAVE', manual: false },
  { id: 'neon_epoch_1', label: 'SLOT 1', manual: true },
  { id: 'neon_epoch_2', label: 'SLOT 2', manual: true },
  { id: 'neon_epoch_3', label: 'SLOT 3', manual: true },
] as const;

export class SaveStateController {
  private readonly root: HTMLElement;
  private renderToken = 0;

  constructor() {
    this.root = document.createElement('aside');
    this.root.className = 'save-state-panel';
    this.root.hidden = true;
    this.root.dataset.arcadeOverlay = 'true';
    this.root.innerHTML = `<header><div><small>BIOSSYSTEM WASM MEMORY BANK</small><h2>NEON EPOCH SAVE STATES</h2></div><button type="button" data-close aria-label="Close save states">X</button></header><p>Launch Neon Epoch to capture or restore a manual slot. Autosave refreshes during play.</p><div class="save-slot-grid">${SLOTS.map(slot => `<article data-save-slot="${slot.id}"><div class="save-preview"><img alt="${slot.label} generated preview" hidden><span>EMPTY SLOT</span></div><strong>${slot.label}</strong><small data-meta>NO STATE</small><div>${slot.manual ? '<button type="button" data-action="save">SAVE</button>' : ''}<button type="button" data-action="load">LOAD</button><button type="button" data-action="delete">DELETE</button></div></article>`).join('')}</div><output data-status>READY</output>`;
    document.body.appendChild(this.root);
    this.bind();
  }

  toggle(show = this.root.hidden) {
    this.root.hidden = !show;
    if (show) void this.refresh();
  }

  private bind() {
    document.getElementById('save-state-toggle')?.addEventListener('click', () => this.toggle());
    this.root.querySelector('[data-close]')?.addEventListener('click', () => this.toggle(false));
    this.root.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
      const card = button?.closest<HTMLElement>('[data-save-slot]');
      if (button && card) void this.run(button.dataset.action ?? '', card.dataset.saveSlot ?? '');
    });
    epochSaveBridge.addEventListener('change', () => { if (!this.root.hidden) void this.refresh(); });
    window.addEventListener('keydown', event => {
      const typing = (event.target as HTMLElement | null)?.matches('input, textarea, select');
      if (event.code === 'KeyV' && !event.ctrlKey && !event.metaKey && !typing) this.toggle();
      if (event.code === 'Escape' && !this.root.hidden) this.toggle(false);
    });
  }

  private async refresh() {
    const token = ++this.renderToken;
    const states = await Promise.all(SLOTS.map(slot => arcadeSaveStates.load(slot.id)));
    if (token !== this.renderToken) return;
    SLOTS.forEach((slot, index) => this.renderCard(slot.id, states[index]));
  }

  private renderCard(slot: string, state: SerializedSaveState | null) {
    const card = this.root.querySelector<HTMLElement>(`[data-save-slot="${slot}"]`);
    if (!card) return;
    const image = card.querySelector<HTMLImageElement>('img');
    const empty = card.querySelector<HTMLElement>('.save-preview span');
    const meta = card.querySelector<HTMLElement>('[data-meta]');
    if (image) {
      image.hidden = !state?.thumbnail;
      if (state?.thumbnail) image.src = state.thumbnail;
      else image.removeAttribute('src');
    }
    if (empty) empty.hidden = Boolean(state?.thumbnail);
    if (meta) meta.textContent = state ? `${new Date(state.savedAt).toLocaleString()} | ${state.players[0].x.toFixed(1)}, ${state.players[0].y.toFixed(1)}` : 'NO STATE';
    card.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach(button => {
      const action = button.dataset.action;
      button.disabled = action === 'save' ? !epochSaveBridge.available : !state || (action === 'load' && !epochSaveBridge.available);
    });
  }

  private async run(action: string, slot: string) {
    this.status(`${action.toUpperCase()} ${slot}...`);
    try {
      if (action === 'save') await epochSaveBridge.save(slot);
      else if (action === 'load') await epochSaveBridge.load(slot);
      else if (action === 'delete') await arcadeSaveStates.delete(slot);
      else return;
      this.status(`${action.toUpperCase()} COMPLETE`, true);
      await this.refresh();
    } catch (error) {
      this.status(error instanceof Error ? error.message : 'SAVE STATE OPERATION FAILED');
    }
  }

  private status(value: string, valid = false) {
    const output = this.root.querySelector<HTMLOutputElement>('[data-status]');
    if (output) { output.textContent = value; output.classList.toggle('valid', valid); }
  }
}

export function installSaveStateController() { return new SaveStateController(); }
