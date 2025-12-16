export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getTodayDateString = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export const formatDisplayTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const calculateDistance = (p1, p2) => {
  if (!p1 || !p2 || !p1.lat || !p2.lat) return 0;
  const R = 6371e3; // 地球半徑 (公尺)
  const φ1 = p1.lat * Math.PI / 180;
  const φ2 = p2.lat * Math.PI / 180;
  const Δφ = (p2.lat - p1.lat) * Math.PI / 180;
  const Δλ = (p2.lng - p1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return Math.round(R * c); 
};

// ... (保留原有的 delay, getTodayDateString, formatDisplayTime, calculateDistance)

// 新增：計算步行時間 (以 80m/min 估算)
export const calculateWalkingTime = (distanceMeters) => {
    if (distanceMeters <= 0) return '< 1';
    // 假設平均步行速度為 80m/分鐘 (約 4.8 km/h)
    const timeInMinutes = distanceMeters / 80;
    // 向上取整，確保時間估算保守
    return timeInMinutes < 1 ? '< 1' : Math.ceil(timeInMinutes);
  };