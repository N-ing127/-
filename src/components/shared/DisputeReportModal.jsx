import React, { useState } from 'react';
import { AlertTriangle, Camera, Loader2, X, Navigation, CheckCircle2, Ghost, Ban } from 'lucide-react';
import Button from '../ui/Button';
import { useGeofence } from '../../hooks/useGeofence';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { uploadClaimProof } from '../../lib/uploadProof';
import { compressImage } from '../../lib/compressImage';

/**
 * 通用舉報 Modal — 處理兩種 dispute：
 *   mode='ghost_misreport': B 舉報 A 在 escrow 期假領（需要 settlementId）
 *   mode='phantom_food':    C 舉報整個 post 的所有 claimers 都假領（需要 postId）
 *
 * Props:
 *   mode             'ghost_misreport' | 'phantom_food'
 *   target           { lat, lng, label }  目標座標 + 顯示名稱
 *   settlementId     ghost_misreport mode 必填
 *   postId           兩種 mode 都要傳 (ghost mode 用於存 proof path)
 *   onResolved(data) 成功回呼，data = { dispute_id, ... }
 *   onCancel()
 *   triggerToast
 */
const DisputeReportModal = ({
  mode, target, settlementId, postId,
  onResolved, onCancel, triggerToast,
}) => {
  const { user } = useAuth();
  const { distanceM, isInside, error: geoError, currentCoords } = useGeofence(target, 50);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    e.target.value = '';
  };

  const submit = async () => {
    if (!user || !file || !currentCoords) {
      triggerToast?.('資訊不足，無法送出', 'error');
      return;
    }
    if (!isInside) {
      triggerToast?.('需在現場 50m 內才能舉報', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. 壓縮 + 上傳到 claim-proofs bucket
      const { path, error: upErr } = await uploadClaimProof(file, postId, user.id);
      if (upErr || !path) {
        triggerToast?.('照片上傳失敗', 'error');
        return;
      }

      // 2. 呼叫對應 RPC
      const args = mode === 'ghost_misreport'
        ? {
            p_settlement_id: settlementId,
            p_proof_url:     path,
            p_reporter_lat:  currentCoords.lat,
            p_reporter_lng:  currentCoords.lng,
          }
        : {
            p_post_id:       postId,
            p_proof_url:     path,
            p_reporter_lat:  currentCoords.lat,
            p_reporter_lng:  currentCoords.lng,
          };
      const rpcName = mode === 'ghost_misreport' ? 'report_ghost_misreport' : 'report_phantom_food';
      const { data, error } = await supabase.rpc(rpcName, args);
      if (error) throw error;
      if (!data?.success) {
        const errMap = {
          NOT_AUTHENTICATED:      '請先登入',
          PROOF_REQUIRED:         '需附證明照片',
          SETTLEMENT_NOT_FOUND:   '結算記錄不存在',
          NOT_PENDING:            '結算已完成或被否決',
          WINDOW_EXPIRED:         '舉報窗口已關閉',
          CANNOT_REPORT_OWN:      '不能舉報自己',
          NOT_STAKER:             '需先質押過此食光才能舉報',
          POST_NOT_FOUND:         '貼文不存在',
          POST_NOT_TAKEN:         '此貼文非「已宣告領完」狀態',
          OUT_OF_RANGE:           `距離過遠 (${Math.round(data?.distance_m || 0)}m)`,
        };
        triggerToast?.(errMap[data?.error] ?? '舉報失敗', 'error');
        return;
      }

      const msg = mode === 'ghost_misreport'
        ? `舉報成功！+${data.bounty_tokens} 代幣賞金`
        : `舉報成功！標記 ${data.flagged_users_count} 名假領帳號`;
      triggerToast?.(msg, 'success');
      onResolved?.(data);
    } catch (err) {
      console.error('[dispute] submit error:', err);
      triggerToast?.('舉報失敗，請重試', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === 'ghost_misreport' ? '舉報「幽靈誤報」' : '舉報「幽靈便當」';
  const Icon = mode === 'ghost_misreport' ? Ghost : Ban;
  const subtitle = mode === 'ghost_misreport'
    ? '便當還在 = 有人假領'
    : '所有人宣告領完 = 集體假領';

  return (
    <div className="fixed inset-0 z-[4500] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[92dvh] animate-in slide-in-from-bottom duration-300">

        {/* Header */}
        <div className="shrink-0 p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Icon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-black text-base text-gray-900 dark:text-zinc-100">{title}</h3>
              <p className="text-xs text-gray-500">{subtitle} · {target?.label || '附近'}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-2 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* 法律警示 */}
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-red-800 dark:text-red-300 font-bold">
              惡意舉報將扣除信任積分並可能永久停權。請確認現場確實有食物再送出。
            </p>
          </div>

          {/* Geofence 狀態 */}
          <div className={`p-3 rounded-xl border ${
            isInside
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400'
          }`}>
            <div className="flex items-center gap-2 text-xs font-bold">
              {isInside ? <CheckCircle2 className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
              {geoError === 'PERMISSION_DENIED' ? '請允許定位權限'
                : geoError ? '無法取得定位'
                : distanceM == null ? '正在取得位置...'
                : isInside ? `已抵達現場 (${Math.round(distanceM)}m)`
                : `距離 ${Math.round(distanceM)}m，需在 50m 內`}
            </div>
          </div>

          {/* 拍照區 */}
          {!previewUrl ? (
            <label className={`block aspect-square rounded-3xl border-2 border-dashed transition-all ${
              isInside
                ? 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10 active:scale-95 cursor-pointer'
                : 'border-gray-300 bg-gray-100 dark:bg-zinc-900 cursor-not-allowed opacity-60'
            }`}>
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-20 h-20 rounded-3xl bg-red-500 flex items-center justify-center shadow-xl shadow-red-500/40">
                  <Camera className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-black text-red-700 dark:text-red-400">拍下現場食物</span>
                <span className="text-[11px] text-gray-500">證據將存檔供審查</span>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handlePick}
                disabled={!isInside}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl">
              <img src={previewUrl} alt="存證" className="w-full h-full object-cover" />
              <button
                onClick={() => { URL.revokeObjectURL(previewUrl); setFile(null); setPreviewUrl(null); }}
                disabled={isSubmitting}
                className="absolute top-3 right-3 px-3 py-2 bg-white/95 backdrop-blur rounded-full shadow text-xs font-bold text-gray-700 disabled:opacity-50"
              >
                重拍
              </button>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="shrink-0 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-gray-100 dark:border-zinc-800 grid grid-cols-2 gap-3">
          <Button onClick={onCancel} variant="ghost" disabled={isSubmitting}>取消</Button>
          <Button
            onClick={submit}
            disabled={!file || !isInside || isSubmitting}
            className="bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> 送出中</> : '送出舉報'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DisputeReportModal;
