import React from 'react';
import { Home, Plus, User } from 'lucide-react';

const FloatingNav = ({ activeTab, setActiveTab }) => {
  // 輔助函式：側邊按鈕樣式 (保留文字標籤)
  const getNavItemClass = (isActive) =>
    `flex flex-col items-center justify-center gap-1 transition-all duration-300 w-16 ${
      isActive 
        ? 'text-emerald-600 scale-105' 
        : 'text-slate-400 hover:text-slate-600'
    }`;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-[360px] z-[1500]">
      {/* 步驟一：升級導航欄主體 (Liquid Glass Body)
         - backdrop-blur-3xl: 極致模糊
         - hover:scale-[1.02]: 懸浮時整體微放大 (Micro-interaction)
         - ring/border: 增加玻璃邊緣的銳利度
      */}
      <nav className="
        bg-white/60 backdrop-blur-3xl 
        border border-white/50 ring-1 ring-white/80 
        rounded-[32px] 
        shadow-2xl shadow-emerald-500/20 
        flex justify-between items-center px-6 py-3 
        relative overflow-visible transition-all duration-500 ease-out
        hover:scale-[1.02] hover:shadow-emerald-500/30
      ">
        
        {/* 背景流光 (增強液態感) */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50/30 to-transparent opacity-50 pointer-events-none rounded-[32px]"></div>
        
        {/* 左側：主頁 */}
        <button 
          onClick={() => setActiveTab('home')} 
          className={getNavItemClass(activeTab === 'home')}
        >
          <Home className="w-6 h-6" strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">主頁</span>
        </button>
        
        {/* 步驟二：增強中央 + 按鈕微互動 
           - relative -top-6: 懸浮凸起設計
           - group-hover:rotate-90: 懸浮時旋轉動畫
           - shadow-emerald-500/40: 強烈的光暈
        */}
        <button onClick={() => setActiveTab('post')} className="relative -top-6 group">
          <div className={`
            w-14 h-14 rounded-full flex items-center justify-center 
            shadow-lg shadow-emerald-500/40 transition-all duration-500 
            group-hover:scale-110 group-hover:rotate-90 group-active:scale-95 
            bg-gradient-to-tr from-emerald-500 to-teal-400 border-4 border-stone-50
          `}>
            <Plus className="w-7 h-7 text-white" strokeWidth={3} />
          </div>
          {/* 因為按鈕懸浮，文字標籤可選擇隱藏或放在按鈕下方(這裡為了視覺潔淨暫不顯示文字) */}
        </button>

        {/* 右側：個人 */}
        <button 
          onClick={() => setActiveTab('profile')} 
          className={getNavItemClass(activeTab === 'profile')}
        >
          <User className="w-6 h-6" strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
          <span className="text-[10px] font-bold">個人</span>
        </button>

      </nav>
    </div>
  );
};

export default FloatingNav;