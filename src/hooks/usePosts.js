import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ── DB (snake_case) → 前端 (camelCase) ──────────────────────────────────────
const mapPost = (raw) => ({
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
});

// ── 前端 (camelCase) → DB (snake_case) for INSERT ───────────────────────────
const preparePost = (p, userId) => ({
  poster_id:     userId,
  title:         p.title,
  food_type:     p.foodType,
  tags:          p.tags ?? [],
  quantity:      p.quantity,
  description:   p.description ?? null,
  image_url:     p.imageUrl ?? null,
  latitude:      p.lat,
  longitude:     p.lng,
  location_name: p.locationName ?? null,
  expires_at:    p.expiresAt,
});

// ────────────────────────────────────────────────────────────────────────────

export const usePosts = (triggerToast) => {
  const { user } = useAuth();
  const [posts, setPosts]         = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // ── 初始載入 ────────────────────────────────────────────────────────────
    const fetchPosts = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .in('status', ['available', 'reserved'])
        .order('created_at', { ascending: false });

      if (error) {
        triggerToast('載入貼文失敗', 'error');
      } else {
        setPosts(data.map(mapPost));
      }
      setIsLoading(false);
    };

    fetchPosts();

    // ── Realtime 訂閱（其他使用者新增/更新時自動同步）──────────────────────
    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newPost = mapPost(payload.new);
            if (['available', 'reserved'].includes(newPost.status)) {
              setPosts(prev => [newPost, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapPost(payload.new);
            setPosts(prev => {
              // taken / expired → 從列表移除（原本 client-side 10 分鐘清理的替代方案）
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

    return () => supabase.removeChannel(channel);
  }, [user]);

  // ── 更新貼文狀態（預訂 / 領取）──────────────────────────────────────────
  const updatePostStatus = async (post, newStatus) => {
    setIsLoading(true);
    try {
      // 1. 更新 posts 表的狀態
      const { error: postError } = await supabase
        .from('posts')
        .update({ status: newStatus })
        .eq('id', post.id);

      if (postError) throw postError;

      // 2. 同步 reservations 交易記錄
      if (newStatus === 'reserved') {
        const { error: resError } = await supabase
          .from('reservations')
          .upsert({ post_id: post.id, reserver_id: user.id, status: 'reserved' });
        if (resError) throw resError;

      } else if (newStatus === 'taken') {
        const { error: resError } = await supabase
          .from('reservations')
          .update({ status: 'taken', taken_at: new Date().toISOString() })
          .eq('post_id', post.id)
          .eq('reserver_id', user.id);
        if (resError) throw resError;
      }

      return true;
    } catch (error) {
      console.error('updatePostStatus error:', error);
      triggerToast('更新失敗，請重試', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ── 發布新貼文 ───────────────────────────────────────────────────────────
  const addPost = async (newPost) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .insert(preparePost(newPost, user.id));

      if (error) throw error;
      // 不需手動 setPosts：Realtime INSERT 事件會自動同步
      return true;
    } catch (error) {
      console.error('addPost error:', error);
      triggerToast('發布失敗，請重試', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { posts, isLoading, updatePostStatus, addPost };
};
