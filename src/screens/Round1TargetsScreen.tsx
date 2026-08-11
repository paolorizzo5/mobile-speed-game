import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { COLORS, SHAPES, GameItem, RoundResult, randomItem } from '../game/types';
import { getTargetsDifficulty } from '../game/difficulty';
import { computeRoundScore, average } from '../game/scoring';
import { createRng, seedFromString } from '../game/rng';
import ShapeView from '../components/ShapeView';
import RoundHud from '../components/RoundHud';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Round1'>;

interface ActiveTarget extends GameItem {
  x: number;
  y: number;
  size: number;
  spawnedAt: number;
}

export default function Round1TargetsScreen({ navigation, route }: Props) {
  const { level, online } = route.params;
  const difficulty = useRef(getTargetsDifficulty(level)).current;
  const rng = useRef(online ? createRng(seedFromString(`${online.seed}-r1`)) : Math.random).current;

  const [targets, setTargets] = useState<ActiveTarget[]>([]);
  const [hits, setHits] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(difficulty.durationMs);
  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });

  const areaSizeRef = useRef(areaSize);
  const reactionTimes = useRef<number[]>([]);
  const timeoutsCount = useRef(0);
  const missesCount = useRef(0);
  const ended = useRef(false);
  const targetTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    areaSizeRef.current = areaSize;
  }, [areaSize]);

  const finishRound = useCallback(() => {
    if (ended.current) return;
    ended.current = true;
    if (spawnTimer.current) clearInterval(spawnTimer.current);
    if (tickTimer.current) clearInterval(tickTimer.current);
    Object.values(targetTimers.current).forEach(clearTimeout);

    const result: RoundResult = {
      roundId: 1,
      label: 'Bersagli',
      hits,
      misses: missesCount.current,
      timeouts: timeoutsCount.current,
      avgReactionMs: average(reactionTimes.current),
      score: computeRoundScore(hits, missesCount.current, timeoutsCount.current, average(reactionTimes.current)),
    };
    navigation.replace('Round2', { level, result1: result, online });
  }, [hits, level, navigation, online]);

  const spawnTarget = useCallback(() => {
    const { width, height } = areaSizeRef.current;
    if (width < 10 || height < 10) return;
    const size = difficulty.targetSize;
    const id = `${Date.now()}-${Math.random()}`;
    const x = rng() * Math.max(1, width - size);
    const y = rng() * Math.max(1, height - size);
    const item: ActiveTarget = {
      id,
      shape: randomItem(SHAPES, rng),
      color: randomItem(COLORS, rng),
      x,
      y,
      size,
      spawnedAt: Date.now(),
    };
    setTargets((prev) => [...prev, item]);
    targetTimers.current[id] = setTimeout(() => {
      timeoutsCount.current += 1;
      setTargets((prev) => prev.filter((t) => t.id !== id));
      delete targetTimers.current[id];
    }, difficulty.targetLifespanMs);
  }, [difficulty]);

  useEffect(() => {
    spawnTimer.current = setInterval(spawnTarget, difficulty.spawnIntervalMs);
    tickTimer.current = setInterval(() => {
      setTimeLeftMs((prev) => {
        const next = prev - 200;
        if (next <= 0) {
          finishRound();
          return 0;
        }
        return next;
      });
    }, 200);
    return () => {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
      if (tickTimer.current) clearInterval(tickTimer.current);
      Object.values(targetTimers.current).forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onHit = (target: ActiveTarget) => {
    if (ended.current) return;
    const timer = targetTimers.current[target.id];
    if (timer) {
      clearTimeout(timer);
      delete targetTimers.current[target.id];
    }
    reactionTimes.current.push(Date.now() - target.spawnedAt);
    setHits((h) => h + 1);
    setTargets((prev) => prev.filter((t) => t.id !== target.id));
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setAreaSize({ width, height });
  };

  return (
    <View style={styles.container}>
      <RoundHud roundLabel="Bersagli" roundIndex={1} timeLeftMs={timeLeftMs} hits={hits} />
      <View style={styles.area} onLayout={onLayout}>
        {targets.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => onHit(t)}
            style={{ position: 'absolute', left: t.x, top: t.y }}
            hitSlop={8}
          >
            <ShapeView shape={t.shape} color={t.color.value} size={t.size} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  area: {
    flex: 1,
    position: 'relative',
  },
});
