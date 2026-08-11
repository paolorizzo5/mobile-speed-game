import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { loadPlayer } from '../game/storage';
import { Player } from '../game/types';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [player, setPlayer] = useState<Player | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadPlayer().then((p) => {
        if (active) setPlayer(p);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reflex Rush</Text>
      <Text style={styles.subtitle}>Sfida i tuoi riflessi in 3 round</Text>

      <View style={styles.levelCard}>
        <Text style={styles.levelLabel}>Livello attuale</Text>
        <Text style={styles.levelValue}>{player?.level ?? '—'}</Text>
        <Text style={styles.levelSub}>
          Partite giocate: {player?.gamesPlayed ?? 0} · Miglior punteggio:{' '}
          {player?.bestScore ?? 0}
        </Text>
      </View>

      <View style={styles.rulesCard}>
        <RuleItem
          index={1}
          title="Bersagli"
          desc="Colpisci le forme colorate appena compaiono sullo schermo, prima che scompaiano."
        />
        <RuleItem
          index={2}
          title="Trova l'uguale"
          desc="In basso a sinistra trovi un modello: tocca la forma sullo schermo identica per colore e forma."
        />
        <RuleItem
          index={3}
          title="Scorrimento"
          desc="Le forme scorrono sullo schermo: colpisci solo quelle dello stesso colore e forma del bersaglio indicato."
        />
      </View>

      <Text style={styles.hint}>
        Il punteggio complessivo dei 3 round determina se sali o scendi di livello.
      </Text>

      <Pressable
        style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}
        onPress={() => navigation.navigate('Round1', { level: player?.level ?? 1 })}
      >
        <Text style={styles.playButtonText}>Gioca</Text>
      </Pressable>
    </ScrollView>
  );
}

function RuleItem({ index, title, desc }: { index: number; title: string; desc: string }) {
  return (
    <View style={styles.ruleItem}>
      <View style={styles.ruleBadge}>
        <Text style={styles.ruleBadgeText}>{index}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.ruleTitle}>{title}</Text>
        <Text style={styles.ruleDesc}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.bg,
    padding: 24,
    paddingTop: 72,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  levelCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
  },
  levelLabel: {
    color: theme.textMuted,
    fontSize: 14,
  },
  levelValue: {
    color: theme.primary,
    fontSize: 48,
    fontWeight: '800',
    marginVertical: 4,
  },
  levelSub: {
    color: theme.textMuted,
    fontSize: 12,
  },
  rulesCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 14,
  },
  ruleItem: {
    flexDirection: 'row',
    gap: 12,
  },
  ruleBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleBadgeText: {
    color: theme.text,
    fontWeight: '700',
  },
  ruleTitle: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 15,
  },
  ruleDesc: {
    color: theme.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  hint: {
    color: theme.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  playButton: {
    marginTop: 12,
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  playButtonPressed: {
    backgroundColor: theme.primaryDark,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
