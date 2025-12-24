import React from 'react';
import { ArrowLeft, Clock, MapPin, CheckCircle2, Utensils } from 'lucide-react';
import { LOCATIONS } from '../data/constants';

const HistoryView = ({ setActiveTab, posts }) => {
  // 過濾出狀態為 'taken' 的項目（在 Demo 模式下，我們假設這些是使用者領取的）
  const historyPosts = posts
    .filter(p => p.status === 'taken')
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-zinc-950 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 p-4 pt-12 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => setActiveTab('profile')} className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-500" />
        </button>
        <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100">領取紀錄</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-24 space-y-4">
        {historyPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Utensils className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">尚無領取紀錄，快去探索惜食吧！</p>
          </div>
        ) : (
          historyPosts.map(post => {
            const loc = LOCATIONS.find(l => l.id === post.locationId);
            const dateStr = new Date(post.timestamp).toLocaleDateString('zh-TW', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return (
              <div key={post.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${post.imageColor || 'bg-emerald-100 text-emerald-600'}`}>
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 dark:text-zinc-100 truncate">{post.foodType}</h4>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{loc?.name} · {post.locationDetail}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{dateStr} 領取成功</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-gray-400">+{post.quantity}{post.unit}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HistoryView;