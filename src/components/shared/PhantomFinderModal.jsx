import React, { useState, useEffect } from 'react';
import { X, Ban, MapPin, Loader2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import DisputeReportModal from './DisputeReportModal';

/**
 * 「幽靈便當」舉報入口：
 *   1. 取得當下位置
 *   2. 呼叫 get_phantom_candidates RPC → 列出附近 50m + 2hr 內被宣告領完的 post
 *   3. 用戶選一個 → 進入 DisputeReportModal phantom_food 模式
 */
const PhantomFinderModal = ({ onClose, triggerToast }) => {
  const [candidates, setCandidates] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [coords, setCoords] = useState(null);
  const [selected, setSelected] = useState(null);  // 選中的 candidate

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      triggerToast?.('此裝置不支援定位', 'error');
      onClose();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        const { data, error } = await supabase.rpc('get_phantom_candidates', {
          p_lat: latitude, p_lng: longitude,
        });
        if (error) {
          console.error('[phantom finder] rpc error:', error);
          triggerToast?.('無法搜尋附近貼文', 'error');
          setCandidates([]);
        } else {
          setCandidates(data || []);
        }
        setIsLoading(false);
      },
      (err) => {
        triggerToast?.(err.code === 1 ? '請允許定位權限' : '取得定位失敗', 'error');
        onClose();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // 進入 DisputeReportModal
  if (selected) {
    return (
      <DisputeReportModal
        mode="phantom_food"
        target={{ lat: coords.lat, lng: coords.lng, label: selected.location_name || selected.food_type }}
        postId={selected.post_id}
        triggerToast={triggerToast}
        onCancel={() => setSelected(null)}
        onResolved={() => {
          setSelected(null);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[4500] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[80dvh] animate-in slide-in-from-bottom duration-300">

        <div className="shrink-0 p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-black text-base">舉報幽靈便當</h3>
              <p className="text-xs text-gray-500">附近 50m 內被宣告領完的食光</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-xs">搜尋附近候選中...</p>
            </div>
          )}

          {!isLoading && candidates && candidates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Ban className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm font-bold">附近 50m 內無候選</p>
              <p className="text-[11px] mt-1 px-8 text-center">舉報限制：必須在 2 小時內被宣告領完的貼文</p>
            </div>
          )}

          {!isLoading && candidates && candidates.length > 0 && (
            <div className="space-y-2">
              {candidates.map(c => (
                <button
                  key={c.post_id}
                  onClick={() => setSelected(c)}
                  className="w-full p-4 bg-gray-50 dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-200 dark:border-zinc-800 rounded-2xl text-left transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-black text-gray-800 dark:text-zinc-100">{c.food_type}</p>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                      {Math.round(c.distance_m)}m
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate flex-1">{c.location_name || '未命名地點'}</span>
                    <Users className="w-3 h-3" />
                    <span>{c.claimer_count} 名宣告</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhantomFinderModal;
