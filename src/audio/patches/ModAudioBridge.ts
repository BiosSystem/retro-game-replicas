import { arcadeModRuntime } from '../../mods/ModRuntime';
import type { ModEventName } from '../../mods/ModSchema';
import { AudioEngine } from '../../engine/AudioEngine';
import { SoundPatchStore } from './SoundPatchStore';

export function playModAudioEvent(event: ModEventName, stage: number) {
  const store = typeof localStorage === 'undefined' ? null : new SoundPatchStore(localStorage);
  for (const dispatch of arcadeModRuntime.dispatch({ event, stage })) {
    const action = dispatch.action;
    if (action.type === 'PLAY_EFFECT') AudioEngine.playEffect(action.effect);
    if (action.type === 'PLAY_PATCH') {
      const patch = store?.load().find(candidate => candidate.id === action.patchId);
      if (patch) AudioEngine.playPatch(patch);
    }
  }
}
