import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export const SWUpdateToast = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[3000] w-[90%] max-w-[360px] animate-in slide-in-from-bottom duration-500">
      <div className="bg-gray-800/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-full">
            <RefreshCw className={`w-5 h-5 text-emerald-400 ${needRefresh ? 'animate-spin' : ''}`} />
          </div>
          <div className="text-sm">
            {offlineReady ? (
              <span className="font-bold">已準備好離線瀏覽</span>
            ) : (
              <div>
                <p className="font-bold">發現新版本！</p>
                <p className="text-gray-400 text-xs mt-0.5">點擊更新以獲取最新功能</p>
              </div>
            )}
          </div>
        </div>

        {needRefresh && (
          <button 
            onClick={() => updateServiceWorker(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ml-2"
          >
            更新
          </button>
        )}
        
        <button onClick={close} className="p-1 hover:bg-white/10 rounded-full transition-colors ml-1">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
};