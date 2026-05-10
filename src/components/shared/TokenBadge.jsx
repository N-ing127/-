import React from 'react';
import { Coins } from 'lucide-react';

/**
 * 食光代幣計數徽章 (用於 Header / FloatingNav)
 * - tokens: 0/1/2，0 顯示警告色
 */
const TokenBadge = ({ tokens = 0, size = 'md', onClick }) => {
  const isEmpty = tokens === 0;
  const sizeClass = size === 'sm'
    ? 'px-2 py-1 text-xs gap-1'
    : 'px-3 py-1.5 text-sm gap-1.5';

  return (
    <button
      onClick={onClick}
      type="button"
      aria-label={`代幣 ${tokens}/2`}
      className={`
        inline-flex items-center font-black rounded-full transition-all active:scale-95
        ${sizeClass}
        ${isEmpty
          ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
          : 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-900 shadow-md shadow-amber-500/30'}
      `}
    >
      <Coins className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} strokeWidth={2.5} />
      <span>{tokens}/2</span>
    </button>
  );
};

export default TokenBadge;
