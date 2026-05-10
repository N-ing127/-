import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * 取得「我作為 claimer」的所有 settlements。
 * 每 10 秒自然 tick 一次計算 isOverdue（settles_at < now()）。
 * Realtime 訂閱新 INSERT / UPDATE。
 *
 * 回傳 settlements 陣列，含 isOverdue 計算欄位。
 */
export const useSettlements = () => {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState([]);
  const [tick, setTick] = useState(0);  // 觸發 isOverdue 重算
  const channelRef = useRef(null);

  // 初始 fetch + realtime
  useEffect(() => {
    if (!user || !supabase) return;
    let cancelled = false;

    const fetchAll = async () => {
      const { data } = await supabase
        .from('claim_settlements')
        .select('*')
        .eq('claimer_id', user.id)
        .in('status', ['pending', 'settled', 'voided'])
        .order('claimed_at', { ascending: false })
        .limit(50);
      if (!cancelled && data) setSettlements(data);
    };
    fetchAll();

    const channel = supabase
      .channel(`settle-${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'claim_settlements', filter: `claimer_id=eq.${user.id}` },
        () => fetchAll())
      .subscribe();
    channelRef.current = channel;

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

  // 每 10s tick 一次重算 isOverdue
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  // 計算欄位
  const enriched = settlements.map(s => {
    const settlesAt = new Date(s.settles_at);
    const now = Date.now();
    const remainingMs = settlesAt.getTime() - now;
    return {
      ...s,
      remainingMs,
      isOverdue:    remainingMs <= 0,                                // 15min 已過
      isInWindow:   s.status === 'pending' && remainingMs > 0,       // 仍在 escrow
      isSettled:    s.status === 'settled' || (s.status === 'pending' && remainingMs <= 0),
    };
  });

  return enriched;
};
