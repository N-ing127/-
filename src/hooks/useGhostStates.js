import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { mapPost } from '../lib/mapPost';

/**
 * 訂閱「我 stake 過的 post 中，目前進入 pending settlement (其他 A 領取)」的狀態。
 *
 * 回傳：[{ ...post (mapPost), isGhost: true, settlesAt, settlementId, claimedAt }]
 *
 * 設計：
 *   1. 呼叫 get_my_ghost_states RPC → 取得 ghost post_ids + settles_at
 *   2. 再用 in('id', ids) 抓 posts (含 status='taken')
 *   3. 訂閱 claim_settlements realtime → 任何變動就 refetch
 */
export const useGhostStates = () => {
  const { user } = useAuth();
  const [ghosts, setGhosts] = useState([]);  // 已 enriched 的 ghost posts
  const channelRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!user || !supabase) return;
    const { data: states, error } = await supabase.rpc('get_my_ghost_states');
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
        isGhost:       true,
        settlementId:  s.settlement_id,
        settlesAt:     s.settles_at,
        claimedAt:     s.claimed_at,
      };
    }).filter(Boolean);
    setGhosts(merged);
  }, [user]);

  useEffect(() => {
    if (!user || !supabase) return;
    refresh();

    // Realtime：任何 claim_settlements 變動 → refetch (cheap，<100 rows)
    const channel = supabase
      .channel('ghost-states-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'claim_settlements' },
        () => refresh())
      .subscribe();
    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [user, refresh]);

  // 每分鐘 tick 一次，自動踢掉 settles_at 已過期的 ghost
  useEffect(() => {
    const t = setInterval(() => {
      setGhosts(prev => prev.filter(g => new Date(g.settlesAt).getTime() > Date.now()));
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  return ghosts;
};
