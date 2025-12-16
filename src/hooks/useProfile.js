import { useState, useEffect, useCallback } from 'react';
import { ACHIEVEMENTS_DATA } from '../data/constants';

export const useProfile = (triggerToast) => {
  const STORAGE_KEY = 'time_machine_user_v3';
  
  // 模擬 DB: UserStats
  const defaultProfile = {
    name: '李同學',
    campus: '台大校區',
    department: '資訊工程學系',
    avatar: null,
    banner: null,
    stats: { 
      level: 3, exp: 450, nextLevelExp: 1000, 
      savedCount: 4, savedWeight: 5.2, postedCount: 0, nightOwlActions: 0 
    },
    unlockedAchievements: [] // 模擬 DB: UserAchievements (只存 ID)
  };

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : defaultProfile;
    } catch (e) {
      return defaultProfile;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  // ==========================================
  // 核心: 規則評估引擎 (Rule Engine)
  // ==========================================
  const evaluateRule = (stats, rule) => {
    if (!rule) return false;
    
    // 從 stats 中取出對應的數據 (e.g., stats['savedCount'])
    const currentValue = stats[rule.statKey] || 0;
    
    switch (rule.operator) {
      case '>=': return currentValue >= rule.targetValue;
      case '>': return currentValue > rule.targetValue;
      case '=': return currentValue === rule.targetValue;
      case '<': return currentValue < rule.targetValue;
      default: return false;
    }
  };

  const updateStats = useCallback((updateFn) => {
    setProfile(prev => {
      // 1. 更新 UserStats
      const newStats = updateFn(prev.stats);
      
      // 2. 檢查 AchievementDefinitions
      const newUnlocks = ACHIEVEMENTS_DATA.filter(ach => {
        // 過濾掉已解鎖的 (UserAchievements check)
        const isAlreadyUnlocked = prev.unlockedAchievements.includes(ach.id);
        if (isAlreadyUnlocked) return false;

        // 執行規則檢查
        return evaluateRule(newStats, ach.rule);
      });

      // 3. 觸發通知與寫入
      if (newUnlocks.length > 0) {
        newUnlocks.forEach(ach => {
          setTimeout(() => triggerToast(`🏆 解鎖成就：${ach.title}`, 'success'), 1000);
        });
      }

      return {
        ...prev,
        stats: newStats,
        unlockedAchievements: [
          ...prev.unlockedAchievements, 
          ...newUnlocks.map(a => a.id)
        ]
      };
    });
  }, [triggerToast]);

  return { profile, setProfile, updateStats };
};