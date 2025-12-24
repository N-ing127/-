import React, { useState } from 'react';
import { Camera, MapPin, Utensils, Tag, Info, Clock, ChevronLeft, X, Calendar, Plus, CheckCircle, Image as ImageIcon } from 'lucide-react';
import Button from '../components/ui/Button';
import { LOCATIONS, FOOD_TYPES, PREDEFINED_TAGS } from '../data/constants';
import { getTodayDateString } from '../utils/helpers';

const PostFoodView = ({ onCreatePost, setActiveTab, triggerToast }) => { 
  const [formData, setFormData] = useState({
    locationId: 'common_studies', 
    locationDetail: '', 
    foodType: FOOD_TYPES[0], 
    quantity: '', 
    unit: '份',
    date: getTodayDateString(), 
    pickupTimeStr: '12:00', 
    expireTimeStr: '14:00',
    tags: [], 
    imageUrl: null
  });

  const [customTagInput, setCustomTagInput] = useState('');

  const formInputStyle = "w-full p-3 bg-white/70 dark:bg-zinc-900/70 rounded-xl border border-transparent dark:border-zinc-800 shadow-inner text-gray-800 dark:text-zinc-200 focus:ring-2 focus:ring-emerald-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-zinc-600";

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setFormData({ ...formData, imageUrl: objectUrl });
    }
  };

  const toggleTag = (tag) => {
    if (formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    } else {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const addCustomTag = () => {
    if (customTagInput.trim() && !formData.tags.includes(customTagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, customTagInput.trim()] });
      setCustomTagInput('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const startTimeStr = `${formData.date}T${formData.pickupTimeStr}`;
    const expireTimeStr = `${formData.date}T${formData.expireTimeStr}`;

    if (!formData.imageUrl) { triggerToast('請上傳照片', 'error'); return; }
    if (!formData.locationDetail) { triggerToast('請填寫詳細地點', 'error'); return; }
    if (parseInt(formData.quantity) <= 0) { triggerToast('數量必須大於 0', 'error'); return; }
    if (new Date(startTimeStr) >= new Date(expireTimeStr)) { triggerToast('領取時間必須早於截止時間', 'error'); return; }
    if (new Date(expireTimeStr) < new Date()) { triggerToast('截止時間已過', 'error'); return; }

    const newPost = {
      id: Date.now(),
      provider: '當前使用者', 
      ...formData,
      startTime: new Date().toISOString(), 
      pickupTime: startTimeStr, 
      expireTime: expireTimeStr, 
      status: 'available', 
      note: '', 
      timestamp: Date.now(), 
      imageColor: 'bg-emerald-100'
    };
    
    onCreatePost(newPost); 
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-zinc-950 transition-colors">
      {/* 頂部導覽列 */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-zinc-800 p-4 pt-12 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => setActiveTab('home')} className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors">
          <X className="w-6 h-6 text-gray-500 dark:text-zinc-400" />
        </button>
        <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100">發布惜食</h2> 
        <div className="w-8"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 圖片上傳區域優化 */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700 dark:text-zinc-300 ml-1">食物照片</label>
            <div className={`relative h-64 rounded-[32px] border-2 border-dashed transition-all duration-300 overflow-hidden ${formData.imageUrl ? 'border-transparent shadow-xl' : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}>
              {formData.imageUrl ? (
                <>
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover animate-in fade-in zoom-in duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                  <button 
                    type="button" 
                    onClick={(e) => {e.preventDefault(); setFormData({ ...formData, imageUrl: null });}} 
                    className="absolute top-4 right-4 p-2.5 bg-red-500/90 backdrop-blur-md text-white rounded-full shadow-lg hover:bg-red-600 active:scale-90 transition-all z-20"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-4 left-6 text-white font-bold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> 圖片已備齊
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/20 group">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Camera className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-gray-500 dark:text-zinc-500 font-bold text-sm">點擊或拖放照片</span>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-1 uppercase tracking-widest">JPG, PNG up to 5MB</p>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* 基本資訊區塊 */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2 text-sm uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-emerald-500" /> 地點資訊
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 px-1">系館/地標</label>
                <select className={formInputStyle} value={formData.locationId} onChange={e => setFormData({...formData, locationId: e.target.value})}>
                  {LOCATIONS.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 px-1">詳細位置描述</label>
                <input type="text" placeholder="例: 2樓電梯門口桌上" className={formInputStyle} value={formData.locationDetail} onChange={e => setFormData({...formData, locationDetail: e.target.value})} />
              </div>
            </div>
          </div>

          {/* 食物細節 */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Utensils className="w-4 h-4 text-orange-500" /> 食物詳情
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 px-1">種類</label>
                <select className={formInputStyle} value={formData.foodType} onChange={e => setFormData({...formData, foodType: e.target.value})}>
                  {FOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 dark:text-zinc-500 px-1">份量</label>
                <div className="relative">
                  <input type="number" min="1" placeholder="1" className={formInputStyle} value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                    {formData.unit}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 時間設定 */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-800 dark:text-zinc-100 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Clock className="w-4 h-4 text-blue-500" /> 時間範圍
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800">
                <span className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-tighter">分享日期</span>
                <input type="date" min={getTodayDateString()} className="bg-transparent font-bold text-gray-800 dark:text-zinc-100 text-sm focus:outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800">
                <span className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-tighter">開始領取</span>
                <input type="time" className="bg-transparent font-bold text-emerald-600 dark:text-emerald-400 text-lg focus:outline-none" value={formData.pickupTimeStr} onChange={e => setFormData({...formData, pickupTimeStr: e.target.value})} />
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800">
                <span className="text-xs font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-tighter">截止時間</span>
                <input type="time" className="bg-transparent font-bold text-red-500 dark:text-red-400 text-lg focus:outline-none" value={formData.expireTimeStr} onChange={e => setFormData({...formData, expireTimeStr: e.target.value})} />
              </div>
            </div>
          </div>

          {/* 標籤區塊 */}
          <div className="px-1 pt-2">
            <label className="block text-xs font-bold text-gray-400 dark:text-zinc-500 mb-4 uppercase tracking-widest flex items-center gap-2">
              <Tag className="w-3 h-3" /> 備註與標籤
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {PREDEFINED_TAGS.map(tag => {
                const isSelected = formData.tags.includes(tag);
                return (
                  <button 
                    key={tag} 
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 ${
                      isSelected 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                        : 'bg-white dark:bg-zinc-900 text-gray-500 dark:text-zinc-400 border border-gray-100 dark:border-zinc-800'
                    }`}
                  >
                    {tag}{isSelected && <CheckCircle className="w-3 h-3 inline ml-1.5" />}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="新增自訂標籤..." 
                className={`${formInputStyle} flex-1`} 
                value={customTagInput} 
                onChange={e => setCustomTagInput(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())} 
              />
              <button 
                type="button" 
                onClick={addCustomTag} 
                className="bg-emerald-500 text-white p-3 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full py-5 text-lg font-black rounded-3xl shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all">
              確認發布食光
            </Button>
            <p className="text-center text-[10px] text-gray-400 dark:text-zinc-600 mt-4 px-8">
              發布即代表您確認提供之食物品質安全，並願意分享給校園夥伴。
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostFoodView;