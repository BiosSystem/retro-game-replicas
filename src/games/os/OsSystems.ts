import { executeNeonScript } from '../../engine/compiler/NeonDslCompiler';
import { GridCoordinator, localGridPeer } from '../../net/grid/GridCoordinator';

export interface OsWindow { id: number; title: string; x: number; y: number; width: number; height: number; }

export class NeonWindowManager {
  private readonly windows: OsWindow[] = [];
  open(title: string): OsWindow {
    if (this.windows.length >= 8) throw new Error('Window limit reached');
    const id = this.windows.length + 1, column = (id - 1) % 3, row = Math.floor((id - 1) / 3);
    const window = { id, title: title.slice(0, 24), x: 28 + column * 196, y: 92 + row * 112, width: 176, height: 92 };
    this.windows.push(window); return window;
  }
  list(): readonly OsWindow[] { return this.windows; }
  close(id: number): boolean { const index = this.windows.findIndex(window => window.id === id); if (index < 0) return false; this.windows.splice(index, 1); return true; }
}

export interface TerminalResult { output: string; value?: number; }

export class NeonTerminal {
  private readonly grid = new GridCoordinator();
  constructor() { this.grid.addPeer(localGridPeer('os-local-a')); this.grid.addPeer(localGridPeer('os-local-b')); }
  async execute(commandLine: string): Promise<TerminalResult> {
    const command = commandLine.trim(); if (command.length > 4096) throw new Error('Command exceeds terminal limit');
    const [verb = '', ...rest] = command.split(/\s+/); const argument = rest.join(' ');
    if (verb.toUpperCase() === 'HELP') return { output: 'HELP  RUN <input> <dsl>  GRID <csv>  WINDOWS  CLEAR' };
    if (verb.toUpperCase() === 'RUN') {
      const [inputText = '', ...sourceParts] = argument.split(' '); const input = Number(inputText); if (!Number.isInteger(input)) throw new Error('RUN requires an integer input');
      const source = sourceParts.join(' ').replaceAll('|', ';'); const value = await executeNeonScript(source, input); return { output: `PROCESS EXIT ${value}`, value };
    }
    if (verb.toUpperCase() === 'GRID') {
      const values = argument.split(',').filter(Boolean).map(Number); const result = await this.grid.execute('GRADIENT_SUM', values, 64); return { output: `GRID ${result.shards} SHARDS ${result.value}`, value: result.value };
    }
    if (verb.toUpperCase() === 'WINDOWS') return { output: 'WINDOW MANAGER READY' };
    if (verb.toUpperCase() === 'CLEAR') return { output: '' };
    throw new Error('Unknown terminal command');
  }
}

export async function compileOsWebGpuLayout(): Promise<'COMPILED' | 'UNAVAILABLE'> {
  const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<{ requestDevice(): Promise<{ createShaderModule(input: { code: string }): { getCompilationInfo(): Promise<{ messages: { type: string }[] }> } }> } | null> } }).gpu;
  if (!gpu) return 'UNAVAILABLE'; const adapter = await gpu.requestAdapter(); if (!adapter) return 'UNAVAILABLE'; const device = await adapter.requestDevice();
  const module = device.createShaderModule({ code: '@compute @workgroup_size(1) fn main() {}' }); const info = await module.getCompilationInfo(); return info.messages.some(message => message.type === 'error') ? 'UNAVAILABLE' : 'COMPILED';
}
