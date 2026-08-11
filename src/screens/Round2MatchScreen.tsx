import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { RoundResult } from '../game/types';
import { getMatchDifficulty } from '../game/difficulty';
import { generateMatchChallenge, MatchChallenge } from '../game/matchChallenge';
import { computeRoundScore, average } from '../game/scoring';
import { createRng, seedFromString } from '../game/rng';
import ShapeView from '../components/ShapeView';
import RoundHud from '../components/RoundHud';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Round2'>;

export default function Round2MatchScreen({ navigation, route }: Props) {
  const { level, result1, online } = route.params;
  const difficulty = useRef(getMatchDifficulty(level)).current;
  const rng = useRef(online ? createRng(seedFromString(`${online.seed}-r2`)) : Math.random).current;

  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challenge, setChallenge] = useState<MatchChallenge>(() => generateMatchChallenge(difficulty, rng));
  const [hits, setHits] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(difficulty.timePerChallengeMs);
  const [lockedWrongId, setLockedWrongId] = useState<string | null>(null);

  const challengeStartAt = useRef(Date.now());
  const reactionTimes = useRef<number[]>([]);
  const timeoutsCount = useRef(0);
  const missesCount = useRef(0);
  const ended = useRef(false);
  const challengeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const finishRound = useCallback(
    (finalHits: number) => {
      if (ended.current) return;
      ended.current = true;
      if (challengeTimeout.current) clearTimeout(challengeTimeout.current);
      if (tickInterval.current) clearInterval(tickInterval.current);

      const result2: RoundResult = {
        roundId: 2,
        label: "Trova l'uguale",
        hits: finalHits,
        misses: missesCount.current,
        timeouts: timeoutsCount.current,
        avgReactionMs: average(reactionTimes.current),
        score: computeRoundScore(
          finalHits,
          missesCount.current,
          timeoutsCount.current,
          average(reactionTimes.current)
        ),
      };
      navigation.replace('Round3', { level, result1, result2, online });
    },
    [level, navigation, online, result1]
  );

  const advance = useCallback(
    (nextHits: number) => {
      const next = challengeIndex + 1;
      if (next >= difficulty.totalChallenges) {
        finishRound(nextHits);
        return;
      }
      setChallengeIndex(next);
      setChallenge(generateMatchChallenge(difficulty, rng));
      setLockedWrongId(null);
      challengeStartAt.current = Date.now();
      setTimeLeftMs(difficulty.timePerChallengeMs);
    },
    [challengeIndex, difficulty, finishRound]
  );

  useEffect(() => {
    if (ended.current) return undefined;
    challengeStartAt.current = Date.now();
    challengeTimeout.current = setTimeout(() => {
      timeoutsCount.current += 1;
      advance(hits);
    }, difficulty.timePerChallengeMs);
    tickInterval.current = setInterval(() => {
      setTimeLeftMs((prev) => Math.max(0, prev - 100));
    }, 100);
    return () => {
      if (challengeTimeout.current) clearTimeout(challengeTimeout.current);
      if (tickInterval.current) clearInterval(tickInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeIndex]);

  const onOptionPress = (optionId: string) => {
    if (ended.current || lockedWrongId) return;
    if (challengeTimeout.current) clearTimeout(challengeTimeout.current);
    if (tickInterval.current) clearInterval(tickInterval.current);

    if (optionId === challenge.correctId) {
      reactionTimes.current.push(Date.now() - challengeStartAt.current);
      const nextHits = hits + 1;
      setHits(nextHits);
      advance(nextHits);
    } else {
      missesCount.current += 1;
      setLockedWrongId(optionId);
      setTimeout(() => advance(hits), 220);
    }
  };

  return (
    <View style={styles.container}>
      <RoundHud roundLabel="Trova l'uguale" roundIndex={2} timeLeftMs={timeLeftMs} hits={hits} />
      <Text style={styles.progress}>
        Sfida {Math.min(challengeIndex + 1, difficulty.totalChallenges)}/{difficulty.totalChallenges}
      </Text>

      <View style={styles.grid}>
        {challenge.options.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => onOptionPress(option.id)}
            style={[
              styles.optionCell,
              lockedWrongId === option.id && styles.optionCellWrong,
            ]}
          >
            <ShapeView shape={option.shape} color={option.color.value} size={44} />
          </Pressable>
        ))}
      </View>

      <View style={styles.referenceRow}>
        <Text style={styles.referenceLabel}>Trova:</Text>
        <View style={styles.referenceCard}>
          <ShapeView shape={challenge.reference.shape} color={challenge.reference.color.value} size={40} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  progress: {
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 14,
  },
  optionCell: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCellWrong: {
    borderColor: theme.danger,
    backgroundColor: '#3B1D1D',
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    paddingBottom: 34,
  },
  referenceLabel: {
    color: theme.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  referenceCard: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
