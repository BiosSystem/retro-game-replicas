import { AudioEngine } from '../../engine/AudioEngine';
import { validateSoundPatch, type PatchWaveform, type SoundPatch } from '../../audio/patches/SoundPatch';
import { SoundPatchStore, type PatchSlot } from '../../audio/patches/SoundPatchStore';
import { CommunityModState, CommunityModStorage, fetchModJson, MOD_BYTES_MAX, type ModInspection } from './CommunityModState';
import { fetchSignedModPackage, VerifiedModCache } from '../../mods/crypto/SignedModPackage';

export class ModManagerController {
  private readonly root: HTMLElement;
  private readonly state = new CommunityModState(new CommunityModStorage(localStorage));
  private readonly patches = new SoundPatchStore(localStorage);
  private readonly verifiedCache = new VerifiedModCache(localStorage);

  constructor() {
    this.root = document.createElement('aside'); this.root.id = 'mod-manager'; this.root.className = 'mod-manager'; this.root.hidden = true;
    this.root.innerHTML = `<header><div><small>BIOSSYSTEM COMMUNITY BUS</small><h2>MOD MANAGER + SOUND LAB</h2></div><button type="button" data-close aria-label="Close mod manager">X</button></header><div class="mod-manager-grid"><section><h3>STAGE MODS</h3><div class="mod-drop" data-drop>DROP JSON OR CLICK TO CHOOSE<input data-file type="file" accept="application/json,.json" hidden></div><div class="mod-url"><input data-url type="url" placeholder="https://mods.example/stage.json" maxlength="2048"><button type="button" data-fetch>IMPORT URL</button></div><div class="mod-url"><input data-signed-url type="url" placeholder="https://repository.example/signed-package.json" maxlength="2048"><button type="button" data-fetch-signed>VERIFY + IMPORT</button></div><textarea data-json spellcheck="false" aria-label="Mod JSON" placeholder="Paste a stage mod JSON document"></textarea><div class="mod-actions"><button type="button" data-validate>VALIDATE</button><button type="button" data-import>ACTIVATE + SAVE</button></div><output data-status>READY</output><canvas data-preview width="480" height="180" aria-label="Validated stage preview"></canvas><ul data-mod-list></ul></section><section><h3>CHIPTUNE PATCH LAB</h3><div class="patch-grid"><label>ID<input data-patch="id" value="neon-pulse" maxlength="32"></label><label>NAME<input data-patch="name" value="Neon Pulse" maxlength="48"></label><label>WAVE<select data-patch="waveform"><option>pulse</option><option>square</option><option>sawtooth</option><option>triangle</option><option>sine</option><option>noise</option></select></label><label>START HZ<input data-patch="frequency" type="number" min="30" max="4000" value="880"></label><label>END HZ<input data-patch="endFrequency" type="number" min="20" max="4000" value="220"></label><label>DURATION<input data-patch="duration" type="number" min="0.02" max="2" step="0.01" value="0.18"></label><label>ATTACK<input data-patch="attack" type="number" min="0.001" max="0.2" step="0.001" value="0.008"></label><label>DECAY<input data-patch="decay" type="number" min="0.01" max="2" step="0.01" value="0.15"></label><label>DUTY<input data-patch="dutyCycle" type="number" min="0.125" max="0.75" step="0.125" value="0.25"></label><label>FILTER HZ<input data-patch="filterHz" type="number" min="80" max="12000" value="4200"></label><label>GAIN<input data-patch="gain" type="number" min="0.01" max="0.8" step="0.01" value="0.3"></label><label>SFX SLOT<select data-slot><option>LASER</option><option>EXPLOSION</option><option>COIN</option><option>POWER_UP</option><option>STAGE_CLEAR</option></select></label></div><div class="mod-actions"><button type="button" data-preview-patch>PREVIEW</button><button type="button" data-save-patch>SAVE + ASSIGN</button></div><output data-patch-status>READY</output><ul data-patch-list></ul></section></div>`;
    document.body.appendChild(this.root); this.bind(); this.state.hydrate(); this.renderLists(); if (new URLSearchParams(location.search).get('mods') === '1') this.toggle(true);
  }

  toggle(force?: boolean) { this.root.hidden = force === undefined ? !this.root.hidden : !force; if (!this.root.hidden) this.renderLists(); }

  private bind() {
    document.getElementById('mod-manager-toggle')?.addEventListener('click', () => this.toggle());
    this.pick('[data-close]').addEventListener('click', () => this.toggle(false));
    window.addEventListener('keydown', event => { const target = event.target as HTMLElement | null; const typing = target?.matches('input, textarea, select'); if (event.code === 'KeyO' && !event.ctrlKey && !event.metaKey && !typing) this.toggle(); if (event.code === 'Escape' && !this.root.hidden) this.toggle(false); });
    const drop = this.pick('[data-drop]'); const file = this.pick('[data-file]') as HTMLInputElement;
    drop.addEventListener('click', () => file.click()); file.addEventListener('change', () => { const selected = file.files?.[0]; if (selected) void this.readFile(selected); });
    drop.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('dragging'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragging'));
    drop.addEventListener('drop', event => { event.preventDefault(); drop.classList.remove('dragging'); const selected = event.dataTransfer?.files[0]; if (selected) void this.readFile(selected); });
    this.pick('[data-validate]').addEventListener('click', () => this.showInspection(this.state.inspect(this.draft())));
    this.pick('[data-import]').addEventListener('click', () => { const result = this.state.import(this.draft()); this.showInspection(result); this.renderLists(); });
    this.pick('[data-fetch]').addEventListener('click', () => void this.importUrl());
    this.pick('[data-fetch-signed]').addEventListener('click', () => void this.importSignedUrl());
    this.pick('[data-preview-patch]').addEventListener('click', () => this.previewPatch());
    this.pick('[data-save-patch]').addEventListener('click', () => this.savePatch());
  }

  private async readFile(file: File) { if (file.size > MOD_BYTES_MAX) { this.status('FILE EXCEEDS 64 KIB', false); return; } const raw = await file.text(); (this.pick('[data-json]') as HTMLTextAreaElement).value = raw; this.showInspection(this.state.inspect(raw)); }
  private async importUrl() { try { this.status('FETCHING', true); const raw = await fetchModJson((this.pick('[data-url]') as HTMLInputElement).value); (this.pick('[data-json]') as HTMLTextAreaElement).value = raw; const result = this.state.import(raw); this.showInspection(result); this.renderLists(); } catch (error) { this.status(error instanceof Error ? error.message : 'IMPORT FAILED', false); } }
  private async importSignedUrl() { try { this.status('VERIFYING SIGNATURE', true); const verified = await fetchSignedModPackage((this.pick('[data-signed-url]') as HTMLInputElement).value); this.verifiedCache.save(verified); const raw = JSON.stringify(verified.manifest); (this.pick('[data-json]') as HTMLTextAreaElement).value = raw; const result = this.state.import(raw); this.showInspection(result); this.status(result.valid ? `SIGNED ${verified.signer} // ${verified.sha256.slice(0, 12)}` : result.errors.join(' | '), result.valid); this.renderLists(); } catch (error) { this.status(error instanceof Error ? error.message : 'SIGNATURE CHECK FAILED', false); } }
  private showInspection(result: ModInspection) { this.status(result.valid ? `VALID ${result.manifest?.id}` : result.errors.join(' | '), result.valid); if (result.manifest) this.drawPreview(result.manifest); }

  private drawPreview(manifest: NonNullable<ModInspection['manifest']>) {
    const canvas = this.pick('[data-preview]') as HTMLCanvasElement; const context = canvas.getContext('2d'); if (!context) return;
    const primary = manifest.stage.skin?.primary ?? '#00ffcc'; const secondary = manifest.stage.skin?.secondary ?? '#ff0055';
    context.fillStyle = '#02060b'; context.fillRect(0, 0, canvas.width, canvas.height); context.strokeStyle = primary; context.lineWidth = 1;
    for (let lane = 0; lane < 8; lane++) { const y = 18 + lane * 20; context.globalAlpha = 0.24; context.beginPath(); context.moveTo(0, y); context.lineTo(canvas.width, y); context.stroke(); }
    context.globalAlpha = 1; for (const hazard of manifest.stage.hazards) { const x = 20 + hazard.offset * (canvas.width - 40); const y = 18 + hazard.lane * 20; context.fillStyle = hazard.kind === 'SPIKE' ? secondary : hazard.kind === 'DRONE' ? primary : '#ffff00'; if (hazard.kind === 'SPIKE') { context.beginPath(); context.moveTo(x, y - 7); context.lineTo(x - 7, y + 7); context.lineTo(x + 7, y + 7); context.fill(); } else context.fillRect(x - 7, y - 7, 14, 14); }
    context.fillStyle = primary; context.font = '12px monospace'; context.fillText(`${manifest.name} // ${manifest.stage.hazards.length} HAZARDS`, 12, 172);
  }

  private renderLists() {
    const mods = this.pick('[data-mod-list]'); mods.replaceChildren(...this.state.list().map(mod => this.listItem(`${mod.name} v${mod.version}`, () => { this.state.remove(mod.id); this.renderLists(); })));
    const patches = this.pick('[data-patch-list]'); patches.replaceChildren(...this.patches.load().map(patch => this.listItem(`${patch.name} // ${patch.waveform}`, () => { this.patches.remove(patch.id); this.renderLists(); })));
  }

  private listItem(label: string, remove: () => void) { const item = document.createElement('li'); const text = document.createElement('span'); text.textContent = label; const button = document.createElement('button'); button.type = 'button'; button.textContent = 'REMOVE'; button.addEventListener('click', remove); item.append(text, button); return item; }
  private readPatch(): SoundPatch { const value = (name: string) => (this.pick(`[data-patch="${name}"]`) as HTMLInputElement | HTMLSelectElement).value; return { id: value('id'), name: value('name'), waveform: value('waveform') as PatchWaveform, frequency: Number(value('frequency')), endFrequency: Number(value('endFrequency')), duration: Number(value('duration')), attack: Number(value('attack')), decay: Number(value('decay')), dutyCycle: Number(value('dutyCycle')), filterHz: Number(value('filterHz')), gain: Number(value('gain')) }; }
  private previewPatch() { const result = validateSoundPatch(this.readPatch()); if (!result.patch) { this.patchStatus(result.errors.join(' | '), false); return; } AudioEngine.initialize(); AudioEngine.playPatch(result.patch); this.patchStatus('PATCH PREVIEWED', true); }
  private savePatch() { const result = validateSoundPatch(this.readPatch()); if (!result.patch) { this.patchStatus(result.errors.join(' | '), false); return; } try { this.patches.save(result.patch); this.patches.assign((this.pick('[data-slot]') as HTMLSelectElement).value as PatchSlot, result.patch.id); this.patchStatus('PATCH SAVED + ASSIGNED', true); this.renderLists(); } catch (error) { this.patchStatus(error instanceof Error ? error.message : 'PATCH SAVE FAILED', false); } }
  private draft() { return (this.pick('[data-json]') as HTMLTextAreaElement).value; }
  private status(message: string, valid: boolean) { const output = this.pick('[data-status]'); output.textContent = message; output.classList.toggle('valid', valid); }
  private patchStatus(message: string, valid: boolean) { const output = this.pick('[data-patch-status]'); output.textContent = message; output.classList.toggle('valid', valid); }
  private pick(selector: string) { const element = this.root.querySelector<HTMLElement>(selector); if (!element) throw new Error(`Missing mod manager element: ${selector}`); return element; }
}

export function installModManager() { return new ModManagerController(); }
