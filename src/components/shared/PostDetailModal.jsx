import React, { useState, useMemo } from 'react';
import { X, MapPin, Clock, Utensils, User, Share2, CalendarDays, Hourglass, CheckCircle2, Minus, Plus, Loader2, Lock, Coins, Flame, Navigation } from 'lucide-react';
import Button from '../ui/Button';
import { LOCATIONS } from '../../data/constants';
import { useGeofence } from '../../hooks/useGeofence';
import { useAuth } from '../../contexts/AuthContext';
import ClaimProofCamera from './ClaimProofCamera';
import GhostCountdown from './GhostCountdown';
import DisputeReportModal from './DisputeReportModal';
import BlockUserButton from './BlockUserButton';
import { uploadClaimProof } from '../../lib/uploadProof';

const PostDetailModal = ({
  selectedPost, setSelectedPost, posts, triggerToast,
  onClaim, onReserve, onShare, isMutating,
  // Phase 1 新增
  tokens = 0, stakedPostIds = new Set(), revealedCoords = {}, heatmapCounts = {},
  isStaking = false, onStake,
  // Phase 3
  ghostPosts = [],
  // Phase 5/6/Admin
  isAdmin = false,
}) => {
  // ⚠️ 所有 hooks 必須在 early return 之前，遵守 Rules of Hooks
  const [claimQty, setClaimQty] = useState(1);
  const [showCamera, setShowCamera] = useState(false);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [showGhostDispute, setShowGhostDispute] = useState(false);  // Phase 4
  const { user } = useAuth();

  // 從最新 posts 取得即時數據；若不在 posts 內 (已 taken) 但在 ghostPosts 內 → 取 ghost
  const livePost = useMemo(() => {
    if (!selectedPost) return null;
    const fromPosts = posts?.find(p => p.id === selectedPost.id);
    if (fromPosts) return fromPosts;
    const fromGhosts = ghostPosts?.find(g => g.id === selectedPost.id);
    if (fromGhosts) return fromGhosts;
    return selectedPost;
  }, [selectedPost, posts, ghostPosts]);

  // 是否為 ghost (被別人領走、結算中)
  const isGhost = livePost?.isGhost === true;

  // ── Phase 1/2 衍生狀態（先計算，後面 useGeofence 要用 target）──
  const isStakedByMe = livePost ? stakedPostIds.has(livePost.id) : false;
  const heatmapCount = livePost ? (heatmapCounts[livePost.id] ?? 0) : 0;
  const preciseLoc = livePost ? (revealedCoords[livePost.id] ?? null) : null;

  // useGeofence target — 必須無條件呼叫此 hook，內部已處理 null
  const geoTarget = useMemo(() => {
    if (!livePost || !isStakedByMe) return null;
    return preciseLoc || (livePost.lat && livePost.lng ? { lat: livePost.lat, lng: livePost.lng } : null);
  }, [livePost, isStakedByMe, preciseLoc]);
  const { distanceM, isInside, error: geoError, currentCoords } = useGeofence(geoTarget, 50);

  // 早退一定要在所有 hooks 之後
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

  const maxClaim = currentQty;
  const safeClaimQty = Math.min(claimQty, maxClaim);

  const handleStake = async () => {
    if (!onStake) return;
    await onStake(livePost.id);
  };

  // 點「領取」→ 開相機（admin 跳過 geofence）
  const handleClaim = () => {
    if (safeClaimQty < 1) return;
    if (!isInside && !isAdmin) {
      triggerToast?.(`距離 ${Math.round(distanceM || 0)}m，需在 50m 內`, 'error');
      return;
    }
    setShowCamera(true);
  };

  const handleProofConfirm = async (proofFile) => {
    if (!user) {
      triggerToast?.('請先登入', 'error');
      return;
    }
    // Admin: 用 post 座標兜底 (反正後端 bypass distance check)
    // 一般用戶: 必須有 currentCoords (前端已守門到此)
    const coords = currentCoords
      ?? (isAdmin && livePost.lat && livePost.lng
            ? { lat: livePost.lat, lng: livePost.lng }
            : null);
    if (!coords) {
      triggerToast?.('定位異常，請重試', 'error');
      return;
    }
    setIsUploadingProof(true);
    try {
      const { path, error } = await uploadClaimProof(proofFile, livePost.id, user.id);
      if (error || !path) {
        triggerToast?.('證明照片上傳失敗', 'error');
        return;
      }
      const ok = await onClaim(livePost, safeClaimQty, {
        url: path,
        lat: coords.lat,
        lng: coords.lng,
      });
      if (ok) setShowCamera(false);
    } catch (err) {
      console.error('[claim] error:', err);
      triggerToast?.('領取失敗，請重試', 'error');
    } finally {
      setIsUploadingProof(false);
    }
  };

  // (舊 handleClaim 已由上面的拍照流程取代)

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

          {/* Phase 3 + 4: Ghost State + 真實舉報 */}
          {isGhost && (
            <GhostCountdown
              settlesAt={livePost.settlesAt}
              onReport={() => setShowGhostDispute(true)}
            />
          )}

          {/* 截止 / 領完狀態 (非 ghost) */}
          {!isGhost && (isExpired || isTaken) && (
            <Button disabled className="w-full py-4 text-lg font-black rounded-2xl bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400">
              {isExpired ? '已截止' : '已領完'}
            </Button>
          )}

          {/* Phase 5: 封鎖發布者 (非 ghost、非自己發布) */}
          {!isGhost && livePost.posterId && livePost.posterId !== user?.id && (
            <div className="flex justify-center pt-1">
              <BlockUserButton
                posterId={livePost.posterId}
                postId={livePost.id}
                posterName={livePost.provider}
                triggerToast={triggerToast}
                onBlocked={() => setSelectedPost(null)}
              />
            </div>
          )}

          {/* 可用：未質押 → 質押按鈕；已質押 → 領取流程 */}
          {!isGhost && isAvailable && !isStakedByMe && (
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

          {!isGhost && isAvailable && isStakedByMe && (
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

              {/* Admin bypass 標籤 */}
              {isAdmin && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-black">
                  ⚡ Admin Bypass — 跳過 50m 限制
                </div>
              )}

              {/* Geofence 狀態提示 (admin 跳過) */}
              {!isAdmin && !isInside && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-xs">
                  <Navigation className="w-3.5 h-3.5 shrink-0" />
                  {geoError === 'PERMISSION_DENIED' ? (
                    <span className="font-bold">請允許定位權限後重新整理</span>
                  ) : geoError ? (
                    <span className="font-bold">無法取得定位</span>
                  ) : distanceM == null ? (
                    <span>正在取得你的位置...</span>
                  ) : (
                    <span className="font-bold">距離 {Math.round(distanceM)}m，需在 50m 內</span>
                  )}
                </div>
              )}
              {!isAdmin && isInside && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 已抵達現場 ({Math.round(distanceM)}m)
                </div>
              )}

              <Button
                onClick={handleClaim}
                disabled={isMutating || (!isInside && !isAdmin)}
                className={`w-full py-4 text-lg font-black rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                  (isInside || isAdmin)
                    ? 'shadow-emerald-500/20'
                    : 'bg-gray-300 dark:bg-zinc-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isMutating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 處理中...</>
                ) : (!isInside && !isAdmin) ? (
                  '請先抵達現場'
                ) : (
                  `我拿走了 ${safeClaimQty} 份`
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Phase 2: 拍照存證 modal (z-[4000] 在 PostDetailModal 之上) */}
      {showCamera && (
        <ClaimProofCamera
          onCancel={() => !isUploadingProof && setShowCamera(false)}
          onConfirm={handleProofConfirm}
          isSubmitting={isUploadingProof || isMutating}
        />
      )}

      {/* Phase 4: Ghost 舉報 modal */}
      {showGhostDispute && isGhost && (
        <DisputeReportModal
          mode="ghost_misreport"
          target={{
            lat: preciseLoc?.lat ?? livePost.lat,
            lng: preciseLoc?.lng ?? livePost.lng,
            label: livePost.locationName || livePost.foodType,
          }}
          settlementId={livePost.settlementId}
          postId={livePost.id}
          triggerToast={triggerToast}
          onCancel={() => setShowGhostDispute(false)}
          onResolved={() => {
            setShowGhostDispute(false);
            setSelectedPost(null);  // 關閉整個 detail modal，使用者回主頁看更新
          }}
        />
      )}
    </div>
  );
};

export default PostDetailModal;
