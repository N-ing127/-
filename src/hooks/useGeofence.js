import { useState, useEffect, useRef } from 'react';
import { calculateDistance } from '../utils/helpers';

/**
 * 監聽當下位置與目標座標的距離，提供 geofence 守門。
 *
 * @param {{lat:number,lng:number}|null} target  目標座標；null 不啟動
 * @param {number} radiusM  geofence 半徑 (公尺)，預設 50
 * @returns {{
 *   distanceM: number|null,  // 公尺，null = 未開始 / 失敗
 *   isInside: boolean,
 *   accuracy: number|null,   // 定位精度誤差 (公尺)
 *   error: string|null,
 *   currentCoords: {lat,lng}|null,
 * }}
 */
export const useGeofence = (target, radiusM = 50) => {
  const [state, setState] = useState({
    distanceM: null, isInside: false, accuracy: null,
    error: null, currentCoords: null,
  });
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!target?.lat || !target?.lng) {
      setState(s => ({ ...s, distanceM: null, isInside: false }));
      return;
    }
    if (!('geolocation' in navigator)) {
      setState({ distanceM: null, isInside: false, accuracy: null, error: 'GEO_UNSUPPORTED', currentCoords: null });
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        // calculateDistance 回傳「公尺」(視 helpers 實作)；若回 km 改成 *1000
        const dRaw = calculateDistance(latitude, longitude, target.lat, target.lng);
        const distanceM = dRaw < 5 ? dRaw * 1000 : dRaw; // 容錯：若值看起來像 km 自動轉
        // 上面 hack 不安全，改用單位明確的算法（若 helpers 回傳是公里就 *1000）
        // 這裡改用本地 Haversine 保證單位
        const distance = haversineM(latitude, longitude, target.lat, target.lng);

        setState({
          distanceM: distance,
          isInside: distance <= radiusM,
          accuracy,
          error: null,
          currentCoords: { lat: latitude, lng: longitude },
        });
      },
      (err) => {
        setState(s => ({ ...s, error: err.code === 1 ? 'PERMISSION_DENIED' : 'POSITION_UNAVAILABLE' }));
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [target?.lat, target?.lng, radiusM]);

  return state;
};

// 內嵌 Haversine（公尺），不依賴外部 helpers 的單位
function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
