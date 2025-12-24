import React, { useState } from 'react';
import { 
  X, MapPin, User, Utensils, ChevronUp, ChevronDown, 
  ToggleRight, ToggleLeft, Bell, ArrowLeft 
} from 'lucide-react';
import { LOCATIONS, FOOD_TYPES } from '../data/constants';

const NotificationSettingsView = ({ setActiveTab, profile, setProfile }) => {
  // 預設展開「附近提醒」區塊
  const [expandedSection, setExpandedSection] = useState('nearby');
  
  // 切換「就在附近」主開關
  const toggleNearbyAlert = () => {
    setProfile(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        showNearbyAlert: !prev.settings?.showNearbyAlert
      }
    }));
  };

  // 通用的項目切換邏輯（適用於地點、食物種類、用戶）
  const toggleItem = (key, item) => {
    const currentList = profile.settings?.[key] || [];
    const newList = currentList.includes(item) 
      ? currentList.filter(i => i !== item) 
      : [...currentList, item];
    
    setProfile(prev => ({
      ...prev,
      settings: { 
        ...prev.settings, 
        [key]: newList 
      }
    }));
  };

  // 手風琴組件
  const SubscriptionAccordion = ({ title, icon: Icon, count, isOpen, onToggle, children }) => (
    <div className="border border-gray-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden mb-3 shadow-sm transition-all duration-300">
      <button 
        onClick={onToggle} 
        className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${isOpen ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 dark:text-zinc-100">{title}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">已選取 {count} 項</p>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-300" /> : <ChevronDown className="w-5 h-5 text-gray-300" />}
      </button>
      {isOpen && (
        <div className="p-4 bg-stone-50 dark:bg-zinc-950 border-t border-gray-50 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-zinc-950 animate-in slide-in-from-right duration-300 transition-colors">
      {/* 頂部導覽列 */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 p-4 pt-12 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => setActiveTab('profile')} className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-500 dark:text-zinc-400" />
        </button>
        <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100">通知與隱私</h2>
      </div>

      <div className="p-4 overflow-y-auto pb-24">
        {/* 1. 就在附近主開關 */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 shadow-sm mb-6 flex items-center justify-between transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl">
              <Bell className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-zinc-100">主動提醒「就在附近」</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">路過惜食點時跳出提醒</p>
            </div>
          </div>
          <button 
            onClick={toggleNearbyAlert} 
            className={`transition-all duration-300 ${profile.settings?.showNearbyAlert ? 'text-emerald-500' : 'text-gray-300 dark:text-zinc-700'}`}
          >
            {profile.settings?.showNearbyAlert ? <ToggleRight className="w-12 h-12" /> : <ToggleLeft className="w-12 h-12" />}
          </button>
        </div>

        {/* 2. 地點訂閱 */}
        <SubscriptionAccordion 
          title="地點訂閱" 
          icon={MapPin} 
          count={profile.settings?.subscribedLocs?.length || 0} 
          isOpen={expandedSection === 'locations'} 
          onToggle={() => setExpandedSection(expandedSection === 'locations' ? null : 'locations')}
        >
          <div className="grid grid-cols-1 gap-2">
            {LOCATIONS.map(loc => (
              <label key={loc.id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-900 transition-all">
                <span className="text-gray-700 dark:text-zinc-200 font-medium">{loc.name}</span>
                <input 
                  type="checkbox" 
                  checked={profile.settings?.subscribedLocs?.includes(loc.id)} 
                  onChange={() => toggleItem('subscribedLocs', loc.id)} 
                  className="w-5 h-5 accent-emerald-600 rounded"
                />
              </label>
            ))}
          </div>
        </SubscriptionAccordion>

        {/* 3. 食物種類訂閱 */}
        <SubscriptionAccordion 
          title="種類訂閱" 
          icon={Utensils} 
          count={profile.settings?.subscribedFoodTypes?.length || 0} 
          isOpen={expandedSection === 'foodTypes'} 
          onToggle={() => setExpandedSection(expandedSection === 'foodTypes' ? null : 'foodTypes')}
        >
          <div className="grid grid-cols-1 gap-2">
            {FOOD_TYPES.map(type => (
              <label key={type} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-900 transition-all">
                <span className="text-gray-700 dark:text-zinc-200 font-medium">{type}</span>
                <input 
                  type="checkbox" 
                  checked={profile.settings?.subscribedFoodTypes?.includes(type)} 
                  onChange={() => toggleItem('subscribedFoodTypes', type)} 
                  className="w-5 h-5 accent-emerald-600 rounded"
                />
              </label>
            ))}
          </div>
        </SubscriptionAccordion>

        {/* 4. 用戶訂閱 (示範靜態清單) */}
        <SubscriptionAccordion 
          title="用戶訂閱" 
          icon={User} 
          count={profile.settings?.subscribedUsers?.length || 0} 
          isOpen={expandedSection === 'users'} 
          onToggle={() => setExpandedSection(expandedSection === 'users' ? null : 'users')}
        >
          <div className="grid grid-cols-1 gap-2">
            {['全家便利商店', '7-Eleven', '學一舍餐廳'].map(user => (
              <label key={user} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-900 transition-all">
                <span className="text-gray-700 dark:text-zinc-200 font-medium">{user}</span>
                <input 
                  type="checkbox" 
                  checked={profile.settings?.subscribedUsers?.includes(user)} 
                  onChange={() => toggleItem('subscribedUsers', user)} 
                  className="w-5 h-5 accent-emerald-600 rounded"
                />
              </label>
            ))}
          </div>
        </SubscriptionAccordion>
      </div>
    </div>
  );
};

export default NotificationSettingsView;