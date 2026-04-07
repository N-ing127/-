import React from 'react';
import { X, MapPin, Clock, Utensils, Tag, Info, User, Share2, CalendarDays, Hourglass, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import { LOCATIONS } from '../../data/constants';

const PostDetailModal = ({ selectedPost, setSelectedPost, triggerToast, onTaken, onReserve, onShare }) => {
  if (!selectedPost) return null;

  const location = LOCATIONS.find(loc => loc.id === selectedPost.locationId);

  const pickupTime = new Date(selectedPost.pickupTime);
  const expireTime = new Date(selectedPost.expireTime);
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
  const isReserved = selectedPost.status === 'reserved';
  const isTaken = selectedPost.status === 'taken';

  const handleTakenClick = () => {
    if (window.confirm('確定要領取這份惜食嗎？')) {
      onTaken(selectedPost);
    }
  };

  const handleReserveClick = () => {
    if (window.confirm('確定要預訂這份惜食嗎？')) {
      onReserve(selectedPost);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-stone-50 dark:bg-zinc-950 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <button onClick={() => setSelectedPost(null)} className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-gray-600 transition-colors z-10">
          <X className="w-5 h-5" />
        </button>

        {/* 圖片區域 */}
        <div className="relative h-64 w-full bg-gradient-to-br from-emerald-200 to-teal-300 dark:from-zinc-800 dark:to-zinc-900 overflow-hidden">
          {selectedPost.imageUrl && (
            <img src={selectedPost.imageUrl} alt={selectedPost.foodType} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          
          {isExpired && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-2xl font-black">已截止</div>}
          {isTaken && <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/80 text-white text-2xl font-black"><CheckCircle2 className="w-8 h-8 mr-3"/>已領取</div>}
          {isReserved && !isTaken && !isExpired && (
            <div className="absolute inset-0 flex items-center justify-center bg-amber-500/80 text-white text-2xl font-black">已預訂</div>
          )}

          {/* 分享按鈕 */}
          {!isExpired && !isTaken && (
            <button 
              onClick={() => onShare(selectedPost)} 
              className="absolute top-5 left-5 p-2 rounded-full bg-white/20 backdrop-blur-md text-white shadow-md hover:bg-white/30 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}

          <div className="absolute bottom-5 left-5 text-white">
            <h3 className="text-3xl font-black drop-shadow-lg">{selectedPost.foodType}</h3>
            <p className="text-emerald-100 text-sm drop-shadow-md">{selectedPost.quantity}{selectedPost.unit} | {selectedPost.tags.join(', ')}</p>
          </div>
        </div>

        {/* 內容區域 */}
        <div className="p-6 space-y-5 text-gray-800 dark:text-zinc-100">
          <div className="flex items-center gap-3 p-3 bg-stone-100 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-bold">{location?.name || '未知地點'}</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">{selectedPost.locationDetail}</p>
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
              <p className="text-xs text-red-500 dark:text-red-400 font-bold">{getTimeLeftString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-stone-100 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
            <User className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-bold text-sm">發布者</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{selectedPost.provider}</p>
            </div>
          </div>
          
          <div className="pt-4">
            {!isExpired && !isTaken && (
              <Button 
                onClick={selectedPost.status === 'available' ? handleReserveClick : handleTakenClick} 
                className="w-full py-4 text-lg font-black rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
              >
                {selectedPost.status === 'available' ? '預訂惜食' : '確認領取'}
              </Button>
            )}
            {(isExpired || isTaken) && (
              <Button disabled className="w-full py-4 text-lg font-black rounded-2xl bg-gray-300 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400">
                {isExpired ? '已截止' : '已領取'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;