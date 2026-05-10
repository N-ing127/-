import React, { useState, useEffect } from 'react';
import { Hourglass, CheckCircle2 } from 'lucide-react';

/**
 * 主頁頂部「結算中」橫幅
 * - props.settlement: 來自 useSettlements 的 enriched 物件
 * - 倒數每秒 tick
 */
const SettlementBanner = ({ settlement }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!settlement || settlement.isOverdue) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [settlement?.id, settlement?.isOverdue]);

  if (!settlement) return null;

  const remainingMs = new Date(settlement.settles_at).getTime() - now;
  const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
  const min = Math.floor(remainingSec / 60);
  const sec = remainingSec % 60;
  const isOverdue = remainingMs <= 0;

  return (
    <div className={`mx-4 mt-3 px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 ${
      isOverdue
        ? 'bg-emerald-500 text-white'
        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
    }`}>
      {isOverdue ? <CheckCircle2 className="w-5 h-5" /> : <Hourglass className="w-5 h-5 animate-pulse" />}
      <div className="flex-1">
        <p className="font-black text-sm">
          {isOverdue ? '✓ 領取已結算' : '結算中...'}
        </p>
        <p className="text-xs opacity-90">
          {isOverdue
            ? '感謝你拯救了一份食光！'
            : `再 ${min} 分 ${String(sec).padStart(2, '0')} 秒完成結算 (期間若被舉報則扣除獎勵)`}
        </p>
      </div>
    </div>
  );
};

export default SettlementBanner;
