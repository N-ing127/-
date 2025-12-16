import React from 'react';
import { Bell, X, Navigation, ChevronRight, Utensils } from 'lucide-react';
import { LOCATIONS } from '../../data/constants'; 
import { calculateWalkingTime } from '../../utils/helpers';
import Button from '../ui/Button'; 

const ProximityAlertBar = React.memo(({ post, onTake, onDetail, onClose }) => {
  const locationName = LOCATIONS.find(l => l.id === post.locationId)?.name || '未知地點';
  const walkingTime = calculateWalkingTime(post.distance);

  return (
    <div className={`
        mx-4 mt-4 p-4 rounded-2xl z-20 relative
        bg-gradient-to-r from-white/95 via-emerald-50/90 to-white/95 backdrop-blur-xl 
        border border-white/60 shadow-xl shadow-emerald-500/20
        animate-in slide-in-from-top-4 duration-500 ease-out
    `}>
      {/* 裝飾光暈 */}
      <div className="absolute -left-2 -top-2 w-20 h-20 bg-emerald-400/20 blur-3xl rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-emerald-600 animate-[wiggle_1s_ease-in-out_infinite]" strokeWidth={2.5} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white animate-ping"></span>
          </div>
          <span className="text-sm font-black text-gray-800 tracking-wide">就在附近！</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className="p-1 -mr-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all active:scale-95"
        >
          <X className="w-4 h-4"/>
        </button>
      </div>

      {/* Body: 食物資訊 */}
      <div className="flex items-center gap-3 mb-3 cursor-pointer relative z-10" onClick={() => onDetail(post)}>
        <div className={`w-12 h-12 rounded-xl shrink-0 ${post.imageUrl ? '' : post.imageColor} overflow-hidden shadow-sm border border-white flex items-center justify-center`}>
            {post.imageUrl ? (
                <img src={post.imageUrl} alt="food" className="w-full h-full object-cover" />
            ) : (
                <Utensils className="w-6 h-6 text-white/70" />
            )}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-800 truncate">{post.foodType}</h4>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold mt-0.5">
                <Navigation className="w-3 h-3 fill-current"/>
                <span>{locationName} · 步行約 {walkingTime} 分 ({post.distance}m)</span>
            </div>
        </div>
        <div className="shrink-0 bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-lg">
            剩 {post.quantity}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 relative z-10">
        <Button 
            variant="ghost" 
            onClick={() => onDetail(post)}
            className="py-2 text-xs h-9 bg-white/50 border border-emerald-100 hover:bg-white"
        >
            查看詳情
        </Button>
        <Button 
            variant="primary" 
            onClick={() => onTake(post)}
            className="py-2 text-xs h-9 shadow-emerald-200"
        >
            前往領取 <ChevronRight className="w-3 h-3 ml-1"/>
        </Button>
      </div>
    </div>
  );
});

export default ProximityAlertBar;