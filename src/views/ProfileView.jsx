import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Settings, Camera, Award, Leaf, X, Save, 
  Megaphone, Moon 
} from 'lucide-react';
import { ACHIEVEMENTS_DATA } from '../data/constants';
import AnimatedStatCard from '../components/shared/AnimatedStatCard';

// Icon 映射表
const ICON_MAP = {
  'Megaphone': Megaphone,
  'Leaf': Leaf,
  'Award': Award,
  'Moon': Moon
};

const ProfileView = ({ setActiveTab, profile, setProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // 本地編輯狀態
  const [editData, setEditData] = useState({
    name: profile.name,
    department: profile.department,
    banner: profile.banner,
    avatar: profile.avatar
  });

  // 同步 Profile 數據
  useEffect(() => {
    setEditData({
      name: profile.name,
      department: profile.department,
      banner: profile.banner,
      avatar: profile.avatar
    });
  }, [profile]);

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setEditData(prev => ({ ...prev, [type]: objectUrl }));
    }
  };

  const handleSave = () => {
    setProfile(prev => ({
      ...prev,
      name: editData.name,
      department: editData.department,
      banner: editData.banner,
      avatar: editData.avatar
    }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: profile.name,
      department: profile.department,
      banner: profile.banner,
      avatar: profile.avatar
    });
    setIsEditing(false);
  };

  const expPercentage = Math.min((profile.stats.exp / profile.stats.nextLevelExp) * 100, 100);

  return (
    <div className="h-full bg-stone-50 overflow-y-auto pb-24">
      {/* Header & Banner */}
      <div 
        className="relative h-48 bg-gradient-to-br from-emerald-800 to-teal-600 rounded-b-[40px] shadow-lg overflow-hidden bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: editData.banner ? `url(${editData.banner})` : 'none' }}
      >
         <div className="absolute inset-0 bg-black/20"></div>
         
         {isEditing && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer hover:bg-black/50 transition-colors group">
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 text-white flex items-center gap-2 group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5"/>
                <span className="text-sm font-bold">更換背景</span>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            </label>
         )}

         {/* 右上角按鈕群組 */}
         <div className="absolute top-4 right-4 flex gap-2 z-20">
            {isEditing ? (
              <>
                <button onClick={handleCancel} className="p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-red-500/80 transition-colors shadow-sm" title="取消編輯"><X className="w-5 h-5"/></button>
                <button onClick={handleSave} className="p-2 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-colors" title="儲存變更"><CheckCircle className="w-5 h-5"/></button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/30 transition-colors shadow-sm" title="編輯個人檔案"><Settings className="w-5 h-5"/></button>
            )}
         </div>
      </div>
      
      {/* Avatar & Info */}
      <div className="px-5 relative -mt-16">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden">
               {editData.avatar ? <img src={editData.avatar} className="w-full h-full object-cover" alt="avatar"/> : <span className="text-4xl">🐢</span>}
               {isEditing && (
                 <label className="absolute inset-0 bg-black/50 flex items-center justify-center text-white cursor-pointer hover:bg-black/60 transition-colors">
                   <Camera className="w-8 h-8"/>
                   <input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageChange(e,'avatar')}/>
                 </label>
               )}
            </div>
            <div className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-500 border-4 border-white rounded-full"></div>
          </div>
          
          <div className="mt-3 text-center w-full">
             {isEditing ? (
               <input type="text" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="text-2xl font-black text-gray-800 text-center bg-transparent border-b-2 border-emerald-500 focus:outline-none w-1/2 mx-auto" placeholder="輸入姓名" />
             ) : (
               <h2 className="text-2xl font-black text-gray-800">{profile.name}</h2>
             )}
             {isEditing ? (
               <div className="mt-2">
                 <input type="text" value={editData.department} onChange={(e) => setEditData({...editData, department: e.target.value})} className="text-sm text-gray-500 text-center bg-transparent border-b border-gray-300 focus:border-emerald-500 focus:outline-none w-2/3 mx-auto" placeholder="輸入校區 · 系所" />
               </div>
             ) : (
               <p className="text-gray-500 text-sm mt-1">{profile.department}</p>
             )}
          </div>
        </div>

        {/* Level Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm mt-6">
           <div className="flex justify-between text-xs font-bold text-gray-500 mb-2"><span>食光等級 {profile.stats.level}</span><span>{profile.stats.exp}/{profile.stats.nextLevelExp} XP</span></div>
           <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden"><div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-1000" style={{width: `${expPercentage}%`}}></div></div>
        </div>

        {/* Stats (使用新的 AnimatedStatCard) */}
        <div className="grid grid-cols-2 gap-4 mt-4">
           <AnimatedStatCard 
             icon={Award} 
             value={profile.stats.savedCount} 
             label="惜食次數" 
             color="emerald" 
             delay={0}
           />
           <AnimatedStatCard 
             icon={Leaf} 
             value={profile.stats.savedWeight} 
             label="累積公斤數" 
             color="orange" 
             delay={200}
           />
        </div>

        {/* 成就牆 (Trophy Grid) */}
        <div className="mt-6 mb-4">
          <h3 className="font-bold text-gray-800 text-lg mb-3 px-1">成就勳章 (Trophy Case)</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {ACHIEVEMENTS_DATA.map(ach => {
              const isUnlocked = profile.unlockedAchievements.includes(ach.id);
              // 使用 ICON_MAP 安全地獲取圖標
              const IconComponent = ICON_MAP[ach.icon] || Award;
              
              return (
                <div 
                  key={ach.id} 
                  className={`
                    relative p-3 rounded-2xl border flex flex-col items-center justify-center text-center h-40
                    transition-all duration-500
                    shadow-lg
                    ${isUnlocked 
                      ? 'bg-white/80 backdrop-blur-sm border-emerald-300/60 shadow-emerald-200/50 opacity-100 cursor-default hover:shadow-xl hover:-translate-y-1' 
                      : 'bg-white/50 border-gray-200 shadow-gray-200/50 opacity-60 grayscale hover:opacity-80 cursor-help'
                    }
                  `}
                  title={isUnlocked ? ach.description : `鎖定: ${ach.description}`}
                >
                  {/* 勳章圖標區 */}
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white shadow-md mb-2 
                    ${isUnlocked ? ach.color : 'bg-gray-400'}
                  `}>
                     <IconComponent className="w-6 h-6" />
                  </div>

                  {/* 標題與描述 */}
                  <h4 className={`font-bold text-sm leading-tight ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                    {ach.title}
                  </h4>
                  
                  <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 px-1">
                    {isUnlocked ? ach.description : '尚未達成'}
                  </p>

                  {/* 解鎖標籤 (右上角) */}
                  {isUnlocked && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm">
                        已解鎖
                      </span>
                    </div>
                  )}

                  {/* 鎖定狀態遮罩 (強化視覺差異) */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-gray-300/20 pointer-events-none select-none">
                      ?
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;