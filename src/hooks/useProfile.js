import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ACHIEVEMENTS_DATA } from '../data/constants';

// ── DB → 前端（含向後相容欄位，讓 ProfileView 不需改動）────────────────────
const mapProfile = (raw) => {
  const level = raw.level ?? Math.floor(raw.exp / 200) + 1;
  return {
    id:          raw.id,
    displayName: raw.display_name,
    avatarUrl:   raw.avatar_url,
    ntuEmail:    raw.ntu_email,
    department:  raw.department ?? '未設定系級',
    bannerUrl:   raw.banner_url,
    stats: {
      exp:              raw.exp,
      level:            level,
      nextLevelExp:     level * 200,
      savedCount:       raw.saved_count,
      savedWeight:      parseFloat(raw.saved_weight),
      nightOwlActions:  raw.night_owl_actions,
    },
    unlockedAchievements: raw.unlocked_achievements ?? [],
    settings: {
      showNearbyAlert:    raw.show_nearby_alert,
      notificationRadius: raw.notification_radius,
    },

    // ── 向後相容欄位（ProfileView 使用）──
    name:       raw.display_name,
    avatar:     raw.avatar_url,
    banner:     raw.banner_url,
  };
};

// ────────────────────────────────────────────────────────────────────────────

export const useProfile = (triggerToast) => {
  const { user } = useAuth();
  const [profile, setProfileState] = useState(null);

  useEffect(() => {
    if (!user || !supabase) { setProfileState(null); return; }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfileState(mapProfile(data));
      } else {
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
          console.error('Profile fetch/create failed:', error, insertErr);
          await supabase.auth.signOut();
        }
      }
    };

    fetchProfile();
  }, [user]);

  const updateStats = useCallback(async (updateFn) => {
    if (!user || !profile) return null;

    const newStats        = updateFn(profile.stats);
    const currentUnlocked = profile.unlockedAchievements;

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

    setProfileState(prev => ({
      ...prev,
      stats: { ...newStats, level: Math.floor(newStats.exp / 200) + 1, nextLevelExp: (Math.floor(newStats.exp / 200) + 1) * 200 },
      unlockedAchievements: newUnlocked,
    }));

    return possibleNewAch ?? null;
  }, [user, profile]);

  /**
   * 更新個人資料（name, department, avatar, banner, settings）
   * ProfileView 傳入的 updater 使用舊欄位名（name, avatar, banner）
   * 這裡轉換成 Supabase 欄位寫入
   */
  const setProfile = useCallback(async (updater) => {
    if (!user || !supabase) return;
    const updated = typeof updater === 'function' ? updater(profile) : updater;

    // Optimistic UI（同時維護新舊欄位名）
    const merged = {
      ...updated,
      displayName: updated.name ?? updated.displayName,
      avatarUrl:   updated.avatar ?? updated.avatarUrl,
      bannerUrl:   updated.banner ?? updated.bannerUrl,
      name:        updated.name ?? updated.displayName,
      avatar:      updated.avatar ?? updated.avatarUrl,
      banner:      updated.banner ?? updated.bannerUrl,
    };
    setProfileState(merged);

    // 寫入 Supabase
    await supabase.from('profiles').update({
      display_name:         merged.displayName,
      department:           merged.department ?? null,
      avatar_url:           merged.avatarUrl,
      banner_url:           merged.bannerUrl,
      show_nearby_alert:    merged.settings?.showNearbyAlert,
      notification_radius:  merged.settings?.notificationRadius,
    }).eq('id', user.id);
  }, [user, profile]);

  return { profile, setProfile, updateStats };
};
