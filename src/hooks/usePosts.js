import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { mapPost } from '../lib/mapPost';

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
    if (!user || !supabase) {
      setIsFetching(false);
      return;
    }
    if (!silent) setIsFetching(true);

    const queryPosts = async () => supabase
      .from('posts')
      .select('*')
      .in('status', ['available', 'reserved'])
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    try {
      // 取得我的封鎖名單 + shadowbanned 用戶 (前端兜底 filter)
      const [{ data: blocks }, { data: shadowbanned }] = await Promise.all([
        supabase.from('user_blocks').select('blocked_id').eq('blocker_id', user.id),
        supabase.from('profiles').select('id').eq('is_shadowbanned', true),
      ]);
      const hiddenPosterIds = new Set([
        ...(blocks ?? []).map(b => b.blocked_id),
        ...(shadowbanned ?? []).map(p => p.id),
      ]);

      let { data: postsData, error: postsErr } = await queryPosts();

      // 401 / JWT 過期 → refresh token 後重打一次；若仍失敗強制登出
      if (postsErr && (postsErr.code === 'PGRST301' || /jwt|401|expired|api ?key/i.test(postsErr.message || ''))) {
        console.warn('[usePosts] auth error, refreshing:', postsErr.message);
        const { error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshErr) {
          console.error('[usePosts] refresh failed → sign out:', refreshErr.message);
          await supabase.auth.signOut();
          return;
        }
        ({ data: postsData, error: postsErr } = await queryPosts());
      }

      if (postsErr) throw postsErr;
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // ── 第 2 段：批量取 poster display_name（in-list 查詢，比 JOIN 快）──
      const posterIds = [...new Set(postsData.map(p => p.poster_id).filter(Boolean))];
      let profileMap = {};
      if (posterIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', posterIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map(p => [p.id, p.display_name]));
        }
      }

      // ── 客戶端 join → mapPost 結構保持相容 ──
      const merged = postsData.map(p => ({
        ...p,
        profiles: { display_name: profileMap[p.poster_id] ?? '匿名食光人' },
      }));
      // 套用封鎖 / shadowban filter (admin 不過濾，看全部)
      const finalPosts = merged
        .map(mapPost)
        .filter(p => !hiddenPosterIds.has(p.posterId));
      setPosts(finalPosts);
    } catch (err) {
      console.error('[usePosts] fetch failed:', err?.message || err);
      if (!silent && triggerToast) triggerToast('載入失敗，請檢查網路', 'error');
    } finally {
      setIsFetching(false);
    }
  }, [user, triggerToast]);

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
            const notExpired = !newPost.expiresAt || newPost.expiresAt > new Date().toISOString();
            if (['available', 'reserved'].includes(newPost.status) && notExpired) {
              // 避免與 optimistic insert 重複
              setPosts(prev => {
                if (prev.some(p => p.id === newPost.id)) return prev;
                return [newPost, ...prev];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            // Realtime payload 不含 JOIN data，需與現有 post 合併
            const raw = payload.new;
            setPosts(prev => {
              if (['taken', 'expired'].includes(raw.status)) {
                return prev.filter(p => p.id !== raw.id);
              }
              return prev.map(p => {
                if (p.id !== raw.id) return p;
                // 保留現有 provider/profile，僅更新 DB 變動欄位
                const merged = { ...raw, profiles: { display_name: p.provider } };
                return mapPost(merged);
              });
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

  // ── 定時清理：移除在瀏覽期間過期的 post（每 30 秒）─────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().toISOString();
      setPosts(prev => {
        const filtered = prev.filter(p => !p.expiresAt || p.expiresAt > now);
        return filtered.length === prev.length ? prev : filtered; // 無變動不觸發 re-render
      });
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

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

  // ── 領取惜食 v2（Geofence + Photo + 15min Escrow）─────────────────
  // proof: { url, lat, lng } — 由 PostDetailModal 透過 ClaimProofCamera + uploadClaimProof 提供
  const claimPost = useCallback(async (post, claimQty = 1, proof = null) => {
    if (!supabase || !user) return false;
    if (!proof?.url || proof.lat == null || proof.lng == null) {
      triggerToast?.('領取需附證明照片與定位', 'error');
      return false;
    }
    setIsMutating(true);

    const currentQty = parseInt(post.quantity) || 1;
    const newQty = Math.max(0, currentQty - claimQty);
    const willBeGone = newQty <= 0;

    // 1. Optimistic UI
    let snapshot = null;
    setPosts(prev => {
      snapshot = prev;
      if (willBeGone) return prev.filter(p => p.id !== post.id);
      return prev.map(p =>
        p.id === post.id ? { ...p, quantity: newQty } : p
      );
    });

    try {
      // 2. 呼叫 v2 RPC（含 geofence + photo + escrow 一條龍）
      const { data, error } = await supabase.rpc('claim_post_v2', {
        p_post_id:     post.id,
        p_qty:         claimQty,
        p_proof_url:   proof.url,
        p_claimer_lat: proof.lat,
        p_claimer_lng: proof.lng,
      });
      if (error) throw error;

      if (!data?.success) {
        const errMap = {
          CANNOT_CLAIM_OWN:      '不能領取自己發布的食物',
          NOT_AVAILABLE:         '此惜食已被領取或已截止',
          INSUFFICIENT_QUANTITY: '數量不足，已被其他人領取',
          POST_NOT_FOUND:        '找不到此惜食',
          POST_EXPIRED:          '此惜食已過期',
          OUT_OF_RANGE:          `距離過遠（${Math.round(data?.distance_m || 0)}m），需在 50m 內`,
          PROOF_REQUIRED:        '需提供存證照片',
          INVALID_QTY:           '數量錯誤',
        };
        throw new Error(errMap[data?.error] ?? '領取失敗');
      }

      // 3. 用 DB 回傳的真實值校正 UI（防止 optimistic 與 DB 不一致）
      const dbQty = data.new_quantity;
      const dbStatus = data.new_status;
      setPosts(prev => {
        if (dbStatus === 'taken') return prev.filter(p => p.id !== post.id);
        return prev.map(p =>
          p.id === post.id ? { ...p, quantity: dbQty, status: dbStatus } : p
        );
      });

      // 4. claim_post_v2 已 atomic 處理：DELETE intent_heatmap + 退還 token + 寫 settlement
      //    Realtime 會自動同步 useTokens / useSettlements，不需前端再操作
      return { success: true, settlementId: data.settlement_id, settlesAt: data.settles_at };
    } catch (error) {
      console.error('claimPost error:', error);
      if (snapshot) setPosts(snapshot);
      triggerToast(error.message || '領取失敗，請重試', 'error');
      return false;
    } finally {
      setIsMutating(false);
    }
  }, [user, triggerToast]);

  // ── 預訂（僅改狀態，不動數量）──────────────────────────────────────
  const reservePost = useCallback(async (post) => {
    if (!supabase || !user) return false;
    setIsMutating(true);

    let snapshot = null;
    setPosts(prev => {
      snapshot = prev;
      return prev.map(p =>
        p.id === post.id ? { ...p, status: 'reserved' } : p
      );
    });

    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: 'reserved' })
        .eq('id', post.id);
      if (error) throw error;

      return true;
    } catch (error) {
      console.error('reservePost error:', error);
      if (snapshot) setPosts(snapshot);
      triggerToast('預訂失敗，請重試', 'error');
      return false;
    } finally {
      setIsMutating(false);
    }
  }, [user, triggerToast]);

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

  return { posts, isLoading: isFetching, isFetching, isMutating, claimPost, reservePost, addPost };
};
