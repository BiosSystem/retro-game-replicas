import Phaser from 'phaser';
import { cabinetAudioManager } from '../../core/audio/CabinetAudioManager';
import { TrackerProjectStore, defaultPatch, type TrackerProject } from '../../core/audio/TrackerProjectStore';
import { decodeSong, encodeSong } from '../../core/audio/tracker/SongCodec';
import { renderSongOffline } from '../../core/audio/tracker/OfflineRender';
import { TrackerPattern } from '../../core/audio/tracker/TrackerPattern';
import type { TrackerSong } from '../../core/audio/tracker/TrackerSequencer';
import { AudioEngine } from '../../engine/AudioEngine';
import { createNineSlicePanel } from '../../ui/NineSlicePanel';
import { mountNineSlicePanel } from '../../ui/NineSlicePanelRenderer';
import { ChannelVisualizer } from './ChannelVisualizer';
import { PatchEditorModel, PatchEditorPanel } from './PatchEditorPanel';
import { PatternGridModel, PatternGridView, TRACKER_PIANO_KEYS } from './PatternGridView';
import { PlaylistModel, TrackerTransportBar, TrackerTransportModel } from './TrackerTransportBar';

export default class TrackerStudioScene extends Phaser.Scene {
  private song!: TrackerSong;
  private gridModel!: PatternGridModel;
  private grid!: PatternGridView;
  private patchModel!: PatchEditorModel;
  private patchPanel!: PatchEditorPanel;
  private transportModel = new TrackerTransportModel();
  private transport!: TrackerTransportBar;
  private playlist!: PlaylistModel;
  private scopes!: ChannelVisualizer;
  private status!: Phaser.GameObjects.Text;
  private startedAt = 0;
  private readonly projects = new TrackerProjectStore();
  private cabinetScene = 'MetaArcadeScene';

  constructor() { super('TrackerStudioScene'); }

  create() {
    const project = this.projects.load(makeStudioProject);
    this.song = project.song; this.cabinetScene = project.cabinetScene; cabinetAudioManager.setCustomSong(this.cabinetScene, this.song);
    this.gridModel = new PatternGridModel(this.song.patterns[0]); this.patchModel = new PatchEditorModel(project.patch); this.playlist = new PlaylistModel([...this.song.order]);
    this.add.rectangle(320, 240, 640, 480, 0x03050d); mountNineSlicePanel(this, 320, 242, 620, 438, createNineSlicePanel('SOUND WORKSHOP // TRACKER STUDIO', 'MAGENTA_HEAT'));
    this.add.text(320, 44, '4 CHANNEL FM TRACKER // QWERTY NOTE ENTRY // F5 PLAY F8 STOP // [ ] MOD // F1-F3 FILTER // O EXPORT L LOAD CTRL+W WAV', { fontFamily: 'Courier', fontSize: '8px', color: '#cc99ff' }).setOrigin(.5).setDepth(22);
    this.grid = new PatternGridView(this, this.gridModel, 20, 125); this.patchPanel = new PatchEditorPanel(this, this.patchModel, 145, 88); this.transport = new TrackerTransportBar(this, this.transportModel, 320, 452);
    this.scopes = new ChannelVisualizer(this, AudioEngine.getTrackerAnalysers(), 410, 62); this.status = this.add.text(18, 473, '', { fontFamily: 'Courier', fontSize: '9px', color: '#66ffaa' }).setDepth(22);
    this.patchModel.subscribe(() => this.persistProject()); this.bindKeys(); this.refreshStatus(); this.updateTestState();
  }

  update(time: number) {
    if (this.transportModel.state !== 'STOPPED') {
      const rowSeconds = (2.5 / this.transportModel.bpm) * this.transportModel.speed;
      this.gridModel.setPlayhead(Math.floor((time - this.startedAt) / (rowSeconds * 1000)) % this.gridModel.pattern.rows); this.grid.render();
    }
    this.scopes.update(time);
    this.updateTestState();
  }

  private bindKeys() {
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'w' && event.ctrlKey) { event.preventDefault(); void this.renderWav(); return; }
      if (key in TRACKER_PIANO_KEYS) { event.preventDefault(); if (this.gridModel.insertPianoKey(key)) { void AudioEngine.auditionTrackerNote(TRACKER_PIANO_KEYS[key as keyof typeof TRACKER_PIANO_KEYS], this.patchModel.patch, this.gridModel.cursor.channel); this.grid.render(); this.persistProject(); this.refreshStatus(); } return; }
      if (event.key === 'ArrowUp') this.gridModel.move(-1, 0); else if (event.key === 'ArrowDown') this.gridModel.move(1, 0); else if (event.key === 'ArrowLeft') this.gridModel.move(0, -1); else if (event.key === 'ArrowRight') this.gridModel.move(0, 1); else if (event.key === 'Tab') { event.preventDefault(); this.gridModel.move(0, 1); }
      else if (event.key === 'Delete' || event.key === 'Backspace') this.gridModel.clearSelected();
      else if (event.key === ' ') { event.preventDefault(); if (this.transportModel.state === 'STOPPED') void this.playSong(); else this.stopSong(); }
      else if (event.key === 'F5') void this.playSong(); else if (event.key === 'F6') void this.playPattern(); else if (event.key === 'F8') this.stopSong(); else if (event.key === 'F9') { this.transportModel.record(); this.transport.render(); }
      else if (event.key === '[') this.adjustPatch(-.1); else if (event.key === ']') this.adjustPatch(.1); else if (event.key === 'F1') this.setFilter('lowpass'); else if (event.key === 'F2') this.setFilter('highpass'); else if (event.key === 'F3') this.setFilter('bandpass'); else if (event.key === 'PageUp') this.playlist.move(0, Math.min(this.playlist.order.length - 1, 1)); else if (event.key === 'PageDown') this.playlist.move(1, 0);
      else if (key === 'o') this.exportSong(); else if (key === 'l') this.openSongPicker(); else if (event.key === 'Escape') { this.stopSong(); this.scene.start('LobbyScene'); }
      this.grid.render(); this.persistProject(); this.refreshStatus();
    });
  }

  private async playSong() { this.transportModel.playSong(); this.song.bpm = this.transportModel.bpm; this.song.speed = this.transportModel.speed; this.startedAt = this.time.now; await AudioEngine.playTrackerSong(this.song); this.scopes.destroy(); this.scopes = new ChannelVisualizer(this, AudioEngine.getTrackerAnalysers(), 410, 62); this.persistProject(); this.transport.render(); this.refreshStatus(); }
  private async playPattern() { this.transportModel.playPattern(); this.startedAt = this.time.now; await AudioEngine.playTrackerSong({ ...this.song, order: new Uint16Array([this.playlist.order[0]]) }); this.transport.render(); this.refreshStatus(); }
  private stopSong() { this.transportModel.stop(); AudioEngine.stopTrackerSong(); this.transport.render(); this.refreshStatus(); }
  private refreshStatus() { this.status.setText(`ROW ${this.gridModel.cursor.row.toString(16).toUpperCase().padStart(2, '0')}  ${this.gridModel.selectedChannel()}  PATCH ${this.patchModel.patch.waveform}  PLAYLIST ${this.playlist.order.map(id => id.toString(16).toUpperCase()).join(' > ')}  CUSTOM BGM READY`); }
  private adjustPatch(delta: number) { this.patchModel.setModulationIndex(this.patchModel.patch.modulationIndex + delta); this.patchPanel.render(); void AudioEngine.auditionTrackerNote(60, this.patchModel.patch, this.gridModel.cursor.channel); }
  private setFilter(mode: 'lowpass' | 'highpass' | 'bandpass') { this.patchModel.setFilter(mode, this.patchModel.patch.filter.frequency, this.patchModel.patch.filter.q); this.patchPanel.render(); void AudioEngine.auditionTrackerNote(60, this.patchModel.patch, this.gridModel.cursor.channel); }

  private exportSong() { download('studio.neonseq', new Blob([encodeSong(this.song)], { type: 'application/octet-stream' })); }
  private async renderWav() { const rendered = await renderSongOffline(this.song); download('studio.wav', new Blob([rendered.wav], { type: 'audio/wav' })); }
  private openSongPicker() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.neonseq,application/octet-stream';
    input.onchange = async () => { const file = input.files?.[0]; if (!file) return; this.song = decodeSong(await file.arrayBuffer()); cabinetAudioManager.setCustomSong(this.cabinetScene, this.song); this.gridModel = new PatternGridModel(this.song.patterns[0]); this.grid.destroy(); this.grid = new PatternGridView(this, this.gridModel, 20, 125); this.playlist = new PlaylistModel([...this.song.order]); this.persistProject(); this.refreshStatus(); };
    input.click();
  }

  private persistProject() { this.song.order = new Uint16Array(this.playlist.order); this.projects.save({ song: this.song, patch: this.patchModel.patch, cabinetScene: this.cabinetScene }); cabinetAudioManager.setCustomSong(this.cabinetScene, this.song); }
  private updateTestState() {
    const canvas = this.game.canvas;
    canvas.dataset.arcadeScene = 'TrackerStudioScene'; canvas.dataset.trackerState = this.transportModel.state;
    canvas.dataset.trackerRow = String(this.gridModel.cursor.row); canvas.dataset.trackerPlayhead = String(this.gridModel.playheadRow);
    canvas.dataset.trackerScope = this.transportModel.state === 'STOPPED' ? 'idle' : 'active';
  }
}

function makeStudioProject(): TrackerProject {
  const pattern = new TrackerPattern(32); pattern.setCell(0, 'CH1', { note: 1, octave: 4, patchId: 1, volume: 180, effectType: 0, effectValue: 0 }); pattern.setCell(0, 'CH3', { note: 1, octave: 3, patchId: 2, volume: 150, effectType: 0, effectValue: 0 });
  const song = { bpm: 120, speed: 6, patterns: [pattern], order: new Uint16Array([0]), instruments: [{ id: 1, name: 'Lead' }, { id: 2, name: 'Bass' }], loopPosition: 0 };
  return { song, patch: defaultPatch(), cabinetScene: 'MetaArcadeScene' };
}

function download(name: string, blob: Blob) { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 0); }
