export interface ArcadeGameDefinition {
  name: string;
  scene: string;
  icon: string;
}

export interface ArcadeDifficultyDefinition {
  name: string;
  id: 'EASY' | 'NORMAL' | 'HARD' | 'EXPERT';
  color: string;
  description: string;
}

export const ARCADE_GAMES: readonly ArcadeGameDefinition[] = [
  { name: 'SNAKE EVOLUTION', scene: 'SnakeScene', icon: '🐍' },
  { name: 'NEON PONG', scene: 'PongScene', icon: '🏓' },
  { name: 'NEON VECTOR', scene: 'AsteroidsScene', icon: '🚀' },
  { name: 'NEON BREAKER', scene: 'BreakoutScene', icon: '🧱' },
  { name: 'FROGGIE CROSSER', scene: 'FroggerScene', icon: '🐸' },
  { name: 'SPACE DEFENDERS', scene: 'InvadersScene', icon: '👾' },
  { name: 'TETRIS PULSE', scene: 'TetrisScene', icon: '🟦' },
  { name: 'MINESWEEPER', scene: 'MinesweeperScene', icon: '💣' },
  { name: 'PIXEL RUNNER', scene: 'RunnerScene', icon: '🏃' },
  { name: 'BRAVE BIRD', scene: 'BirdScene', icon: '🐦' },
  { name: 'CYBER CHASM', scene: 'CyberScene', icon: '⚡' },
  { name: 'CYBER-RACER', scene: 'RacerScene', icon: '🏁' },
  { name: 'NEON CYBER-CASTER', scene: 'RaycasterScene', icon: '🔫' },
  { name: 'META-ARCADE HALL', scene: 'MetaArcadeScene', icon: '🏛️' },
  { name: 'SOUND WORKSHOP / TRACKER STUDIO', scene: 'TrackerStudioScene', icon: '♫' },
  { name: 'CABINET ART / DECAL WORKSHOP', scene: 'DecalWorkshopScene', icon: '✎' },
  { name: 'NEON TACTICS', scene: 'TacticsScene', icon: '♟️' },
  { name: 'NEON LABYRINTH', scene: 'LabyrinthScene', icon: '🕸️' },
  { name: 'NEON DANMAKU', scene: 'DanmakuScene', icon: '✦' },
  { name: 'NEON KOMBAT', scene: 'KombatScene', icon: '🥊' },
  { name: 'NEON ODYSSEY', scene: 'OdysseyScene', icon: '◉' },
  { name: 'NEON CHRONO', scene: 'ChronoScene', icon: '⌛' },
  { name: 'NEON PARADOX', scene: 'ParadoxScene', icon: '◇' },
  { name: 'NEON NEXUS', scene: 'NexusScene', icon: '◎' },
  { name: 'NEON GENESIS', scene: 'GenesisScene', icon: '✺' },
  { name: 'NEON OS', scene: 'OsScene', icon: '▣' },
  { name: 'THE SINGULARITY', scene: 'SingularityScene', icon: '∞' },
  { name: 'EVENT HORIZON', scene: 'HorizonScene', icon: '◌' },
  { name: 'NEON EPOCH', scene: 'EpochScene', icon: '◈' },
  { name: 'NEON RELAY', scene: 'RelayScene', icon: '⌁' },
  { name: 'PRISM SPIRAL', scene: 'SpiralScene', icon: '◉' },
];

export const ARCADE_DIFFICULTIES: readonly ArcadeDifficultyDefinition[] = [
  { name: 'EASY', id: 'EASY', color: '#00ffcc', description: 'Relaxed pace, forgiving AI.' },
  { name: 'NORMAL', id: 'NORMAL', color: '#00ff6e', description: 'Balanced arcade challenge.' },
  { name: 'HARD', id: 'HARD', color: '#ffcc00', description: 'High speed, aggressive AI.' },
  { name: 'EXPERT', id: 'EXPERT', color: '#ff2255', description: 'Maximum velocity. Extreme.' },
];
