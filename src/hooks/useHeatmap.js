import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * 訂閱所有 posts 的「前往中人數」(heatmap count)
 * 回傳 { [postId]: count } 物件
 * 用 Realtime 訂閱 intent_heatmap 表 INSERT/DELETE 即時更新
 */
export const useHeatmap = (postIds = []) => {
  const [counts, setCounts] = useState({});
  const channelRef = useRef(null);

  // 初次 / postIds 變動時重抓
  useEffect(() => {
    if (!supabase || postIds.length === 0) {
      setCounts({});
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('intent_heatmap')
        .select('post_id')
        .in('post_id', postIds);
      if (cancelled || !data) return;
      const next = {};
      for (const row of data) next[row.post_id] = (next[row.post_id] || 0) + 1;
      setCounts(next);
    })();
    return () => { cancelled = true; };
  }, [postIds.join(',')]); // 字串化避免 array 參考變動觸發

  // Realtime 訂閱
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('heatmap-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'intent_heatmap' },
        (payload) => {
          const pid = payload.new?.post_id ?? payload.old?.post_id;
          if (!pid) return;
          setCounts(prev => {
            const delta = payload.eventType === 'INSERT' ? 1 : payload.eventType === 'DELETE' ? -1 : 0;
            if (delta === 0) return prev;
            return { ...prev, [pid]: Math.max(0, (prev[pid] || 0) + delta) };
          });
        })
      .subscribe();
    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, []);

  return counts;
};
