import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ACHIEVEMENTS_DATA } from '../data/constants';

// ── DB (snake_case) → 前端 (camelCase) ──────────────────────────────────────
const mapProfile = (raw) => ({
  id:          raw.id,
  displayName: raw.display_name,
  avatarUrl:   raw.avatar_url,
  ntuEmail:    raw.ntu_email,
  stats: {
    exp:              raw.exp,
    savedCount:       raw.saved_count,
    savedWeight:      parseFloat(raw.saved_weight),
    nightOwlActions:  raw.night_owl_actions,
  },
  unlockedAchievements: raw.unlocked_achievements ?? [],
  settings: {
    showNearbyAlert:      raw.show_nearby_alert,
    notificationRadius:   raw.notification_radius,
  },
});

// ────────────────────────────────────────────────────────────────────────────

export const useProfile = (triggerToast) => {
  const { user } = useAuth();
  const [profile, setProfileState] = useState(null);

  // ── 登入後載入 profile ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !supabase) { setProfileState(null); return; }

    const fetchProfile = async () => {
      // 使用 maybeSingle() 而非 single()，避免 0 行時回傳 406
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfileState(mapProfile(data));
      } else {
        // profile 尚未建立（RLS 或時序問題），嘗試自動建立
        const { data: newProfile, error: insertErr } = await supabase
          .from('profiles')
          .insert({
            id:           user.id,
            display_name: user.email?.split('@')[0] ?? '食光人',
            ntu_email:    user.email,
          })
          .select()
          .maybeSingle();

        if (newProfile) {
          setProfileState(mapProfile(newProfile));
        } else {
          // Foreign key 失敗 = auth session 過期/用戶已刪除，強制登出
          console.error('Profile fetch/create failed:', error, insertErr);
          await supabase.auth.signOut();
        }
      }
    };

    fetchProfile();
  }, [user]);

  /**
   * 核心邏輯（async 版）：更新遊戲化數據並檢查成就解鎖
   * @param {Function} updateFn - 接收 stats，回傳新 stats 的函數
   * @returns {Object|null} 新解鎖的成就物件，或 null
   */
  const updateStats = useCallback(async (updateFn) => {
    if (!user || !profile) return null;

    const newStats       = updateFn(profile.stats);
    const currentUnlocked = profile.unlockedAchievements;

    // 成就門檻檢查（與原版邏輯完全一致）
    const possibleNewAch = ACHIEVEMENTS_DATA.find(ach => {
      if (currentUnlocked.includes(ach.id)) return false;
      if (ach.id === 'food_saver_1' && newStats.savedCount >= 5)      return true;
      if (ach.id === 'food_saver_2' && newStats.savedCount >= 10)     return true;
      if (ach.id === 'night_owl'    && newStats.nightOwlActions >= 1) return true;
      return false;
    });

    const newUnlocked = possibleNewAch
      ? [...currentUnlocked, possibleNewAch.id]
      : currentUnlocked;

    // 寫入 Supabase
    const { error } = await supabase
      .from('profiles')
      .update({
        exp:                    newStats.exp,
        saved_count:            newStats.savedCount,
        saved_weight:           newStats.savedWeight,
        night_owl_actions:      newStats.nightOwlActions,
        unlocked_achievements:  newUnlocked,
      })
      .eq('id', user.id);

    if (error) {
      console.error('updateStats error:', error);
      triggerToast('數據更新失敗', 'error');
      return null;
    }

    // Optimistic UI update
    setProfileState(prev => ({
      ...prev,
      stats: newStats,
      unlockedAchievements: newUnlocked,
    }));

    return possibleNewAch ?? null;
  }, [user, profile]);

  /**
   * 更新設定或個人資料（displayName、settings 等）
   * 採用 Optimistic Update：先更新 UI，再非同步寫入 DB
   */
  const setProfile = useCallback(async (updater) => {
    if (!user) return;
    const updated = typeof updater === 'function' ? updater(profile) : updater;
    setProfileState(updated); // 立即更新 UI

    await supabase.from('profiles').update({
      display_name:         updated.displayName,
      show_nearby_alert:    updated.settings?.showNearbyAlert,
      notification_radius:  updated.settings?.notificationRadius,
    }).eq('id', user.id);
  }, [user, profile]);

  return { profile, setProfile, updateStats };
};
