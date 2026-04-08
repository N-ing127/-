import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LOCATIONS } from '../data/constants';

// ── DB → 前端（含向後相容欄位，讓 PostCard / PostDetailModal 不需改動）─────
const mapPost = (raw) => {
  // 從 location_name 反查 locationId（若找不到就 null）
  const locName = raw.location_name ?? '';
  const mainLocName = locName.split(' · ')[0];
  const matchedLoc = LOCATIONS.find(l => l.name === mainLocName);

  // 發布者名稱：來自 join 的 profiles 或 fallback
  const posterName = raw.profiles?.display_name ?? '匿名食光人';

  return {
    // ── 新欄位（Supabase 原生）──
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

    // ── 向後相容欄位（PostCard / PostDetailModal 使用）──
    locationId:     matchedLoc?.id ?? null,
    locationDetail: locName.includes(' · ') ? locName.split(' · ')[1] : raw.description,
    provider:       posterName,
    pickupTime:     raw.created_at,       // 用建立時間當作開始領取時間
    expireTime:     raw.expires_at,       // PostCard 用 expireTime
    unit:           '份',
    imageColor:     'bg-emerald-100',
  };
};

// ── 前端 → DB for INSERT ────────────────────────────────────────────────────
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
  const [posts, setPosts]         = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) return;

    const fetchPosts = async () => {
      setIsLoading(true);
      // JOIN profiles 表取得發布者名稱
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles!poster_id(display_name)')
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

    // Realtime（不含 join，用 fallback 名稱）
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

  const updatePostStatus = async (post, newStatus) => {
    if (!supabase) return false;
    setIsLoading(true);
    try {
      const { error: postError } = await supabase
        .from('posts')
        .update({ status: newStatus })
        .eq('id', post.id);
      if (postError) throw postError;

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

  const addPost = async (newPost) => {
    if (!supabase) return false;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .insert(preparePost(newPost, user.id));
      if (error) throw error;
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
