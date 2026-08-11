import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface Props {
  roundLabel: string;
  roundIndex: 1 | 2 | 3;
  timeLeftMs: number;
  hits: number;
}

export default function RoundHud({ roundLabel, roundIndex, timeLeftMs, hits }: Props) {
  const seconds = Math.max(0, Math.ceil(timeLeftMs / 1000));
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.roundTag}>Round {roundIndex}/3</Text>
        <Text style={styles.roundLabel}>{roundLabel}</Text>
      </View>
      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{hits}</Text>
          <Text style={styles.statLabel}>punti</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{seconds}s</Text>
          <Text style={styles.statLabel}>tempo</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: theme.bgAlt,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  roundTag: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  roundLabel: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  statValue: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 16,
  },
  statLabel: {
    color: theme.textMuted,
    fontSize: 10,
  },
});
