import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LOCATIONS } from '../data/constants';

// ── DB → 前端（含向後相容欄位）────────────────────────────────────────────
const mapPost = (raw) => {
  const locName = raw.location_name ?? '';
  const mainLocName = locName.split(' · ')[0];
  const matchedLoc = LOCATIONS.find(l => l.name === mainLocName);
  const posterName = raw.profiles?.display_name ?? '匿名食光人';

  return {
    id:           raw.id,
    posterId:     raw.poster_id,
    title:        raw.title,
    foodType:     raw.food_type,
    tags:         raw.tags ?? [],
    quantity:     raw.quantity,
    description:  raw.description,
    imageUrl:     raw.image_url,
    lat:          parseFloat(raw.latitude),
    lng:          parseFloat(raw.longitude),
    locationName: raw.location_name,
    status:       raw.status,
    expiresAt:    raw.expires_at,
    createdAt:    raw.created_at,
    // 向後相容
    locationId:     matchedLoc?.id ?? null,
    locationDetail: locName.includes(' · ') ? locName.split(' · ')[1] : raw.description,
    provider:       posterName,
    pickupTime:     raw.created_at,
    expireTime:     raw.expires_at,
    unit:           '份',
    imageColor:     'bg-emerald-100',
  };
};

const preparePost = (p, userId) => ({
  poster_id:     userId,
  title:         p.title ?? '未命名食物',
  food_type:     p.foodType ?? '其他',
  tags:          p.tags ?? [],
  quantity:      parseInt(p.quantity) || 1,
  description:   p.description ?? null,
  image_url:     p.imageUrl ?? null,
  latitude:      parseFloat(p.lat)  || 25.0174,
  longitude:     parseFloat(p.lng)  || 121.5392,
  location_name: p.locationName ?? null,
  expires_at:    p.expiresAt ?? new Date(Date.now() + 2 * 3600000).toISOString(),
});

// ────────────────────────────────────────────────────────────────────────────

export const usePosts = (triggerToast) => {
  const { user } = useAuth();
  const [posts, setPosts]           = useState([]);
  const [isFetching, setIsFetching] = useState(true);   // 首次載入
  const [isMutating, setIsMutating] = useState(false);   // 操作中（按鈕用）
  const channelRef = useRef(null);

  // ── 載入函式（可靜默呼叫，不觸發全屏 spinner）──────────────────────────
  const fetchPosts = useCallback(async (silent = false) => {
    if (!user || !supabase) return;
    if (!silent) setIsFetching(true);

    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles!poster_id(display_name)')
      .in('status', ['available', 'reserved'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data.map(mapPost));
    }
    setIsFetching(false);
  }, [user]);

  // ── 初始載入 + Realtime 訂閱 ──────────────────────────────────────────
  useEffect(() => {
    if (!user || !supabase) return;

    fetchPosts();

    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPost = mapPost(payload.new);
            if (['available', 'reserved'].includes(newPost.status)) {
              // 避免與 optimistic insert 重複
              setPosts(prev => {
                if (prev.some(p => p.id === newPost.id)) return prev;
                return [newPost, ...prev];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapPost(payload.new);
            setPosts(prev => {
              if (['taken', 'expired'].includes(updated.status)) {
                return prev.filter(p => p.id !== updated.id);
              }
              return prev.map(p => p.id === updated.id ? updated : p);
            });
          } else if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [user, fetchPosts]);

  // ── 頁面可見時靜默 refetch（解決閒置後資料過期問題）──────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchPosts(true); // silent = true，不顯示 spinner
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchPosts]);

  // ── Optimistic 更新狀態 ──────────────────────────────────────────────
  const updatePostStatus = useCallback(async (post, newStatus) => {
    if (!supabase) return false;
    setIsMutating(true);

    // 1. Optimistic UI：立即更新列表
    const snapshot = posts; // 保存快照用於回滾
    setPosts(prev => {
      if (['taken', 'expired'].includes(newStatus)) {
        return prev.filter(p => p.id !== post.id);
      }
      return prev.map(p => p.id === post.id ? { ...p, status: newStatus } : p);
    });

    try {
      const { error: postError } = await supabase
        .from('posts')
        .update({ status: newStatus })
        .eq('id', post.id);
      if (postError) throw postError;

      if (newStatus === 'reserved') {
        await supabase.from('reservations')
          .upsert({ post_id: post.id, reserver_id: user.id, status: 'reserved' });
      } else if (newStatus === 'taken') {
        await supabase.from('reservations')
          .update({ status: 'taken', taken_at: new Date().toISOString() })
          .eq('post_id', post.id)
          .eq('reserver_id', user.id);
      }

      return true;
    } catch (error) {
      console.error('updatePostStatus error:', error);
      setPosts(snapshot); // 回滾
      triggerToast('更新失敗，請重試', 'error');
      return false;
    } finally {
      setIsMutating(false);
    }
  }, [posts, user]);

  // ── Optimistic 新增貼文 ──────────────────────────────────────────────
  const addPost = useCallback(async (newPost) => {
    if (!supabase) return false;
    setIsMutating(true);

    // 1. 建立臨時 post（帶臨時 ID）
    const tempId = `temp-${Date.now()}`;
    const optimisticPost = {
      ...newPost,
      id: tempId,
      status: 'available',
      createdAt: new Date().toISOString(),
      provider: user?.email?.split('@')[0] ?? '我',
      pickupTime: new Date().toISOString(),
      expireTime: newPost.expiresAt,
      unit: '份',
      imageColor: 'bg-emerald-100',
      tags: newPost.tags ?? [],
    };
    setPosts(prev => [optimisticPost, ...prev]);

    try {
      const { error } = await supabase
        .from('posts')
        .insert(preparePost(newPost, user.id));
      if (error) throw error;
      // Realtime INSERT 會替換臨時 post（mapPost 會帶真實 ID）
      // 但如果 Realtime 延遲，臨時 post 會在下次 refetch 時被替換
      return true;
    } catch (error) {
      console.error('addPost error:', error);
      setPosts(prev => prev.filter(p => p.id !== tempId)); // 回滾
      triggerToast('發布失敗，請重試', 'error');
      return false;
    } finally {
      setIsMutating(false);
    }
  }, [user]);

  // 向後相容：isLoading 仍然可用（映射到 isFetching）
  return { posts, isLoading: isFetching, isFetching, isMutating, updatePostStatus, addPost };
};
