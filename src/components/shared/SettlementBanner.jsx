import React, { useState, useEffect } from 'react';
import { Hourglass, CheckCircle2, AlertOctagon } from 'lucide-react';

/**
 * 主頁頂部結算狀態橫幅
 * 三種狀態：
 *   pending (倒數中) — 橘色
 *   settled (15min 後)  — 綠色
 *   voided (被舉報)   — 紅色
 */
const SettlementBanner = ({ settlement }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!settlement || settlement.isOverdue || settlement.status === 'voided') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [settlement?.id, settlement?.isOverdue, settlement?.status]);

  if (!settlement) return null;

  const isVoided = settlement.status === 'voided';
  if (isVoided) {
    return (
      <div className="mx-4 mt-3 px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 bg-red-500 text-white">
        <AlertOctagon className="w-5 h-5" />
        <div className="flex-1">
          <p className="font-black text-sm">⚠ 結算被駁回</p>
          <p className="text-xs opacity-90">有人在現場舉報你假領，獎勵已沒收 + 扣 10 信任分</p>
        </div>
      </div>
    );
  }

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
