import React from 'react';
import { formatDisplayTime, calculateWalkingTime } from '../../utils/helpers';
import Button from '../ui/Button';

// 此組件將作為 <Popup> 的子元件，渲染其內容
// post 已經過 LeafletMap 處理，包含了 distance 屬性
const MapPostPopup = React.memo(({ post, locationName }) => {
    // 假設 post.distance 已經在 LeafletMap 內計算完成
    const displayTime = formatDisplayTime(post.expireTime);
    const walkingTime = calculateWalkingTime(post.distance); 

    // 通過點擊隱藏的 DOM 元素 ('map-popup-detail') 來觸發 LeafletMap 中定義的 setSelectedPost
    // 這是 Leaflet Popup 解決 React 狀態問題的常見橋接模式。
    const handleViewDetailClick = () => {
        const trigger = document.getElementById(`map-popup-detail-${post.id}`);
        if (trigger) {
            trigger.click();
        }
    };

    return (
        <div className={`
            w-60 p-4 rounded-xl border border-white/60 shadow-xl shadow-emerald-200/50 
            bg-white/80 backdrop-blur-lg 
            transition-all duration-300
        `}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                <h5 className="text-sm font-black text-gray-800 line-clamp-1">{post.foodType}</h5>
                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                    剩 {post.quantity}{post.unit}
                </span>
            </div>

            <div className="space-y-1 text-xs text-gray-600">
                <p className="font-medium truncate">地點: {locationName}</p>
                <p className="text-red-500 font-bold">截止: {displayTime}</p>
                <p className="text-emerald-600">步行約 {walkingTime} 分鐘</p>
            </div>
            
            {/* 觸發橋接點 */}
            <Button 
                onClick={handleViewDetailClick} 
                variant='outline' 
                className='w-full mt-3 py-2 text-xs' 
            > 
                查看詳情 
            </Button>
        </div>
    );
});

export default MapPostPopup;