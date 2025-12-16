import React, { useState } from 'react';
import { X, MapPin, User, Utensils, ChevronUp, ChevronDown } from 'lucide-react';
import { LOCATIONS, FOOD_TYPES } from '../data/constants';

const NotificationSettingsView = ({ setActiveTab }) => {
  const [subscribedLocs, setSubscribedLocs] = useState(['main_lib']); 
  const [subscribedUsers, setSubscribedUsers] = useState(['教務處陳幹事']);
  const [subscribedFoodTypes, setSubscribedFoodTypes] = useState(['會議茶點']);
  const [expandedSection, setExpandedSection] = useState('locations');
  
  const toggleSection = (section) => setExpandedSection(expandedSection === section ? null : section);
  const toggleItem = (list, setList, item) => list.includes(item) ? setList(list.filter(i=>i!==item)) : setList([...list, item]);

  const SubscriptionAccordion = ({ title, icon: Icon, count, isOpen, onToggle, children }) => (
    <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden mb-3 shadow-sm transition-all duration-300">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}><Icon className="w-5 h-5" /></div>
          <div className="text-left"><p className="font-bold text-gray-800">{title}</p><p className="text-xs text-gray-400">已訂閱 {count} 個</p></div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-300" /> : <ChevronDown className="w-5 h-5 text-gray-300" />}
      </button>
      {isOpen && <div className="p-4 bg-stone-50 border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">{children}</div>}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-stone-50 animate-in slide-in-from-right duration-300">
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-sm p-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => setActiveTab('home')} className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors"><X className="w-6 h-6 text-gray-500" /></button>
        <h2 className="text-lg font-bold text-gray-800">通知設定</h2>
      </div>
      <div className="p-4 overflow-y-auto pb-24">
        <SubscriptionAccordion title="地點通知" icon={MapPin} count={subscribedLocs.length} isOpen={expandedSection==='locations'} onToggle={()=>toggleSection('locations')}>
          <div className="grid grid-cols-1 gap-2">
            {LOCATIONS.map(loc => (
              <label key={loc.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-emerald-200 transition-all">
                <span className="text-gray-700 font-medium">{loc.name}</span>
                <input type="checkbox" checked={subscribedLocs.includes(loc.id)} onChange={()=>toggleItem(subscribedLocs, setSubscribedLocs, loc.id)} className="w-5 h-5 accent-emerald-600 rounded focus:ring-emerald-500"/>
              </label>
            ))}
          </div>
        </SubscriptionAccordion>
        
        <SubscriptionAccordion title="發布者通知" icon={User} count={subscribedUsers.length} isOpen={expandedSection==='users'} onToggle={()=>toggleSection('users')}>
          <div className="grid grid-cols-1 gap-2">
            {['教務處陳幹事', '資工系學會', '學務處', '總務處', '圖書館推廣組', '學生會'].map(user => (
              <label key={user} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-emerald-200 transition-all">
                <span className="text-gray-700 font-medium">{user}</span>
                <input type="checkbox" checked={subscribedUsers.includes(user)} onChange={()=>toggleItem(subscribedUsers, setSubscribedUsers, user)} className="w-5 h-5 accent-emerald-600 rounded focus:ring-emerald-500"/>
              </label>
            ))}
          </div>
        </SubscriptionAccordion>

        <SubscriptionAccordion title="種類通知" icon={Utensils} count={subscribedFoodTypes.length} isOpen={expandedSection==='foodTypes'} onToggle={()=>toggleSection('foodTypes')}>
          <div className="grid grid-cols-2 gap-2">
            {FOOD_TYPES.map(type => (
              <label key={type} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg cursor-pointer hover:border-emerald-200 transition-colors">
                <span className="text-gray-700 text-sm font-medium">{type}</span>
                <input type="checkbox" checked={subscribedFoodTypes.includes(type)} onChange={()=>toggleItem(subscribedFoodTypes, setSubscribedFoodTypes, type)} className="w-4 h-4 accent-emerald-600 rounded focus:ring-emerald-500"/>
              </label>
            ))}
          </div>
        </SubscriptionAccordion>
      </div>
    </div>
  );
};

export default NotificationSettingsView;