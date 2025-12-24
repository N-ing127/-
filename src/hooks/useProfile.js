import { useState, useEffect } from 'react';
import { INITIAL_PROFILE, ACHIEVEMENTS_DATA } from '../data/constants';

export const useProfile = (triggerToast) => {
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('time-machine-profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_PROFILE,
          ...parsed,
          settings: {
            ...INITIAL_PROFILE.settings,
            ...(parsed.settings || {})
          }
        };
      }
    } catch (e) {
      console.error("Profile 資料解析失敗:", e);
    }
    return INITIAL_PROFILE;
  });

  useEffect(() => {
    localStorage.setItem('time-machine-profile', JSON.stringify(profile));
  }, [profile]);

  /**
   * 核心邏輯：更新數據並檢查是否有新成就解鎖
   * @param {Function} updateFn - 更新 stats 的函數
   * @returns {Object|null} - 如果有新解鎖的成就，回傳該成就物件，否則回傳 null
   */
  const updateStatsAndCheckAchievements = (updateFn) => {
    let newlyUnlocked = null;

    setProfile(prev => {
      const newStats = updateFn(prev.stats);
      const currentUnlocked = prev.unlockedAchievements || [];
      
      // 找出符合條件但尚未解鎖的成就
      // 邏輯範例：savedCount 達到 5 (見習生), 10 (大師)
      const possibleNewAch = ACHIEVEMENTS_DATA.find(ach => {
        if (currentUnlocked.includes(ach.id)) return false;
        
        // 簡單門檻判斷 (可根據 constants.js 的 rule 擴充)
        if (ach.id === 'food_saver_1' && newStats.savedCount >= 5) return true;
        if (ach.id === 'food_saver_2' && newStats.savedCount >= 10) return true;
        if (ach.id === 'night_owl' && newStats.nightOwlActions >= 1) return true;
        
        return false;
      });

      if (possibleNewAch) {
        newlyUnlocked = possibleNewAch;
        return {
          ...prev,
          stats: newStats,
          unlockedAchievements: [...currentUnlocked, possibleNewAch.id]
        };
      }

      return { ...prev, stats: newStats };
    });

    return newlyUnlocked;
  };

  return { profile, setProfile, updateStats: updateStatsAndCheckAchievements };
};