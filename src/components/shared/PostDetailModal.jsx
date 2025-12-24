import React from 'react';
import { X, MapPin, Clock, User, Info, CheckCircle, Navigation, Bookmark, Utensils, Flame } from 'lucide-react';
import Button from '../ui/Button';
import { LOCATIONS } from '../../data/constants';
import { formatDisplayTime, calculateWalkingTime } from '../../utils/helpers';

const PostDetailModal = ({ selectedPost, setSelectedPost, onTaken, onReserve }) => {
  if (!selectedPost) return null;

  const location = LOCATIONS.find(l => l.id === selectedPost.locationId);
  const displayTime = formatDisplayTime(selectedPost.expireTime);
  // 模擬距離與時間
  const distance = 400; 
  const walkingTime = calculateWalkingTime(distance);
  
  const isAvailable = selectedPost.status === 'available';
  const isReserved = selectedPost.status === 'reserved';

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)}></div>
      
      {/* 彈窗主體 */}
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative z-10 animate-in slide-in-from-bottom duration-300">
        
        {/* 關閉按鈕 */}
        <button onClick={() => setSelectedPost(null)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 z-20 backdrop-blur">
          <X className="w-5 h-5" />
        </button>
        
        {/* 圖片區域 */}
        <div className={`h-64 relative bg-gray-100 dark:bg-zinc-800 ${!selectedPost.imageUrl && selectedPost.imageColor}`}>
          {selectedPost.imageUrl ? (
            <img src={selectedPost.imageUrl} className="w-full h-full object-cover" alt="food" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Utensils className="w-16 h-16 text-white/50"/>
            </div>
          )}
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-3xl font-bold text-white">{selectedPost.foodType}</h2>
            <p className="text-emerald-300 font-bold text-lg">剩餘 {selectedPost.quantity} {selectedPost.unit}</p>
          </div>
        </div>

        {/* 內容區 */}
        <div className="p-6 space-y-6 pb-12 sm:pb-6 overflow-y-auto max-h-[70vh]">
          {/* 時間資訊 */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4"/> {formatDisplayTime(selectedPost.pickupTime)} 開放
            </div>
            <div className="flex items-center gap-1 text-red-500 font-bold">
              <Flame className="w-4 h-4"/> {displayTime} 截止
            </div>
          </div>

          {/* 地點卡片 */}
          <div className="p-4 bg-stone-50 dark:bg-zinc-800 rounded-2xl border border-stone-100 dark:border-zinc-700 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 mt-1 shrink-0"/>
            <div>
              <div className="font-bold text-gray-800 dark:text-zinc-100">{location?.name || '未知地點'}</div>
              <div className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{selectedPost.locationDetail}</div>
            </div>
          </div>

          {/* 標籤區 - 已改為原生 span 避免 Badge 錯誤 */}
          <div className="flex flex-wrap gap-2">
            {selectedPost.tags && selectedPost.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 text-xs font-bold rounded-lg border dark:border-zinc-700">
                #{tag}
              </span>
            ))}
          </div>

          {/* 按鈕動作區 */}
          <div className="pt-2">
            {isAvailable ? (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => onReserve(selectedPost)} 
                  variant="outline" 
                  className="py-4 rounded-2xl dark:border-emerald-500 dark:text-emerald-400"
                >
                  <Bookmark className="w-5 h-5" /> 預訂
                </Button>
                <Button 
                  onClick={() => onTaken(selectedPost)} 
                  variant="primary" 
                  className="py-4 rounded-2xl"
                >
                  <CheckCircle className="w-5 h-5" /> 領取
                </Button>
              </div>
            ) : isReserved ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl text-center border border-emerald-100 dark:border-emerald-800">
                <p className="text-emerald-600 dark:text-emerald-400 font-bold mb-3">已為您保留！請盡快前往</p>
                <Button onClick={() => onTaken(selectedPost)} variant="primary" className="w-full">確認領取</Button>
              </div>
            ) : (
              <Button variant="disabled" className="w-full py-4 bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600">
                已領取完畢
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;