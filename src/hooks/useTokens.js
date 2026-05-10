import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * 食光代幣 hook：
 *   - 即時讀 profiles.tokens_available + intent_heatmap (我的質押清單)
 *   - 提供 stakeToken(postId) → atomic RPC
 *   - 訂閱 realtime 更新 (heatmap 變動 / 自己 token 變動)
 */
export const useTokens = (triggerToast) => {
  const { user } = useAuth();
  const [tokens, setTokens] = useState(2);              // 預設值，避免閃爍
  const [stakedPostIds, setStakedPostIds] = useState(new Set());
  const [revealedCoords, setRevealedCoords] = useState({}); // { postId: {lat, lng} } — 質押後揭露的精確座標
  const [isStaking, setIsStaking] = useState(false);
  const channelRef = useRef(null);

  // 初始載入
  const refresh = useCallback(async () => {
    if (!user || !supabase) return;
    const [{ data: profile }, { data: stakes }] = await Promise.all([
      supabase.from('profiles').select('tokens_available').eq('id', user.id).maybeSingle(),
      supabase.from('intent_heatmap').select('post_id').eq('user_id', user.id),
    ]);
    if (profile) setTokens(profile.tokens_available ?? 0);
    if (stakes) setStakedPostIds(new Set(stakes.map(s => s.post_id)));
  }, [user]);

  useEffect(() => {
    if (!user || !supabase) return;
    refresh();

    // Realtime: 自己 profile token 變化 + 自己 stake 變化
    const channel = supabase
      .channel(`tokens-${user.id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (p) => setTokens(p.new.tokens_available ?? 0))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'intent_heatmap', filter: `user_id=eq.${user.id}` },
        () => refresh())
      .subscribe();
    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [user, refresh]);

  // 質押 1 代幣
  const stakeToken = useCallback(async (postId) => {
    if (!supabase || !user) return null;
    if (tokens <= 0) {
      triggerToast?.('代幣不足，最多同時質押 2 份', 'error');
      return null;
    }
    if (stakedPostIds.has(postId)) {
      triggerToast?.('已質押過此份食光', 'error');
      return null;
    }
    setIsStaking(true);
    try {
      const { data, error } = await supabase.rpc('stake_token', { p_post_id: postId });
      if (error) throw error;
      if (!data?.success) {
        const errMap = {
          NO_TOKENS:           '代幣不足，最多同時質押 2 份',
          MAX_STAKES_REACHED:  '已達同時質押上限 (2 份)',
          ALREADY_STAKED:      '已質押過此份食光',
          CANNOT_STAKE_OWN:    '不能質押自己發布的食光',
          POST_NOT_AVAILABLE:  '此份食光已被領取',
          POST_EXPIRED:        '此份食光已截止',
          POST_NOT_FOUND:      '找不到此份食光',
        };
        triggerToast?.(errMap[data?.error] ?? '質押失敗', 'error');
        return null;
      }
      // Optimistic update (realtime 也會跟上)
      setTokens(data.tokens_remaining);
      setStakedPostIds(prev => new Set(prev).add(postId));
      setRevealedCoords(prev => ({
        ...prev,
        [postId]: { lat: parseFloat(data.precise_lat), lng: parseFloat(data.precise_lng) }
      }));
      triggerToast?.('已質押 1 代幣，精確位置已揭露', 'success');
      return data;
    } catch (err) {
      console.error('[useTokens] stake error:', err);
      triggerToast?.('質押失敗，請重試', 'error');
      return null;
    } finally {
      setIsStaking(false);
    }
  }, [user, tokens, stakedPostIds, triggerToast]);

  return {
    tokens,
    stakedPostIds,           // Set<postId>
    revealedCoords,          // { postId: {lat, lng} }
    isStaking,
    stakeToken,
    refresh,
  };
};
