import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet, LayoutChangeEvent } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { COLORS, SHAPES, GameColor, ShapeType, RoundResult, randomItem } from '../game/types';
import { getScrollDifficulty } from '../game/difficulty';
import { computeRoundScore, average } from '../game/scoring';
import ShapeView from '../components/ShapeView';
import RoundHud from '../components/RoundHud';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Round3'>;

interface ScrollItem {
  id: string;
  shape: ShapeType;
  color: GameColor;
  laneIndex: number;
  matches: boolean;
  spawnedAt: number;
  anim: Animated.Value;
}

const ITEM_SIZE = 48;

export default function Round3ScrollScreen({ navigation, route }: Props) {
  const { level, result1, result2 } = route.params;
  const difficulty = useRef(getScrollDifficulty(level)).current;
  const target = useRef({ shape: randomItem(SHAPES), color: randomItem(COLORS) }).current;

  const [items, setItems] = useState<ScrollItem[]>([]);
  const [hits, setHits] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(difficulty.durationMs);
  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });

  const areaSizeRef = useRef(areaSize);
  const reactionTimes = useRef<number[]>([]);
  const timeoutsCount = useRef(0);
  const missesCount = useRef(0);
  const ended = useRef(false);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const itemsRef = useRef<ScrollItem[]>([]);

  useEffect(() => {
    areaSizeRef.current = areaSize;
  }, [areaSize]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const finishRound = useCallback(() => {
    if (ended.current) return;
    ended.current = true;
    if (spawnTimer.current) clearInterval(spawnTimer.current);
    if (tickTimer.current) clearInterval(tickTimer.current);

    setHits((finalHits) => {
      const result3: RoundResult = {
        roundId: 3,
        label: 'Scorrimento',
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
      navigation.replace('Results', { level, result1, result2, result3 });
      return finalHits;
    });
  }, [level, navigation, result1, result2]);

  const spawnItem = useCallback(() => {
    const { width, height } = areaSizeRef.current;
    if (width < 10 || height < 10) return;

    const laneIndex = Math.floor(Math.random() * difficulty.laneCount);
    const isMatch = Math.random() < difficulty.matchChance;
    let shape: ShapeType;
    let color: GameColor;
    if (isMatch) {
      shape = target.shape;
      color = target.color;
    } else {
      do {
        shape = randomItem(SHAPES);
        color = randomItem(COLORS);
      } while (shape === target.shape && color.name === target.color.name);
    }

    const id = `${Date.now()}-${Math.random()}`;
    const anim = new Animated.Value(width);
    const distance = width + ITEM_SIZE;
    const durationMs = (distance / difficulty.speedPxPerSec) * 1000;

    const item: ScrollItem = {
      id,
      shape,
      color,
      laneIndex,
      matches: isMatch,
      spawnedAt: Date.now(),
      anim,
    };
    setItems((prev) => [...prev, item]);

    Animated.timing(anim, {
      toValue: -ITEM_SIZE,
      duration: durationMs,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      const stillThere = itemsRef.current.some((it) => it.id === id);
      if (stillThere) {
        if (isMatch) timeoutsCount.current += 1;
        removeItem(id);
      }
    });
  }, [difficulty, removeItem, target]);

  useEffect(() => {
    spawnTimer.current = setInterval(spawnItem, difficulty.spawnIntervalMs);
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onItemPress = (item: ScrollItem) => {
    if (ended.current) return;
    item.anim.stopAnimation();
    if (item.matches) {
      reactionTimes.current.push(Date.now() - item.spawnedAt);
      setHits((h) => h + 1);
    } else {
      missesCount.current += 1;
    }
    removeItem(item.id);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setAreaSize({ width, height });
  };

  const laneHeight = areaSize.height > 0 ? areaSize.height / difficulty.laneCount : 0;

  return (
    <View style={styles.container}>
      <RoundHud roundLabel="Scorrimento" roundIndex={3} timeLeftMs={timeLeftMs} hits={hits} />

      <View style={styles.targetBar}>
        <Text style={styles.targetLabel}>Colpisci:</Text>
        <View style={styles.targetCard}>
          <ShapeView shape={target.shape} color={target.color.value} size={30} />
        </View>
      </View>

      <View style={styles.area} onLayout={onLayout}>
        {items.map((item) => (
          <Animated.View
            key={item.id}
            style={{
              position: 'absolute',
              top: item.laneIndex * laneHeight + Math.max(0, (laneHeight - ITEM_SIZE) / 2),
              transform: [{ translateX: item.anim }],
            }}
          >
            <Pressable onPress={() => onItemPress(item)} hitSlop={6}>
              <ShapeView shape={item.shape} color={item.color.value} size={ITEM_SIZE} />
            </Pressable>
          </Animated.View>
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
  targetBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.bgAlt,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  targetLabel: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  targetCard: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  area: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
});
