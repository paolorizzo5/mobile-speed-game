import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { RoundResult } from '../game/types';
import { loadPlayer, savePlayer } from '../game/storage';
import { computeOverallScore, computeNextLevel, LevelChange } from '../game/leveling';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export default function ResultsScreen({ navigation, route }: Props) {
  const { level, result1, result2, result3 } = route.params;
  const results: RoundResult[] = [result1, result2, result3];
  const overallScore = useRef(computeOverallScore(results)).current;

  const [newLevel, setNewLevel] = useState<number | null>(null);
  const [change, setChange] = useState<LevelChange>('same');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const player = await loadPlayer();
      const { level: nextLevel, change: levelChange } = computeNextLevel(level, overallScore);
      await savePlayer({
        level: nextLevel,
        xp: player.xp + overallScore,
        gamesPlayed: player.gamesPlayed + 1,
        bestScore: Math.max(player.bestScore, overallScore),
      });
      setNewLevel(nextLevel);
      setChange(levelChange);
      setReady(true);
    })();
  }, [level, overallScore]);

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const playAgain = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }, { name: 'Round1', params: { level: newLevel ?? level } }],
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Partita completata</Text>
      <Text style={styles.overallScore}>{overallScore}</Text>
      <Text style={styles.overallLabel}>punteggio complessivo</Text>

      {ready && (
        <View
          style={[
            styles.levelBanner,
            change === 'up' && styles.levelBannerUp,
            change === 'down' && styles.levelBannerDown,
          ]}
        >
          <Text style={styles.levelBannerText}>
            {change === 'up' && `Sei salito al livello ${newLevel}! 🎉`}
            {change === 'down' && `Sei sceso al livello ${newLevel}.`}
            {change === 'same' && `Resti al livello ${newLevel}.`}
          </Text>
        </View>
      )}

      <View style={styles.breakdown}>
        {results.map((r) => (
          <View key={r.roundId} style={styles.roundRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.roundTitle}>
                Round {r.roundId} · {r.label}
              </Text>
              <Text style={styles.roundDetail}>
                {r.hits} colpiti · {r.misses} errati · {r.timeouts} mancati · {r.avgReactionMs}ms media
              </Text>
            </View>
            <Text style={styles.roundScore}>{r.score}</Text>
          </View>
        ))}
      </View>

      <Pressable style={[styles.button, styles.primaryButton]} onPress={playAgain}>
        <Text style={styles.buttonText}>Rigioca</Text>
      </Pressable>
      <Pressable style={[styles.button, styles.secondaryButton]} onPress={goHome}>
        <Text style={styles.buttonText}>Torna alla Home</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.bg,
    padding: 24,
    paddingTop: 72,
    alignItems: 'center',
  },
  title: {
    color: theme.text,
    fontSize: 22,
    fontWeight: '800',
  },
  overallScore: {
    color: theme.primary,
    fontSize: 64,
    fontWeight: '800',
    marginTop: 12,
  },
  overallLabel: {
    color: theme.textMuted,
    fontSize: 13,
    marginBottom: 20,
  },
  levelBanner: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
  },
  levelBannerUp: {
    backgroundColor: '#14301F',
    borderColor: theme.success,
  },
  levelBannerDown: {
    backgroundColor: '#3B1D1D',
    borderColor: theme.danger,
  },
  levelBannerText: {
    color: theme.text,
    textAlign: 'center',
    fontWeight: '700',
  },
  breakdown: {
    width: '100%',
    backgroundColor: theme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    gap: 14,
    marginBottom: 28,
  },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roundTitle: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 14,
  },
  roundDetail: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  roundScore: {
    color: theme.primary,
    fontSize: 22,
    fontWeight: '800',
    minWidth: 48,
    textAlign: 'right',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: theme.primary,
  },
  secondaryButton: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
