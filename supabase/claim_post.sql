-- ============================================================
-- TimeMachine: 領取系統完整 SQL（在 Supabase SQL Editor 一次執行）
-- ============================================================

-- 1. 確保 reservations 表存在
CREATE TABLE IF NOT EXISTS public.reservations (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reserver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','taken','cancelled')),
  created_at  timestamptz DEFAULT now(),
  taken_at    timestamptz,
  UNIQUE(post_id, reserver_id)
);

-- 2. reservations RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reservations_select" ON public.reservations;
CREATE POLICY "reservations_select" ON public.reservations
  FOR SELECT USING (auth.uid() = reserver_id);

DROP POLICY IF EXISTS "reservations_insert" ON public.reservations;
CREATE POLICY "reservations_insert" ON public.reservations
  FOR INSERT WITH CHECK (auth.uid() = reserver_id);

DROP POLICY IF EXISTS "reservations_update" ON public.reservations;
CREATE POLICY "reservations_update" ON public.reservations
  FOR UPDATE USING (auth.uid() = reserver_id);

-- 3. 開放 posts UPDATE 給所有登入用戶（只允許改 status 和 quantity）
--    如果你先前有限制 poster_id 的 UPDATE policy，這裡覆蓋掉
DROP POLICY IF EXISTS "posts_update_claim" ON public.posts;
CREATE POLICY "posts_update_claim" ON public.posts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. 原子性領取函式（SECURITY DEFINER 繞過 RLS，防 race condition）
CREATE OR REPLACE FUNCTION public.claim_post(
  p_post_id   uuid,
  p_claimer_id uuid,
  p_quantity   int DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post    posts%ROWTYPE;
  v_new_qty int;
  v_status  text;
BEGIN
  -- 加鎖讀取，防止併發
  SELECT * INTO v_post
  FROM posts
  WHERE id = p_post_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'POST_NOT_FOUND');
  END IF;

  -- 不能領自己的
  IF v_post.poster_id = p_claimer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'CANNOT_CLAIM_OWN');
  END IF;

  -- 檢查狀態
  IF v_post.status NOT IN ('available', 'reserved') THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_AVAILABLE');
  END IF;

  -- 檢查數量
  IF v_post.quantity < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_QUANTITY');
  END IF;

  -- 計算新數量與狀態
  v_new_qty := v_post.quantity - p_quantity;
  IF v_new_qty <= 0 THEN
    v_status := 'taken';
    v_new_qty := 0;
  ELSE
    v_status := 'available';
  END IF;

  -- 更新 post
  UPDATE posts
  SET quantity = v_new_qty,
      status   = v_status
  WHERE id = p_post_id;

  -- 寫入領取紀錄
  INSERT INTO reservations (post_id, reserver_id, status, taken_at)
  VALUES (p_post_id, p_claimer_id, 'taken', now())
  ON CONFLICT (post_id, reserver_id)
  DO UPDATE SET status = 'taken', taken_at = now();

  RETURN jsonb_build_object(
    'success',     true,
    'new_quantity', v_new_qty,
    'new_status',   v_status
  );
END;
$$;
