import { useState, useEffect, useRef } from 'react';

export const useCountingAnimation = (endValue, duration = 1200) => {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = null;
    
    // 將 endValue 轉為數字，處理小數點 (savedWeight)
    const target = parseFloat(endValue) || 0;
    const isFloat = target % 1 !== 0;

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      // 計算進度 (0 到 1)
      const progress = Math.min(elapsed / duration, 1);
      
      // 緩動函數 (Ease Out Quart): 讓數字快結束時變慢，更有質感
      const easeOut = 1 - Math.pow(1 - progress, 4);
      
      let currentValue = easeOut * target;

      // 處理小數點位數
      if (isFloat) {
        currentValue = parseFloat(currentValue.toFixed(1));
      } else {
        currentValue = Math.floor(currentValue);
      }

      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // 確保動畫結束時精確等於目標值
        setCount(target);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      startTimeRef.current = null;
    };
  }, [endValue, duration]);

  // 返回帶有小數點或不帶小數點的動畫值
  return endValue % 1 !== 0 ? count.toFixed(1) : count;
};