import React, { useState, useEffect } from 'react';
import { Filter, X, CheckCircle } from 'lucide-react';
import { FOOD_TYPES, PREDEFINED_TAGS } from '../../data/constants';
import Button from '../ui/Button';

const FilterModal = ({ show, onClose, initialState, onApply }) => {
  const [localFilters, setLocalFilters] = useState(initialState);

  useEffect(() => {
    setLocalFilters(initialState);
  }, [initialState, show]);

  if (!show) return null;

  const toggleChip = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value) 
        ? prev[key].filter(v => v !== value) 
        : [...prev[key], value]
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetState = { selectedTypes: [], selectedTags: [], minQuantity: 1 };
    onApply(resetState);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center p-0">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* 玻璃擬態底部面板 */}
      <div className={`
        bg-white/90 dark:bg-zinc-900/90 backdrop-blur-3xl w-full max-w-md rounded-t-[32px] 
        border border-white/60 dark:border-zinc-800 shadow-2xl relative z-10
        animate-in slide-in-from-bottom duration-300
        flex flex-col h-[70vh] sm:h-auto sm:max-h-[80vh] overflow-hidden
      `}>
        
        {/* 頂部標題與拉條 */}
        <div className="p-5 border-b border-white/50 dark:border-zinc-800 sticky top-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
          <div className="mx-auto w-10 h-1.5 bg-gray-300 dark:bg-zinc-700 rounded-full mb-3"></div>
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-black text-gray-800 dark:text-zinc-100 flex items-center gap-2">
               <Filter className="w-5 h-5 text-emerald-600" /> 食光篩選
             </h2>
             <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full text-gray-500 dark:text-zinc-400 transition-colors">
               <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* 篩選內容區 (可滾動) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-8">
          
          {/* 1. 食物種類 */}
          <div>
            <h3 className="font-bold text-gray-700 dark:text-zinc-300 mb-4 text-sm flex items-center gap-2">依食物種類</h3>
            <div className="flex flex-wrap gap-2">
              {FOOD_TYPES.map(type => {
                const isSelected = localFilters.selectedTypes.includes(type);
                return (
                  <button 
                    key={type} 
                    onClick={() => toggleChip('selectedTypes', type)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      isSelected 
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                        : 'bg-gray-100 dark:bg-zinc-800 border-transparent dark:border-zinc-700 text-gray-500 dark:text-zinc-400'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 標籤篩選 */}
          <div>
            <h3 className="font-bold text-gray-700 dark:text-zinc-300 mb-4 text-sm flex items-center gap-2">依標籤特徵</h3>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map(tag => {
                const isSelected = localFilters.selectedTags.includes(tag);
                return (
                  <button 
                    key={tag} 
                    onClick={() => toggleChip('selectedTags', tag)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30' 
                        : 'bg-gray-100 dark:bg-zinc-800 border-transparent dark:border-zinc-700 text-gray-500 dark:text-zinc-400'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 最小數量滑桿 */}
          <div className="pb-4">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-gray-700 dark:text-zinc-300 text-sm">最小剩餘數量</h3>
               <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-lg text-xs border border-emerald-100 dark:border-emerald-800">
                 至少 {localFilters.minQuantity} 份
               </span>
            </div>
            <div className="px-2">
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={localFilters.minQuantity} 
                onChange={e => setLocalFilters(prev => ({...prev, minQuantity: parseInt(e.target.value)}))} 
                className="w-full h-2 bg-gray-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-600 mt-3 font-bold">
                 <span>1 份</span>
                 <span>5 份</span>
                 <span>10+ 份</span>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按鈕區 */}
        <div className="p-5 border-t border-white/50 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-lg grid grid-cols-2 gap-3">
          <Button onClick={handleReset} variant="ghost" className="py-3 text-sm dark:text-zinc-400">
            重設
          </Button>
          <Button onClick={handleApply} variant="primary" className="py-3 text-sm">
            套用篩選
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;