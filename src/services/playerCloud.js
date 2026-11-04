import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
export const cloud = url && key ? createClient(url, key) : null;

export async function saveGameResult(gameId, score) {
  if (!cloud) return { saved: false, reason: 'Supabase no configurado' };
  const { data: { user }, error: authError } = await cloud.auth.getUser();
  if (authError || !user) return { saved: false, reason: 'Inicia sesion para guardar la partida' };
  const { data, error } = await cloud.rpc('record_ninjuku_game', {
    p_game_id: gameId,
    p_score: Math.max(0, Math.floor(Number(score) || 0))
  });
  if (error) throw error;
  window.dispatchEvent(new CustomEvent('ninjuku:progress-updated'));
  return { saved: true, progress: data?.[0] ?? null };
}

export async function loadProgress() {
  if (!cloud) return null;
  const { data: { user } } = await cloud.auth.getUser();
  if (!user) return null;
  const { data, error } = await cloud.from('player_progress')
    .select('games_played,total_score,best_score,coins')
    .eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return data ?? { games_played: 0, total_score: 0, best_score: 0, coins: 0 };
}
