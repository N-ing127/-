import React, { useState, useMemo } from 'react';
import { X, MapPin, Clock, Utensils, User, Share2, CalendarDays, Hourglass, CheckCircle2, Minus, Plus, Loader2, Lock, Coins, Flame } from 'lucide-react';
import Button from '../ui/Button';
import { LOCATIONS } from '../../data/constants';

const PostDetailModal = ({
  selectedPost, setSelectedPost, posts, triggerToast,
  onClaim, onReserve, onShare, isMutating,
  // Phase 1 新增
  tokens = 0, stakedPostIds = new Set(), revealedCoords = {}, heatmapCounts = {},
  isStaking = false, onStake,
}) => {
  const [claimQty, setClaimQty] = useState(1);

  // 從最新 posts 取得即時數據（selectedPost 可能是 stale snapshot）
  const livePost = useMemo(() => {
    if (!selectedPost) return null;
    return posts?.find(p => p.id === selectedPost.id) ?? selectedPost;
  }, [selectedPost, posts]);

  if (!livePost) return null;

  const location = LOCATIONS.find(loc => loc.id === livePost.locationId);
  const currentQty = parseInt(livePost.quantity) || 0;

  const pickupTime = new Date(livePost.pickupTime);
  const expireTime = new Date(livePost.expireTime);
  const now = new Date();

  const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
  const dateOptions = { month: 'long', day: 'numeric', weekday: 'short' };

  const formattedPickupTime = pickupTime.toLocaleTimeString('zh-TW', timeOptions);
  const formattedExpireTime = expireTime.toLocaleTimeString('zh-TW', timeOptions);
  const formattedDate = pickupTime.toLocaleDateString('zh-TW', dateOptions);

  const timeLeft = expireTime.getTime() - now.getTime();
  const minutesLeft = Math.floor(timeLeft / (1000 * 60));
  const hoursLeft = Math.floor(minutesLeft / 60);

  const getTimeLeftString = () => {
    if (timeLeft <= 0) return "已截止";
    if (hoursLeft > 0) return `${hoursLeft} 小時 ${minutesLeft % 60} 分鐘`;
    return `${minutesLeft} 分鐘`;
  };

  const isExpired = timeLeft <= 0;
  const isTaken = livePost.status === 'taken' || currentQty <= 0;
  const isAvailable = !isExpired && !isTaken;

  // ── Phase 1: 質押狀態 ──
  const isStakedByMe = stakedPostIds.has(livePost.id);
  const heatmapCount = heatmapCounts[livePost.id] ?? 0;
  // 揭露的精確座標 (來自 RPC) > livePost 原本的 lat/lng (poster 自己看)
  const preciseLoc = revealedCoords[livePost.id] ?? null;

  // 領取數量上限 = 剩餘數量
  const maxClaim = currentQty;
  const safeClaimQty = Math.min(claimQty, maxClaim);

  const handleStake = async () => {
    if (!onStake) return;
    await onStake(livePost.id);
  };

  const handleClaim = () => {
    if (safeClaimQty < 1) return;
    const msg = safeClaimQty === 1
      ? '確定要領取 1 份嗎？'
      : `確定要領取 ${safeClaimQty} 份嗎？`;
    if (window.confirm(msg)) {
      onClaim(livePost, safeClaimQty);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      {/* flex-col：圖片固定 / 內容滾動 / CTA 永置底；max-h 用 dvh 對應 iOS Safari URL bar */}
      <div className="relative w-full max-w-md bg-stone-50 dark:bg-zinc-950 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] sm:max-h-[85dvh]">
        <button onClick={() => { setSelectedPost(null); setClaimQty(1); }} className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-gray-600 transition-colors z-20">
          <X className="w-5 h-5" />
        </button>

        {/* 圖片區域：固定 不參與滾動 */}
        <div className="relative h-64 w-full shrink-0 bg-gradient-to-br from-emerald-200 to-teal-300 dark:from-zinc-800 dark:to-zinc-900 overflow-hidden">
          {livePost.imageUrl && (
            <img
              src={livePost.imageUrl}
              alt={livePost.foodType}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // 不支援格式 (e.g. .heic) → 切換 placeholder 顯示
                e.currentTarget.style.display = 'none';
                const placeholder = e.currentTarget.parentElement?.querySelector('[data-img-fallback]');
                if (placeholder) placeholder.style.display = 'flex';
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
          <div data-img-fallback style={{ display: 'none' }} className="absolute inset-0 items-center justify-center text-white/60">
            <Utensils className="w-12 h-12 opacity-50" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

          {isExpired && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-2xl font-black">已截止</div>}
          {isTaken && !isExpired && <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/80 text-white text-2xl font-black"><CheckCircle2 className="w-8 h-8 mr-3"/>已領完</div>}

          {/* 分享按鈕 */}
          {isAvailable && (
            <button
              onClick={() => onShare(livePost)}
              className="absolute top-5 left-5 p-2 rounded-full bg-white/20 backdrop-blur-md text-white shadow-md hover:bg-white/30 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}

          <div className="absolute bottom-5 left-5 text-white">
            <h3 className="text-3xl font-black drop-shadow-lg">{livePost.foodType}</h3>
            <p className="text-emerald-100 text-sm drop-shadow-md">
              剩 {currentQty} {livePost.unit} | {livePost.tags?.join(', ')}
            </p>
          </div>
        </div>

        {/* 內容區域：flex-1 撐滿剩餘空間 + 自身 scroll */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 pb-3 space-y-5 text-gray-800 dark:text-zinc-100">

          {/* 地點區：未質押顯示模糊光暈，已質押顯示精確 */}
          {isStakedByMe ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1">
                <p className="font-bold flex items-center gap-2">
                  {location?.name || '未知地點'}
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-800/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    精確位置已揭露
                  </span>
                </p>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{livePost.locationDetail}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  {livePost.coarseLabel || location?.name || '校園附近'}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400">投入 1 代幣可解鎖精確位置</p>
              </div>
            </div>
          )}

          {/* 熱力指標：前往中人數 */}
          <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/40">
            <Flame className="w-5 h-5 text-rose-500" />
            <div>
              <p className="font-bold text-sm">前往中人數</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {heatmapCount === 0 ? '目前無人質押' : `${heatmapCount} 人已質押前往`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-stone-100 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
              <CalendarDays className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="font-bold text-sm">日期</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-stone-100 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-bold text-sm">領取時間</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">{formattedPickupTime} - {formattedExpireTime}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-stone-100 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
            <Hourglass className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-bold text-sm">剩餘時間</p>
              <p className={`text-xs font-bold ${isExpired ? 'text-gray-400' : 'text-red-500 dark:text-red-400'}`}>{getTimeLeftString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-stone-100 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
            <User className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-bold text-sm">發布者</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{livePost.provider}</p>
            </div>
          </div>

        </div>

        {/* 永置底 CTA Bar */}
        <div className="shrink-0 border-t border-gray-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3">

          {/* 截止 / 領完狀態 */}
          {(isExpired || isTaken) && (
            <Button disabled className="w-full py-4 text-lg font-black rounded-2xl bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400">
              {isExpired ? '已截止' : '已領完'}
            </Button>
          )}

          {/* 可用：未質押 → 質押按鈕；已質押 → 領取流程 */}
          {isAvailable && !isStakedByMe && (
            <Button
              onClick={handleStake}
              disabled={isStaking || tokens <= 0}
              className={`w-full py-4 text-lg font-black rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                tokens <= 0
                  ? 'bg-gray-300 dark:bg-zinc-700 text-gray-500'
                  : 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-amber-900 shadow-amber-500/30'
              }`}
            >
              {isStaking ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> 質押中...</>
              ) : (
                <>
                  <Coins className="w-5 h-5" strokeWidth={2.5} />
                  {tokens <= 0 ? '代幣不足' : '投入 1 代幣 · 解鎖精確位置'}
                </>
              )}
            </Button>
          )}

          {isAvailable && isStakedByMe && (
            <>
              {maxClaim > 1 && (
                <div className="flex items-center justify-center gap-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                  <span className="text-sm font-bold text-gray-600 dark:text-zinc-300">領取數量</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setClaimQty(q => Math.max(1, q - 1))}
                      disabled={safeClaimQty <= 1}
                      className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-600 dark:text-zinc-300 disabled:opacity-30 transition-all active:scale-90"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 w-8 text-center">{safeClaimQty}</span>
                    <button
                      onClick={() => setClaimQty(q => Math.min(maxClaim, q + 1))}
                      disabled={safeClaimQty >= maxClaim}
                      className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center text-gray-600 dark:text-zinc-300 disabled:opacity-30 transition-all active:scale-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">/ {maxClaim}</span>
                </div>
              )}

              <Button
                onClick={handleClaim}
                disabled={isMutating}
                className="w-full py-4 text-lg font-black rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isMutating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 處理中...</>
                ) : (
                  `領取 ${safeClaimQty} 份`
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
