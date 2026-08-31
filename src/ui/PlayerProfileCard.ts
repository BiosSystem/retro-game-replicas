import { RetroProfileStore, type RetroProfile, type StoragePort } from './profile/RetroProfile';
import { readCabinetPalette, writeCabinetPalette, type CabinetPaletteName } from './NineSlicePanel';

export interface PlayerProfileCard {
  profile: RetroProfile;
  palette: CabinetPaletteName;
  title: string;
  pingLabel: string;
}

export function loadPlayerProfileCard(storage: StoragePort): PlayerProfileCard {
  const profile = new RetroProfileStore(storage).load();
  return { profile, palette: readCabinetPalette(storage), title: 'LOCAL ACE', pingLabel: 'LOCAL 0MS' };
}

export function setPlayerProfilePalette(storage: StoragePort, palette: CabinetPaletteName): PlayerProfileCard {
  writeCabinetPalette(storage, palette);
  return loadPlayerProfileCard(storage);
}
