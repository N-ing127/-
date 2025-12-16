import React, { useState } from 'react';
import { X, Camera, MapPin, Clock, Tag, Plus, CheckCircle, Calendar } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { LOCATIONS, FOOD_TYPES, PREDEFINED_TAGS } from '../data/constants';
import { getTodayDateString } from '../utils/helpers';

// 簽名修改：移除 posts, setPosts，改為接收 onCreatePost
const PostFoodView = ({ onCreatePost, setActiveTab, triggerToast }) => { 
  const [formData, setFormData] = useState({
    locationId: 'common_studies', locationDetail: '', foodType: FOOD_TYPES[0], quantity: '', unit: '份',
    date: getTodayDateString(), 
    pickupTimeStr: '12:00', expireTimeStr: '14:00',
    tags: [], imageUrl: null
  });
  const [customTagInput, setCustomTagInput] = useState('');
  const formInputStyle = "w-full p-3 bg-white/70 rounded-xl border-none shadow-inner shadow-gray-200/50 focus:ring-2 focus:ring-emerald-500 transition-all outline-none";

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) setFormData({ ...formData, imageUrl: URL.createObjectURL(file) });
  };

  const toggleTag = (tag) => {
    if (formData.tags.includes(tag)) setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
    else setFormData({ ...formData, tags: [...formData.tags, tag] });
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
    if (new Date(expireTimeStr) < new Date()) { triggerToast('截止時間已過', 'error'); return; } // 新增檢查

    const newPost = {
      id: 0, // Mock ID
      provider: '我 (當前使用者)', ...formData,
      startTime: new Date().toISOString(), pickupTime: startTimeStr, expireTime: expireTimeStr, 
      status: 'available', note: '', timestamp: Date.now(), imageColor: 'bg-emerald-100'
    };
    
    // 修正：直接呼叫 App.jsx 傳入的發布函數
    onCreatePost(newPost); 
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 animate-in fade-in">
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-lg p-4 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => setActiveTab('home')} className="p-2 -ml-2 rounded-full hover:bg-stone-100"><X className="w-6 h-6 text-gray-500" /></button>
        <h2 className="text-lg font-bold text-gray-800">分享食光</h2> 
        <div className="w-8"></div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="flex justify-center">
            <label className={`w-full h-56 rounded-[32px] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all overflow-hidden relative ${formData.imageUrl ? 'border-none shadow-xl shadow-emerald-100' : ''}`}>
              {formData.imageUrl ? (
                <div className="w-full h-full relative group">
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={(e) => {e.preventDefault(); setFormData({ ...formData, imageUrl: null });}} className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full shadow-lg hover:bg-red-600 z-10"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <><div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-3"><Camera className="w-8 h-8 text-emerald-500" /></div><span className="text-gray-500 font-medium">拍攝食物照片</span></>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          {/* Basic Info */}
          <div className="bg-white/60 backdrop-blur-sm p-5 rounded-3xl border border-white/50 shadow-lg space-y-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2"><MapPin className="w-5 h-5 text-emerald-600" /> 基本資訊</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-gray-500 mb-1 block">主要位置</label><select className={formInputStyle} value={formData.locationId} onChange={e => setFormData({...formData, locationId: e.target.value})}>{LOCATIONS.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-500 mb-1 block">詳細地點</label><input type="text" placeholder="例: B1 討論室" className={formInputStyle} value={formData.locationDetail} onChange={e => setFormData({...formData, locationDetail: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-gray-500 mb-1 block">種類</label><select className={formInputStyle} value={formData.foodType} onChange={e => setFormData({...formData, foodType: e.target.value})}>{FOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-500 mb-1 block">數量</label><div className="flex gap-2"><input type="number" min="1" placeholder="1" className={formInputStyle} value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} /><div className="flex items-center justify-center bg-white/50 border border-white/50 rounded-xl px-3 text-gray-500 text-sm font-bold shadow-inner">{formData.unit}</div></div></div>
            </div>
          </div>

          {/* Time Settings (包含日期選擇) */}
          <div className="bg-white/60 backdrop-blur-sm p-5 rounded-3xl border border-white/50 shadow-lg space-y-4">
            <h3 className="font-bold text-gray-700 flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500" /> 時間設定</h3>
            
            {/* 新增：日期選擇器 */}
            <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-white/50 shadow-inner">
                <span className="text-sm text-gray-600 font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600"/> 分享日期
                </span>
                <input 
                    type="date" 
                    min={getTodayDateString()} 
                    className="bg-transparent font-bold text-gray-700 focus:outline-none text-base cursor-pointer" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                />
            </div>

            <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-white/50 shadow-inner">
              <span className="text-sm text-gray-600 font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> 開放領取</span>
              <input type="time" className="bg-transparent font-bold text-emerald-700 focus:outline-none text-lg cursor-pointer" value={formData.pickupTimeStr} onChange={e => setFormData({...formData, pickupTimeStr: e.target.value})} />
            </div>
            <div className="flex justify-center -my-2 opacity-30"><div className="w-0.5 h-4 bg-gray-400"></div></div>
            <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-white/50 shadow-inner">
              <span className="text-sm text-gray-600 font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> 截止時間</span>
              <input type="time" className="bg-transparent font-bold text-red-500 focus:outline-none text-lg cursor-pointer" value={formData.expireTimeStr} onChange={e => setFormData({...formData, expireTimeStr: e.target.value})} />
            </div>
          </div>

          {/* Tags */}
          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-emerald-600" /> 其他備註標籤</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {PREDEFINED_TAGS.map(tag => {
                const isSelected = formData.tags.includes(tag);
                return <Badge key={tag} color={isSelected ? 'selected' : 'gray'} onClick={() => toggleTag(tag)} isInteractive={true}>{tag}{isSelected && <CheckCircle className="w-3 h-3 inline ml-1" />}</Badge>;
              })}
            </div>
            <div className="flex gap-2">
              <input type="text" placeholder="自訂標籤" className={`${formInputStyle} flex-1`} value={customTagInput} onChange={e => setCustomTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())} />
              <button type="button" onClick={addCustomTag} className="bg-white hover:bg-gray-100 text-gray-600 px-4 py-2 rounded-xl shadow-sm transition-colors border border-gray-100"><Plus className="w-5 h-5" /></button>
            </div>
            {formData.tags.filter(t => !PREDEFINED_TAGS.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-gray-50 rounded-xl">
                {formData.tags.filter(t => !PREDEFINED_TAGS.includes(t)).map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                    {tag} <button type="button" onClick={() => toggleTag(tag)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full py-4 text-lg">發布食光</Button>
        </form>
      </div>
    </div>
  );
};

export default PostFoodView;