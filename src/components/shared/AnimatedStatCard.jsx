import React, { useState, useEffect } from 'react';
import { useCountingAnimation } from '../../hooks/useCountingAnimation';

const AnimatedStatCard = ({ icon: Icon, value, label, color, delay = 0 }) => {
  // 使用 Hook，並加入延遲，讓兩個數字可以錯開跳動
  const animatedValue = useCountingAnimation(value, 1200 + delay);

  // 實現卡片載入時的輕微脈動 Micro-interaction
  const [pulse, setPulse] = useState(false);
  
  useEffect(() => {
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 500); // 脈動持續 500ms
    return () => clearTimeout(timer);
  }, [value]);

  // 定義顏色主題
  const theme = color === 'emerald' ? {
    border: 'border-emerald-50',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
    numText: 'text-emerald-700',
    ring: 'ring-emerald-100/50'
  } : {
    border: 'border-orange-50',
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-600',
    numText: 'text-orange-600',
    ring: 'ring-orange-100/50'
  };

  return (
    <div className={`
        bg-white p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center border
        transition-all duration-500 transform
        ${theme.border}
        ${pulse ? `scale-105 ring-4 ${theme.ring}` : 'scale-100'}
    `}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${theme.iconBg} ${theme.iconText}`}>
        <Icon className="w-5 h-5"/>
      </div>
      
      {/* 數字字體放大並應用動畫值 */}
      <div className={`text-3xl font-black transition-colors duration-300 ${theme.numText}`}>
        {animatedValue}
      </div>
      
      <div className="text-xs text-gray-400 font-bold mt-1">
        {label}
      </div>
    </div>
  );
};

export default AnimatedStatCard;