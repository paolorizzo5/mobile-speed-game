import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, OnlineMatchParams } from '../navigation/types';
import { loadPlayer } from '../game/storage';
import { getUserId } from '../lib/supabase';
import {
  findRandomMatch,
  cancelRandomSearch,
  createMatchWithCode,
  cancelHostedMatch,
  joinMatchByCode,
  subscribeToMatch,
  subscribeToIncomingMatch,
  fetchUsername,
} from '../game/onlineMatch';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'OnlineLobby'>;

type Status = 'working' | 'waitingRandom' | 'waitingHost' | 'error';

export default function OnlineLobbyScreen({ navigation, route }: Props) {
  const { mode, code } = route.params;
  const [status, setStatus] = useState<Status>('working');
  const [errorMessage, setErrorMessage] = useState('');
  const [hostCode, setHostCode] = useState<string | null>(null);

  const matchIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const cancelledRef = useRef(false);

  const goToMatch = (level: number, online: OnlineMatchParams) => {
    if (cancelledRef.current) return;
    navigation.replace('Round1', { level, online });
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const player = await loadPlayer();

        if (mode === 'random') {
          const outcome = await findRandomMatch(player.level);
          if (!active) return;
          if (outcome.matched && outcome.match) {
            goToMatch(outcome.match.level, outcome.match);
            return;
          }
          setStatus('waitingRandom');
          const myId = await getUserId();
          if (!myId) throw new Error('Sessione non disponibile');
          unsubscribeRef.current = subscribeToIncomingMatch(myId, (match) => {
            if (!active) return;
            goToMatch(match.level, match);
          });
          return;
        }

        if (mode === 'host') {
          const hosted = await createMatchWithCode(player.level);
          if (!active) return;
          matchIdRef.current = hosted.matchId;
          setHostCode(hosted.code);
          setStatus('waitingHost');
          unsubscribeRef.current = subscribeToMatch(hosted.matchId, async (row) => {
            if (!active) return;
            if (row.status === 'active' && row.player2_id) {
              const opponentName = await fetchUsername(row.player2_id);
              goToMatch(row.level, {
                matchId: row.id,
                seed: row.seed,
                level: row.level,
                opponentId: row.player2_id,
                opponentName,
              });
            }
          });
          return;
        }

        if (mode === 'join') {
          if (!code) throw new Error('Codice mancante');
          const match = await joinMatchByCode(code);
          if (!active) return;
          goToMatch(match.level, match);
          return;
        }
      } catch (err) {
        if (!active) return;
        setErrorMessage(err instanceof Error ? err.message : 'Errore imprevisto');
        setStatus('error');
      }
    })();

    return () => {
      active = false;
      unsubscribeRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCancel = async () => {
    cancelledRef.current = true;
    unsubscribeRef.current?.();
    if (mode === 'random') await cancelRandomSearch();
    if (mode === 'host' && matchIdRef.current) await cancelHostedMatch(matchIdRef.current);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {status !== 'error' ? (
        <>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.statusTitle}>
            {status === 'working' && 'Un attimo...'}
            {status === 'waitingRandom' && 'Ricerca avversario...'}
            {status === 'waitingHost' && 'In attesa che qualcuno si unisca'}
          </Text>
          {status === 'waitingHost' && hostCode && (
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>Condividi questo codice</Text>
              <Text style={styles.codeValue}>{hostCode}</Text>
            </View>
          )}
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Annulla</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.errorTitle}>Non è stato possibile continuare</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Torna indietro</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  statusTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  codeCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.primary,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
  },
  codeLabel: {
    color: theme.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  codeValue: {
    color: theme.primary,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 6,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    color: theme.textMuted,
    fontWeight: '700',
  },
  errorTitle: {
    color: theme.danger,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMessage: {
    color: theme.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
