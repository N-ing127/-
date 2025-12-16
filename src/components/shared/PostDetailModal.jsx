import React from 'react';
import { X, Utensils, Clock, Flame, MapPin, Bookmark, CheckCircle } from 'lucide-react';
import { LOCATIONS } from '../../data/constants';
import { formatDisplayTime } from '../../utils/helpers';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const PostDetailModal = ({ selectedPost, setSelectedPost, triggerToast, onTaken, onReserve }) => {
  if (!selectedPost) return null;
  const isAvailable = selectedPost.status === 'available';
  const isReserved = selectedPost.status === 'reserved';

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)}></div>
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative z-10 animate-in slide-in-from-bottom duration-300">
        
        <button onClick={() => setSelectedPost(null)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 z-20 backdrop-blur">
          <X className="w-5 h-5" />
        </button>
        
        <div className={`h-64 relative bg-gray-100 ${!selectedPost.imageUrl && selectedPost.imageColor}`}>
           {selectedPost.imageUrl ? (
             <img src={selectedPost.imageUrl} className="w-full h-full object-cover" alt="food" />
           ) : (
             <div className="w-full h-full flex items-center justify-center"><Utensils className="w-16 h-16 text-white/50"/></div>
           )}
           <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
              <h2 className="text-3xl font-bold text-white">{selectedPost.foodType}</h2>
              <p className="text-emerald-300 font-bold text-lg">剩餘 {selectedPost.quantity} {selectedPost.unit}</p>
           </div>
        </div>

        <div className="p-6 space-y-6">
           <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1"><Clock className="w-4 h-4"/> {formatDisplayTime(selectedPost.pickupTime)} 開放</div>
              <div className="flex items-center gap-1 text-red-500 font-bold"><Flame className="w-4 h-4"/> {formatDisplayTime(selectedPost.expireTime)} 截止</div>
           </div>

           <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-600 mt-1 shrink-0"/>
              <div>
                 <div className="font-bold text-gray-800">{LOCATIONS.find(l => l.id === selectedPost.locationId).name}</div>
                 <div className="text-sm text-gray-500 mt-1">{selectedPost.locationDetail}</div>
              </div>
           </div>

           <div className="flex flex-wrap gap-2">
              {selectedPost.tags && selectedPost.tags.map(tag => (
                  <Badge key={tag} color="blue">{tag}</Badge>
              ))}
           </div>

           {isAvailable ? (
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => onReserve(selectedPost)} variant="secondary" className="py-4 rounded-2xl shadow-orange-100">
                <Bookmark className="w-5 h-5" /> 預訂
              </Button>
              <Button onClick={() => onTaken(selectedPost)} variant="primary" className="py-4 rounded-2xl shadow-emerald-100">
                <CheckCircle className="w-5 h-5" /> 已領取
              </Button>
            </div>
          ) : isReserved ? (
             <div className="bg-blue-50 p-4 rounded-2xl text-center">
                <p className="text-blue-600 font-bold mb-3">已為您保留！請盡快前往</p>
                <Button onClick={() => onTaken(selectedPost)} variant="primary" className="w-full">確認領取</Button>
             </div>
          ) : (
            <div className="text-center text-gray-400 font-bold py-3 bg-gray-100 rounded-2xl">已結束</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;