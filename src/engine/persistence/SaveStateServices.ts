import { SaveStateStore } from './SaveState';

export interface EpochSaveProvider {
  save(slot: string): Promise<void>;
  load(slot: string): Promise<void>;
}

export class SaveStateBridge extends EventTarget {
  private provider?: EpochSaveProvider;

  get available() { return Boolean(this.provider); }

  attach(provider: EpochSaveProvider) {
    this.provider = provider;
    this.dispatchEvent(new Event('change'));
  }

  detach(provider: EpochSaveProvider) {
    if (this.provider !== provider) return;
    this.provider = undefined;
    this.dispatchEvent(new Event('change'));
  }

  async save(slot: string) {
    if (!this.provider) throw new Error('Launch Neon Epoch before saving');
    await this.provider.save(slot);
  }

  async load(slot: string) {
    if (!this.provider) throw new Error('Launch Neon Epoch before loading');
    await this.provider.load(slot);
  }
}

export const arcadeSaveStates = SaveStateStore.create();
export const epochSaveBridge = new SaveStateBridge();
