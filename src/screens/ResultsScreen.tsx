import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { RoundResult } from '../game/types';
import { loadPlayer, savePlayer } from '../game/storage';
import { computeOverallScore, computeNextLevel, LevelChange } from '../game/leveling';
import { getUserId } from '../lib/supabase';
import { submitMatchResult, fetchMatchPlayers, subscribeToMatchPlayers, MatchPlayerRow } from '../game/onlineMatch';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

type OnlineStatus = 'submitting' | 'waitingOpponent' | 'done' | 'failed';

export default function ResultsScreen({ navigation, route }: Props) {
  const { level, result1, result2, result3, online } = route.params;
  const results: RoundResult[] = [result1, result2, result3];
  const overallScore = useRef(computeOverallScore(results)).current;

  const [newLevel, setNewLevel] = useState<number | null>(null);
  const [change, setChange] = useState<LevelChange>('same');
  const [ready, setReady] = useState(false);

  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>('submitting');
  const [opponentRow, setOpponentRow] = useState<MatchPlayerRow | null>(null);

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

  useEffect(() => {
    if (!online) return undefined;
    let active = true;
    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
        await submitMatchResult(online.matchId, result1.score, result2.score, result3.score, overallScore);
        if (!active) return;

        const myId = await getUserId();
        const checkRows = (rows: MatchPlayerRow[]) => {
          const opponent = rows.find((r) => r.player_id !== myId);
          if (opponent?.submitted_at) {
            setOpponentRow(opponent);
            setOnlineStatus('done');
            unsubscribe?.();
            return true;
          }
          return false;
        };

        setOnlineStatus('waitingOpponent');
        const rows = await fetchMatchPlayers(online.matchId);
        if (!active) return;
        if (!checkRows(rows)) {
          unsubscribe = subscribeToMatchPlayers(online.matchId, (nextRows) => {
            if (active) checkRows(nextRows);
          });
        }
      } catch {
        if (active) setOnlineStatus('failed');
      }
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online?.matchId]);

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const playAgain = () => {
    if (online) {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }, { name: 'Online' }] });
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }, { name: 'Round1', params: { level: newLevel ?? level } }],
    });
  };

  const opponentScore = opponentRow?.overall_score ?? null;
  const outcome =
    opponentScore === null
      ? null
      : overallScore > opponentScore
        ? 'win'
        : overallScore < opponentScore
          ? 'lose'
          : 'draw';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Partita completata</Text>
      <Text style={styles.overallScore}>{overallScore}</Text>
      <Text style={styles.overallLabel}>punteggio complessivo</Text>

      {online && (
        <View
          style={[
            styles.onlineCard,
            outcome === 'win' && styles.levelBannerUp,
            outcome === 'lose' && styles.levelBannerDown,
          ]}
        >
          {onlineStatus === 'submitting' && (
            <>
              <ActivityIndicator color={theme.primary} />
              <Text style={styles.onlineStatusText}>Invio del punteggio...</Text>
            </>
          )}
          {onlineStatus === 'waitingOpponent' && (
            <>
              <ActivityIndicator color={theme.primary} />
              <Text style={styles.onlineStatusText}>In attesa di {online.opponentName}...</Text>
            </>
          )}
          {onlineStatus === 'failed' && (
            <Text style={styles.onlineStatusText}>Non è stato possibile inviare il punteggio online.</Text>
          )}
          {onlineStatus === 'done' && opponentRow && (
            <>
              <Text style={styles.onlineOutcome}>
                {outcome === 'win' && `Hai battuto ${online.opponentName}! 🏆`}
                {outcome === 'lose' && `${online.opponentName} ha vinto questa sfida.`}
                {outcome === 'draw' && 'Pareggio!'}
              </Text>
              <View style={styles.vsRow}>
                <View style={styles.vsBox}>
                  <Text style={styles.vsLabel}>Tu</Text>
                  <Text style={styles.vsScore}>{overallScore}</Text>
                </View>
                <Text style={styles.vsSeparator}>vs</Text>
                <View style={styles.vsBox}>
                  <Text style={styles.vsLabel}>{online.opponentName}</Text>
                  <Text style={styles.vsScore}>{opponentScore}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      )}

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
        <Text style={styles.buttonText}>{online ? 'Nuova sfida online' : 'Rigioca'}</Text>
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
  onlineCard: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  onlineStatusText: {
    color: theme.textMuted,
    fontWeight: '600',
  },
  onlineOutcome: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  vsBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  vsLabel: {
    color: theme.textMuted,
    fontSize: 12,
  },
  vsScore: {
    color: theme.text,
    fontSize: 28,
    fontWeight: '800',
  },
  vsSeparator: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '700',
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
