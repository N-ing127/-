import React from 'react';

/**
 * 環境標籤：根據 VITE_SUPABASE_URL 自動判斷 BETA vs PROD
 * 在 PROD 環境隱藏（避免污染正式版 UI），只在 BETA / DEV 顯示警示色塊
 */
const EnvBadge = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || '';
  const isProd = url.includes('ahtkuxwziabupojpjelq');  // ← 換成你 production 的 project ref
  if (isProd) return null;

  return (
    <div className="fixed top-1 left-1 z-[9999] pointer-events-none select-none">
      <span className="px-2 py-0.5 bg-amber-400 text-amber-950 text-[9px] font-black rounded-full shadow-md tracking-widest uppercase">
        Beta
      </span>
    </div>
  );
};

export default EnvBadge;
