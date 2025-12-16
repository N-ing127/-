import React, { useState, useEffect } from 'react';
import { Filter, X, CheckCircle } from 'lucide-react';
import { FOOD_TYPES, PREDEFINED_TAGS } from '../../data/constants';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const FilterModal = ({ show, onClose, initialState, onApply }) => {
  // 本地狀態：用於在 Modal 內部暫存使用者的選擇
  const [localFilters, setLocalFilters] = useState(initialState);

  // 當 Modal 開啟或初始狀態改變時，同步本地狀態
  useEffect(() => {
    setLocalFilters(initialState);
  }, [initialState, show]);

  if (!show) return null;

  // 處理標籤與種類的多選切換
  const toggleChip = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) 
        ? prev[key].filter(v => v !== value) 
        : [...prev[key], value]
    }));
  };

  // 套用變更並關閉
  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  // 重設所有篩選條件
  const handleReset = () => {
    const resetState = { selectedTypes: [], selectedTags: [], minQuantity: 1 };
    onApply(resetState);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center p-0">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* 玻璃擬態底部面板 */}
      <div className={`
        bg-white/80 backdrop-blur-3xl w-full max-w-md rounded-t-[32px] 
        border border-white/60 shadow-2xl shadow-black/20 relative z-10
        animate-in slide-in-from-bottom duration-300
        flex flex-col h-[70vh] sm:h-auto sm:max-h-[80vh] overflow-hidden
      `}>
        
        {/* 頂部標題與拉條 */}
        <div className="p-5 border-b border-white/50 sticky top-0 bg-white/50 backdrop-blur-sm">
          <div className="mx-auto w-10 h-1.5 bg-gray-300 rounded-full mb-3"></div>
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
               <Filter className="w-5 h-5 text-emerald-600" /> 食光進階篩選
             </h2>
             <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
               <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* 篩選內容區 (可滾動) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* 1. 食物種類 */}
          <div>
            <h3 className="font-bold text-gray-700 mb-3 text-sm">依食物種類</h3>
            <div className="flex flex-wrap gap-2">
              {FOOD_TYPES.map(type => {
                const isSelected = localFilters.selectedTypes.includes(type);
                return (
                  <Badge 
                    key={type} 
                    color={isSelected ? 'selected' : 'gray'} 
                    onClick={() => toggleChip('selectedTypes', type)} 
                    isInteractive={true}
                  >
                    {type}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* 2. 標籤篩選 */}
          <div>
            <h3 className="font-bold text-gray-700 mb-3 text-sm">依標籤特徵</h3>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map(tag => {
                const isSelected = localFilters.selectedTags.includes(tag);
                return (
                  <Badge 
                    key={tag} 
                    color={isSelected ? 'selected' : 'blue'} 
                    onClick={() => toggleChip('selectedTags', tag)} 
                    isInteractive={true}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* 3. 最小數量滑桿 */}
          <div>
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-gray-700 text-sm">最小剩餘數量</h3>
               <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded text-xs">
                 至少 {localFilters.minQuantity} 份
               </span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={localFilters.minQuantity} 
              onChange={e => setLocalFilters(prev => ({...prev, minQuantity: parseInt(e.target.value)}))} 
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-bold px-1">
               <span>1</span>
               <span>5</span>
               <span>10+</span>
            </div>
          </div>
        </div>

        {/* 底部按鈕區 */}
        <div className="p-5 border-t border-white/50 sticky bottom-0 bg-white/90 backdrop-blur-lg grid grid-cols-2 gap-3">
          <Button onClick={handleReset} variant="ghost" className="py-3 text-sm">
            <X className="w-4 h-4 mr-1"/> 重設
          </Button>
          <Button onClick={handleApply} variant="primary" className="py-3 text-sm">
            <CheckCircle className="w-4 h-4 mr-1"/> 套用篩選
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;