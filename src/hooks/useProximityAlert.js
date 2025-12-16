import { useMemo } from 'react';
import { LOCATIONS } from '../data/constants';
import { calculateDistance } from '../utils/helpers';

export const useProximityAlert = (posts, userLocation) => {
  const ALERT_DISTANCE = 400; // 觸發通知的距離門檻 (公尺)

  return useMemo(() => {
    // 如果沒有使用者座標，直接回傳 null
    if (!userLocation || !userLocation.lat) return null;

    let closestPost = null;
    let minDistance = ALERT_DISTANCE + 1;

    posts.forEach(post => {
      // 只篩選狀態為 available 的貼文
      if (post.status === 'available') {
        const loc = LOCATIONS.find(l => l.id === post.locationId);
        if (loc) {
          const distance = calculateDistance(userLocation, loc);
          
          // 找出範圍內且距離最近的一筆
          if (distance < ALERT_DISTANCE && distance < minDistance) {
            minDistance = distance;
            closestPost = { ...post, distance }; // 回傳時附帶即時距離
          }
        }
      }
    });

    return closestPost; 
  }, [posts, userLocation.lat, userLocation.lng]); // 只在貼文變動或座標數值變動時重新計算
};