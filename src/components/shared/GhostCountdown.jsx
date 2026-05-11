import React, { useState, useEffect } from 'react';
import { Ghost, AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Ghost state 倒數元件 (Phase 3 UI / Phase 4 接 RPC)
 * 顯示「被別人領走，X 分 Y 秒內可舉報」
 *
 * Props:
 *   settlesAt  ISO timestamp
 *   onReport() — Phase 4 將呼叫 report_ghost_misreport RPC
 */
const GhostCountdown = ({ settlesAt, onReport, isReporting = false }) => {
  const [remainingMs, setRemainingMs] = useState(() => new Date(settlesAt).getTime() - Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setRemainingMs(new Date(settlesAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, [settlesAt]);

  const expired = remainingMs <= 0;
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;

  if (expired) {
    return (
      <div className="rounded-2xl bg-gray-100 dark:bg-zinc-800 p-4 flex items-center gap-3">
        <Ghost className="w-5 h-5 text-gray-400" />
        <div className="flex-1">
          <p className="font-bold text-sm text-gray-700 dark:text-zinc-300">結算窗口已關閉</p>
          <p className="text-xs text-gray-500">此份食光已正式被領走</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gray-200 dark:bg-zinc-800 p-4 flex items-center gap-3">
        <Ghost className="w-5 h-5 text-gray-500 animate-pulse" />
        <div className="flex-1">
          <p className="font-black text-gray-700 dark:text-zinc-200">有人搶先領走了</p>
          <p className="text-xs text-gray-500">
            結算倒數 <span className="font-bold tabular-nums">{m}:{String(s).padStart(2, '0')}</span> · 若你抵達現場發現便當還在，可舉報幽靈
          </p>
        </div>
      </div>

      <Button
        onClick={onReport}
        disabled={isReporting}
        className="w-full py-4 text-base font-black rounded-2xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
      >
        <AlertTriangle className="w-4 h-4" />
        舉報幽靈誤報
      </Button>
    </div>
  );
};

export default GhostCountdown;
