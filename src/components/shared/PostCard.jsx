import React, { useState } from 'react';
import { MapPin, User, Clock, Flame, CheckCircle, Bookmark, Utensils, Navigation } from 'lucide-react';
import { LOCATIONS } from '../../data/constants';
import { formatDisplayTime, calculateWalkingTime } from '../../utils/helpers';

const PostCard = React.memo(({ post, distance, onClick }) => {
  const isPinned = post.status !== 'available';
  const locationName = LOCATIONS.find(l => l.id === post.locationId)?.name || '未知地點';
  const isPickupStarted = post.pickupTime && new Date(post.pickupTime) < new Date();

  // Tooltip 狀態和步行時間計算
  const [showTooltip, setShowTooltip] = useState(false);
  const walkingTime = calculateWalkingTime(distance);

  let StatusIcon = null;
  let statusBg = '';
  
  if (post.status === 'taken') {
    StatusIcon = CheckCircle;
    statusBg = 'bg-gray-900/40';
  } else if (post.status === 'reserved') {
    StatusIcon = Bookmark;
    statusBg = 'bg-emerald-900/40';
  }

  return (
    <div 
      onClick={onClick}
      className={`
        relative bg-white/80 backdrop-blur-sm border border-white/40 rounded-[24px] p-0 flex h-36 shadow-lg shadow-gray-200/30 cursor-pointer
        transition-all duration-300 hover:bg-white hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-white/80 active:scale-[0.98]
        /* 修正 1: 移除了 overflow-hidden，讓 Tooltip 可以顯示在卡片外面 */
      `}
    >
      {/* 狀態遮罩 (配合圓角) */}
      {isPinned && (
        <div className={`absolute inset-0 z-20 ${statusBg} backdrop-blur-[2px] rounded-[24px] flex items-center justify-center transition-all duration-500`}>
          <div className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/50 shadow-2xl">
             <StatusIcon className="w-8 h-8 text-white drop-shadow-md" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* 圖片區域 */}
      <div className="w-1/3 relative bg-gray-100 rounded-l-[24px]">
        {post.imageUrl ? (
          /* 修正 2: 圖片手動加上左側圓角 */
          <img src={post.imageUrl} alt="food" className="w-full h-full object-cover rounded-l-[24px]" />
        ) : (
          /* 修正 3: 佔位圖也加上左側圓角 */
          <div className={`w-full h-full flex items-center justify-center rounded-l-[24px] ${post.imageColor}`}>
            <Utensils className="w-8 h-8 text-white opacity-50" />
          </div>
        )}
        
        {/* 左上：距離標籤 (包含 Glass Popover 互動) */}
        <div 
          className="absolute top-2 left-2 z-[30]" // 提高 Z-index
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={(e) => {
            e.stopPropagation(); 
            setShowTooltip(prev => !prev);
          }}
          onTouchStart={() => setShowTooltip(true)}
          onTouchEnd={() => setTimeout(() => setShowTooltip(false), 2000)}
        >
          {/* Tooltip Popover 內容 */}
          {showTooltip && (
            <div className="absolute left-0 bottom-full mb-2 w-max max-w-[150px] p-3 rounded-xl bg-white/95 backdrop-blur-md shadow-xl shadow-gray-500/20 border border-white/60 animate-in fade-in slide-in-from-bottom-2 duration-200 z-[100]">
               <p className="text-xs font-bold text-gray-800 line-clamp-1 mb-1">{locationName}</p>
               <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600">
                  <Navigation className="w-3 h-3 fill-current" /> 
                  <span>步行約 {walkingTime} 分</span>
               </div>
               
               {/* 裝飾性的小箭頭 */}
               <div className="absolute -bottom-[5px] left-3 w-3 h-3 bg-white/95 border-r border-b border-white/60 transform rotate-45"></div>
            </div>
          )}

          {/* 距離徽章本體 */}
          <span className="bg-white/90 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-lg text-gray-600 shadow-sm border border-white/60 cursor-pointer hover:bg-white transition-colors">
            {distance}m
          </span>
        </div>

        {/* 右上：數量 */}
        {!isPinned && (
          <div className="absolute top-2 right-2">
            <span className="bg-orange-500/90 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-lg text-white shadow-sm border border-white/20">
              剩 {post.quantity}
            </span>
          </div>
        )}
      </div>

      {/* 內容區域 */}
      <div className="w-2/3 p-4 flex flex-col justify-between relative z-10">
        <div>
          <h4 className="font-bold text-gray-800 text-lg leading-tight line-clamp-1">{post.foodType}</h4>
          
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{locationName}</span>
          </div>

          <div className="flex gap-1 mt-2 flex-wrap">
            {post.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] bg-stone-100 text-gray-500 px-2 py-0.5 rounded-md">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-end border-t border-gray-50 pt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 text-gray-500" />
            </div>
            <span className="text-xs text-gray-400 truncate max-w-[80px]">{post.provider}</span>
          </div>
          
          {!isPinned && (
            <div className="flex flex-col items-end">
              {post.pickupTime && !isPickupStarted ? (
                <div className="flex items-center gap-1 text-emerald-600 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">
                  <Clock className="w-3 h-3" />
                  {formatDisplayTime(post.pickupTime)} 開放
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-500 font-bold text-xs">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  {formatDisplayTime(post.expireTime)} 截止
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default PostCard;