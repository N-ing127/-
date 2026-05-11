import React, { useState, useEffect } from 'react';
import {
  CheckCircle, Settings, Camera, Award, Leaf, X,
  Megaphone, Moon, Sun, User, ChevronRight, LogOut,
  Shield, Ghost, Flag, AlertOctagon
} from 'lucide-react';
import { ACHIEVEMENTS_DATA } from '../data/constants';
import AnimatedStatCard from '../components/shared/AnimatedStatCard';
import { uploadFoodImage } from '../lib/uploadImage';
import { useAuth } from '../contexts/AuthContext';

const ICON_MAP = {
  'Megaphone': Megaphone,
  'Leaf': Leaf,
  'Award': Award,
  'Moon': Moon
};

const ProfileView = ({ setActiveTab, profile, setProfile, isDark, setIsDark }) => {
  const { signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: profile?.name || '惜食者',
    department: profile?.department || '未設定系級',
    banner: profile?.banner || null,
    avatar: profile?.avatar || null
  });

  // 暫存實際 File 物件（用於上傳到 Supabase Storage）
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  useEffect(() => {
    if (profile) {
      setEditData({
        name: profile.name,
        department: profile.department,
        banner: profile.banner,
        avatar: profile.avatar
      });
    }
  }, [profile]);

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setEditData(prev => ({ ...prev, [type]: objectUrl }));
      if (type === 'avatar') setAvatarFile(file);
      if (type === 'banner') setBannerFile(file);
    }
  };

  const handleSave = async () => {
    // 上傳新圖片到 Supabase Storage（如果有更換）
    let finalAvatar = editData.avatar;
    let finalBanner = editData.banner;

    if (avatarFile) {
      const url = await uploadFoodImage(avatarFile);
      if (url) finalAvatar = url;
    }
    if (bannerFile) {
      const url = await uploadFoodImage(bannerFile);
      if (url) finalBanner = url;
    }

    setProfile(prev => ({
      ...prev,
      name: editData.name,
      department: editData.department,
      banner: finalBanner,
      avatar: finalAvatar,
    }));
    setAvatarFile(null);
    setBannerFile(null);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    if (window.confirm('確定要登出嗎？')) {
      await signOut();
    }
  };

  const expPercentage = profile?.stats 
    ? Math.min((profile.stats.exp / profile.stats.nextLevelExp) * 100, 100)
    : 0;

  const carbonImpact = (profile?.stats?.savedCount * 5.237).toFixed(1);

  return (
    <div className="h-full bg-stone-50 dark:bg-zinc-950 overflow-y-auto pb-24 transition-colors">
      <div 
        className="relative h-48 bg-gradient-to-br from-emerald-800 to-teal-600 rounded-b-[40px] shadow-lg overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: editData.banner ? `url(${editData.banner})` : 'none' }}
      >
         <div className="absolute inset-0 bg-black/20"></div>
         {isEditing && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer">
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 text-white flex items-center gap-2">
                <Camera className="w-5 h-5"/>
                <span className="text-sm font-bold">更換背景</span>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'banner')} />
            </label>
         )}
         <div className="absolute top-4 right-4 flex gap-2 z-20">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="p-2 bg-white/20 backdrop-blur rounded-full text-white"><X className="w-5 h-5"/></button>
                <button onClick={handleSave} className="p-2 bg-emerald-500 text-white rounded-full shadow-lg"><CheckCircle className="w-5 h-5"/></button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="p-2 bg-white/20 backdrop-blur rounded-full text-white"><Settings className="w-5 h-5"/></button>
            )}
         </div>
      </div>
      
      <div className="px-5 relative -mt-16">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-white dark:border-zinc-900 shadow-lg bg-white dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
               {editData.avatar ? <img src={editData.avatar} className="w-full h-full object-cover" alt="avatar"/> : <User className="w-12 h-12 text-gray-400" />}
               {isEditing && (
                 <label className="absolute inset-0 bg-black/50 flex items-center justify-center text-white cursor-pointer">
                   <Camera className="w-8 h-8"/>
                   <input type="file" className="hidden" accept="image/*" onChange={(e)=>handleImageChange(e,'avatar')}/>
                 </label>
               )}
            </div>
            <div className="absolute bottom-1 right-1 w-7 h-7 bg-emerald-500 border-4 border-white dark:border-zinc-900 rounded-full"></div>
          </div>
          
          <div className="mt-3 text-center w-full">
             {isEditing ? (
               <input type="text" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="text-2xl font-black text-gray-800 dark:text-zinc-100 text-center bg-transparent border-b-2 border-emerald-500 focus:outline-none w-1/2 mx-auto" />
             ) : (
               <h2 className="text-2xl font-black text-gray-800 dark:text-zinc-100">{profile?.name}</h2>
             )}
             <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">{profile?.department}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm mt-6 border dark:border-zinc-800">
           <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-zinc-400 mb-2">
             <span>等級 {profile?.stats?.level || 1}</span>
             <span>{profile?.stats?.exp || 0}/{profile?.stats?.nextLevelExp || 100} XP</span>
           </div>
           <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden border dark:border-zinc-700">
             <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-1000" style={{width: `${expPercentage}%`}}></div>
           </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm mt-4 flex items-center justify-between transition-all border dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-500'}`}>
              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <span className="font-bold text-gray-700 dark:text-zinc-200 text-sm">深色模式</span>
          </div>
          <button onClick={() => setIsDark(!isDark)} className={`w-12 h-6 rounded-full transition-colors relative ${isDark ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-700'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${isDark ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {/* 雙卡片皆可點擊跳轉 */}
        <div className="grid grid-cols-2 gap-4 mt-4">
           <div onClick={() => setActiveTab('history')} className="cursor-pointer active:scale-95 transition-transform group relative">
             <AnimatedStatCard icon={Award} value={profile?.stats?.savedCount || 0} label="惜食次數" color="emerald" delay={0} />
             <div className="absolute top-2 right-2 text-emerald-600 group-hover:translate-x-1 transition-transform">
               <ChevronRight className="w-4 h-4" />
             </div>
           </div>
           <div onClick={() => setActiveTab('carbon_impact')} className="cursor-pointer active:scale-95 transition-transform group relative">
             <AnimatedStatCard icon={Leaf} value={carbonImpact} label="減少碳排 (kg)" color="orange" delay={200} />
             <div className="absolute top-2 right-2 text-orange-600 group-hover:translate-x-1 transition-transform">
               <ChevronRight className="w-4 h-4" />
             </div>
           </div>
        </div>

        {/* Phase 5/6: 信任分 + 徽章 + 警示 */}
        <div className="mt-4 p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">信任積分</p>
              <p className={`text-2xl font-black ${
                (profile?.trustScore ?? 100) >= 100 ? 'text-emerald-600'
                : (profile?.trustScore ?? 100) >= 70 ? 'text-amber-600'
                : 'text-red-600'
              }`}>{profile?.trustScore ?? 100}</p>
            </div>
            <div className="flex gap-1.5">
              {profile?.isGhostHunter && (
                <span className="px-2.5 py-1 bg-zinc-900 text-amber-400 text-[10px] font-black rounded-full flex items-center gap-1">
                  <Ghost className="w-3 h-3" /> 獵手
                </span>
              )}
              {profile?.isVerifiedPartner && (
                <span className="px-2.5 py-1 bg-blue-500 text-white text-[10px] font-black rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> 認證
                </span>
              )}
              {profile?.isAdmin && (
                <span className="px-2.5 py-1 bg-purple-600 text-white text-[10px] font-black rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
            </div>
          </div>

          {profile?.flaggedCountMonth >= 1 && (
            <div className="flex items-center gap-2 text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded-xl">
              <Flag className="w-4 h-4" />
              <span className="font-bold">本月已被標記 {profile.flaggedCountMonth} 次 (≥3 將進入人工審查)</span>
            </div>
          )}
          {profile?.isShadowbanned && (
            <div className="flex items-center gap-2 text-xs bg-gray-900 text-white p-2 rounded-xl">
              <AlertOctagon className="w-4 h-4" />
              <span className="font-bold">你的貼文已被全網隱蔽 (被 5+ 用戶封鎖)</span>
            </div>
          )}

          {profile?.isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className="w-full p-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 active:scale-95"
            >
              <Shield className="w-4 h-4" /> 進入後台管理
            </button>
          )}
        </div>

        {/* 登出按鈕 */}
        <button
          onClick={handleLogout}
          className="w-full mt-4 flex items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 text-red-500 font-bold text-sm rounded-2xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
        >
          <LogOut className="w-4 h-4" /> 登出帳號
        </button>

        <div className="mt-6 mb-4">
          <h3 className="font-bold text-gray-800 dark:text-zinc-100 text-lg mb-3 px-1 text-sm uppercase tracking-widest">成就勳章</h3>
          <div className="grid grid-cols-2 gap-3">
            {(ACHIEVEMENTS_DATA || []).map(ach => {
              const isUnlocked = profile?.unlockedAchievements?.includes(ach.id);
              const IconComponent = ICON_MAP[ach.icon] || Award;
              return (
                <div key={ach.id} className={`relative p-3 rounded-2xl border flex flex-col items-center justify-center text-center h-40 transition-all duration-500 ${isUnlocked ? 'bg-white dark:bg-zinc-900 border-emerald-300 dark:border-emerald-900/50 shadow-lg' : 'bg-gray-50/50 dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-800 opacity-60 grayscale'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white mb-2 ${isUnlocked ? ach.color : 'bg-gray-400'}`}><IconComponent className="w-6 h-6" /></div>
                  <h4 className={`font-bold text-sm ${isUnlocked ? 'text-gray-800 dark:text-zinc-100' : 'text-gray-500 dark:text-zinc-600'}`}>{ach.title}</h4>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 line-clamp-2 px-1">{isUnlocked ? ach.description : '尚未達成'}</p>
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