import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_LEVEL, MIN_LEVEL, Player } from './types';

const STORAGE_KEY = '@mobile-speed-game/player';

const DEFAULT_PLAYER: Player = {
  level: 1,
  xp: 0,
  gamesPlayed: 0,
  bestScore: 0,
};

export async function loadPlayer(): Promise<Player> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLAYER;
    const parsed = JSON.parse(raw) as Player;
    return { ...DEFAULT_PLAYER, ...parsed };
  } catch {
    return DEFAULT_PLAYER;
  }
}

export async function savePlayer(player: Player): Promise<void> {
  const clamped: Player = {
    ...player,
    level: Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, player.level)),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clamped));
}

export async function resetPlayer(): Promise<Player> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PLAYER));
  return DEFAULT_PLAYER;
}
