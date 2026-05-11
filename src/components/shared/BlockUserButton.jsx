import React, { useState } from 'react';
import { Ban, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * 封鎖發布者按鈕 (用於 PostDetailModal)
 * - 5 人封鎖該 user → 自動 shadowban
 * - 若封鎖時還 stake 著該 post → 退代幣
 */
const BlockUserButton = ({ posterId, postId, posterName, triggerToast, onBlocked }) => {
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlock = async () => {
    const confirmed = window.confirm(`封鎖 ${posterName || '此使用者'}？\n他的貼文將從你的主頁消失，累積 5 人封鎖會全網隱蔽。`);
    if (!confirmed) return;

    setIsBlocking(true);
    try {
      const { data, error } = await supabase.rpc('block_user', {
        p_target_id: posterId,
        p_post_id: postId,
        p_reason: 'inappropriate',
      });
      if (error) throw error;
      if (!data?.success) {
        const errMap = {
          CANNOT_BLOCK_SELF: '不能封鎖自己',
          PARTNER_PROTECTED: '此為白名單合作單位，惡意封鎖將扣 20 信任分',
        };
        triggerToast?.(errMap[data?.error] ?? '封鎖失敗', 'error');
        return;
      }
      const msg = data.shadowbanned
        ? `已封鎖，此用戶累積 ${data.block_count} 次封鎖 — 全網隱蔽生效`
        : `已封鎖 (累積 ${data.block_count}/5)${data.token_refunded ? '，代幣已退還' : ''}`;
      triggerToast?.(msg, 'success');
      onBlocked?.();
    } catch (err) {
      console.error('[block] error:', err);
      triggerToast?.('封鎖失敗，請重試', 'error');
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <button
      onClick={handleBlock}
      disabled={isBlocking}
      className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
    >
      {isBlocking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
      封鎖此發布者
    </button>
  );
};

export default BlockUserButton;
