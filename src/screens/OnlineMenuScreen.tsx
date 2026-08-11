import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { isSupabaseConfigured } from '../lib/supabase';
import { theme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Online'>;

export default function OnlineMenuScreen({ navigation }: Props) {
  const [code, setCode] = useState('');

  if (!isSupabaseConfigured) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Sfida online</Text>
        <View style={styles.notConfiguredCard}>
          <Text style={styles.notConfiguredTitle}>Backend non configurato</Text>
          <Text style={styles.notConfiguredText}>
            Per giocare online serve un progetto Supabase collegato all&apos;app: crealo su supabase.com,
            esegui supabase/schema.sql nel SQL editor, abilita gli accessi anonimi (Authentication →
            Providers → Anonymous) e imposta EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
            (vedi .env.example e il README).
          </Text>
        </View>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Torna indietro</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Sfida online</Text>
      <Text style={styles.subtitle}>
        Stessa sequenza di forme per entrambi: vince chi totalizza il punteggio più alto sui 3 round.
      </Text>

      <Pressable
        style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        onPress={() => navigation.navigate('OnlineLobby', { mode: 'random' })}
      >
        <Text style={styles.primaryButtonText}>Trova avversario casuale</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
        onPress={() => navigation.navigate('OnlineLobby', { mode: 'host' })}
      >
        <Text style={styles.secondaryButtonText}>Crea una sfida con codice</Text>
      </Pressable>

      <View style={styles.joinCard}>
        <Text style={styles.joinLabel}>Hai un codice?</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder="ES. AB12CD"
          placeholderTextColor={theme.textMuted}
          autoCapitalize="characters"
          maxLength={6}
        />
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            code.trim().length < 4 && styles.disabledButton,
            pressed && code.trim().length >= 4 && styles.secondaryButtonPressed,
          ]}
          disabled={code.trim().length < 4}
          onPress={() => navigation.navigate('OnlineLobby', { mode: 'join', code: code.trim() })}
        >
          <Text style={styles.secondaryButtonText}>Unisciti alla sfida</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.bg,
    padding: 24,
    paddingTop: 72,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.text,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: theme.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryButtonPressed: {
    backgroundColor: theme.primaryDark,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    borderColor: theme.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  joinCard: {
    marginTop: 24,
    backgroundColor: theme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 18,
    gap: 12,
  },
  joinLabel: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: theme.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  notConfiguredCard: {
    backgroundColor: theme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 20,
    marginBottom: 24,
  },
  notConfiguredTitle: {
    color: theme.warning,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
  },
  notConfiguredText: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  backButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.textMuted,
    fontWeight: '600',
  },
});
