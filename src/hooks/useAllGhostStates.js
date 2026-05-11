import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { mapPost } from '../lib/mapPost';

/**
 * 獵手/管理員專用：取得全網 pending ghost states
 * 對應 RPC: get_all_ghost_states (內部會驗證權限)
 */
export const useAllGhostStates = (enabled = false) => {
  const { user } = useAuth();
  const [ghosts, setGhosts] = useState([]);
  const channelRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!user || !supabase || !enabled) return;
    const { data: states, error } = await supabase.rpc('get_all_ghost_states');
    if (error || !states || states.length === 0) {
      setGhosts([]);
      return;
    }
    const postIds = states.map(s => s.post_id);
    const { data: rawPosts } = await supabase
      .from('posts')
      .select('*, profiles!poster_id(display_name)')
      .in('id', postIds);

    const stateById = Object.fromEntries(states.map(s => [s.post_id, s]));
    const merged = (rawPosts || []).map(raw => {
      const s = stateById[raw.id];
      if (!s) return null;
      return {
        ...mapPost(raw),
        isGhost: true, hunterView: true,
        settlementId: s.settlement_id,
        settlesAt: s.settles_at,
        claimedAt: s.claimed_at,
      };
    }).filter(Boolean);
    setGhosts(merged);
  }, [user, enabled]);

  useEffect(() => {
    if (!enabled) { setGhosts([]); return; }
    refresh();
    const channel = supabase
      .channel('all-ghost-states-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'claim_settlements' },
        () => refresh())
      .subscribe();
    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [enabled, refresh]);

  useEffect(() => {
    const t = setInterval(() => {
      setGhosts(prev => prev.filter(g => new Date(g.settlesAt).getTime() > Date.now()));
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  return ghosts;
};
