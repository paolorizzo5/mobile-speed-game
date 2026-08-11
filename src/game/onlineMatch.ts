import { supabase, ensureSession } from '../lib/supabase';
import { OnlineMatchParams } from '../navigation/types';

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase non configurato: aggiungi EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  }
  return supabase;
}

export interface RandomMatchOutcome {
  matched: boolean;
  match?: OnlineMatchParams;
}

export async function findRandomMatch(level: number): Promise<RandomMatchOutcome> {
  const client = requireClient();
  await ensureSession();
  const { data, error } = await client.rpc('try_match_random', { p_level: level });
  if (error) throw error;
  const row = data?.[0];
  if (!row) return { matched: false };
  return {
    matched: true,
    match: {
      matchId: row.match_id,
      seed: row.seed,
      level: row.level,
      opponentId: row.opponent_id,
      opponentName: row.opponent_name ?? 'Avversario',
    },
  };
}

export async function cancelRandomSearch(): Promise<void> {
  if (!supabase) return;
  await supabase.rpc('leave_matchmaking_queue');
}

export interface HostedMatch {
  matchId: string;
  code: string;
  seed: string;
  level: number;
}

export async function createMatchWithCode(level: number): Promise<HostedMatch> {
  const client = requireClient();
  await ensureSession();
  const { data, error } = await client.rpc('create_match_with_code', { p_level: level });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('Impossibile creare la sfida');
  return { matchId: row.match_id, code: row.code, seed: row.seed, level: row.level };
}

export async function cancelHostedMatch(matchId: string): Promise<void> {
  if (!supabase) return;
  await supabase.rpc('cancel_hosted_match', { p_match_id: matchId });
}

export async function joinMatchByCode(code: string): Promise<OnlineMatchParams> {
  const client = requireClient();
  await ensureSession();
  const { data, error } = await client.rpc('join_match_by_code', { p_code: code.trim().toUpperCase() });
  if (error) throw new Error(error.message);
  const row = data?.[0];
  if (!row) throw new Error('Codice non valido');
  return {
    matchId: row.match_id,
    seed: row.seed,
    level: row.level,
    opponentId: row.opponent_id,
    opponentName: row.opponent_name ?? 'Avversario',
  };
}

export async function submitMatchResult(
  matchId: string,
  round1: number,
  round2: number,
  round3: number,
  overall: number
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('submit_match_result', {
    p_match_id: matchId,
    p_round1: round1,
    p_round2: round2,
    p_round3: round3,
    p_overall: overall,
  });
  if (error) throw error;
}

export interface MatchPlayerRow {
  match_id: string;
  player_id: string;
  round1_score: number | null;
  round2_score: number | null;
  round3_score: number | null;
  overall_score: number | null;
  submitted_at: string | null;
}

export async function fetchMatchPlayers(matchId: string): Promise<MatchPlayerRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('match_players').select('*').eq('match_id', matchId);
  if (error) throw error;
  return (data as MatchPlayerRow[]) ?? [];
}

export function subscribeToMatchPlayers(matchId: string, onChange: (rows: MatchPlayerRow[]) => void) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`match_players:${matchId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'match_players', filter: `match_id=eq.${matchId}` },
      () => {
        fetchMatchPlayers(matchId).then(onChange);
      }
    )
    .subscribe();
  return () => {
    supabase?.removeChannel(channel);
  };
}

export interface MatchRow {
  id: string;
  status: 'waiting' | 'active' | 'finished';
  player1_id: string;
  player2_id: string | null;
  winner_id: string | null;
  seed: string;
  level: number;
}

export function subscribeToMatch(matchId: string, onChange: (row: MatchRow) => void) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`match:${matchId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
      (payload) => onChange(payload.new as MatchRow)
    )
    .subscribe();
  return () => {
    supabase?.removeChannel(channel);
  };
}

/** Fires when someone else pairs up with us via try_match_random (we become player1 on their match row). */
export function subscribeToIncomingMatch(myId: string, onMatch: (match: OnlineMatchParams) => void) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`incoming-match:${myId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'matches', filter: `player1_id=eq.${myId}` },
      async (payload) => {
        const row = payload.new as { id: string; seed: string; level: number; player2_id: string };
        const opponentName = await fetchUsername(row.player2_id);
        onMatch({
          matchId: row.id,
          seed: row.seed,
          level: row.level,
          opponentId: row.player2_id,
          opponentName,
        });
      }
    )
    .subscribe();
  return () => {
    supabase?.removeChannel(channel);
  };
}

export async function fetchUsername(userId: string): Promise<string> {
  if (!supabase) return 'Avversario';
  const { data } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle();
  return data?.username ?? 'Avversario';
}

export async function setUsername(username: string): Promise<void> {
  if (!supabase) return;
  await ensureSession();
  await supabase.rpc('set_username', { p_username: username });
}
