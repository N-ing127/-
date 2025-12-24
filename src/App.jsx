import React, { useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Award, X, Sparkles, PartyPopper } from 'lucide-react';

// Hooks & Services
import { usePosts } from './hooks/usePosts';
import { useProfile } from './hooks/useProfile';

// Views
import HomeView from './views/HomeView';
import PostFoodView from './views/PostFoodView';
import ProfileView from './views/ProfileView';
import NotificationSettingsView from './views/NotificationSettingsView';
import CarbonImpactView from './views/CarbonImpactView';
import HistoryView from './views/HistoryView'; // 新增

// UI Components
import FloatingNav from './components/shared/FloatingNav';
import PostDetailModal from './components/shared/PostDetailModal';
import FilterModal from './components/shared/FilterModal';
import { SWUpdateToast } from './components/shared/SWUpdateToast';

const AchievementModal = ({ achievement, onClose }) => {
  if (!achievement) return null;
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-emerald-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-sm bg-white dark:bg-zinc-900 rounded-[40px] p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg ring-8 ring-emerald-950/90">
          <PartyPopper className="w-12 h-12 text-white animate-bounce" />
        </div>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="mt-8 space-y-4">
          <h4 className="text-emerald-600 dark:text-emerald-400 font-black tracking-widest uppercase text-sm">Achievement Unlocked</h4>
          <h2 className="text-3xl font-black text-gray-800 dark:text-zinc-100">{achievement.title}</h2>
          <div className={`mx-auto w-20 h-20 rounded-3xl ${achievement.color} flex items-center justify-center shadow-inner my-6`}>
            <Award className="w-10 h-10 text-white" />
          </div>
          <p className="text-gray-500 dark:text-zinc-400 leading-relaxed">{achievement.description}</p>
          <div className="pt-6">
            <button onClick={onClose} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95">
              太棒了！
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TimeMachineApp() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');
  const [showToast, setShowToast] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null); 
  const [unlockedAchievement, setUnlockedAchievement] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 25.0185, lng: 121.5385 });
  const [isLocating, setIsLocating] = useState(false);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [globalFilterState, setGlobalFilterState] = useState({
    selectedTypes: [], selectedTags: [], minQuantity: 1,    
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const triggerToast = useCallback((msg, type = 'success') => {
    setShowToast({ msg, type });
    setTimeout(() => setShowToast(null), 3000);
  }, []);

  const { posts, isLoading, updatePostStatus, addPost } = usePosts(triggerToast);
  const { profile, setProfile, updateStats } = useProfile(triggerToast);

  const handleLocateMe = () => {
    setIsLocating(true);
    triggerToast('定位中...', 'success');
    setTimeout(() => {
      const mockLat = 25.0184 + (Math.random() - 0.5) * 0.002; 
      const mockLng = 121.5397 + (Math.random() - 0.5) * 0.002;
      setUserLocation({ lat: mockLat, lng: mockLng });
      setIsLocating(false);
      triggerToast('已更新位置', 'success');
    }, 1000);
  };

  const handlePostReserve = async (post) => {
    const success = await updatePostStatus(post, 'reserved');
    if (success) {
      triggerToast('預訂成功！', 'success');
      setSelectedPost(null);
    }
  };

  const handlePostTaken = async (post) => {
    const success = await updatePostStatus(post, 'taken');
    if (success) {
      const isNight = new Date().getHours() >= 22;
      const newAch = updateStats(stats => ({
        ...stats,
        exp: stats.exp + 50,
        savedCount: stats.savedCount + 1,
        savedWeight: parseFloat((stats.savedWeight + 0.4).toFixed(1)),
        nightOwlActions: isNight ? stats.nightOwlActions + 1 : stats.nightOwlActions
      }));

      if (newAch) {
        setUnlockedAchievement(newAch);
      } else {
        triggerToast('領取成功！ +50 XP', 'success');
      }
      setSelectedPost(null);
    }
  };

  const handleCreatePost = async (newPost) => {
    const success = await addPost(newPost);
    if (success) {
       setActiveTab('home');
       triggerToast('發布成功！', 'success');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-stone-50 dark:bg-zinc-950 shadow-2xl overflow-hidden font-sans text-gray-800 dark:text-zinc-100 relative transition-colors">
      <SWUpdateToast />
      <main className="flex-1 overflow-hidden relative z-0">
        {isLoading && activeTab === 'home' && (
           <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm">
             <div className="animate-spin text-4xl text-emerald-500">⌛</div>
           </div>
        )}

        {activeTab === 'home' && (
          <HomeView 
            posts={posts} setSelectedPost={setSelectedPost} 
            userLocation={userLocation} setUserLocation={setUserLocation} 
            onLocateMe={handleLocateMe} isLocating={isLocating}
            setActiveTab={setActiveTab} globalFilterState={globalFilterState}
            setShowFilterModal={setShowFilterModal} onPostTaken={handlePostTaken}
            onPostReserve={handlePostReserve} showNearbyAlert={profile.settings?.showNearbyAlert}
          />
        )}

        {activeTab === 'post' && (
          <PostFoodView onCreatePost={handleCreatePost} setActiveTab={setActiveTab} triggerToast={triggerToast} />
        )}

        {activeTab === 'profile' && (
          <ProfileView setActiveTab={setActiveTab} profile={profile} setProfile={setProfile} isDark={isDark} setIsDark={setIsDark} />
        )}

        {activeTab === 'notifications' && (
          <NotificationSettingsView setActiveTab={setActiveTab} profile={profile} setProfile={setProfile} />
        )}

        {activeTab === 'carbon_impact' && (
          <CarbonImpactView setActiveTab={setActiveTab} profile={profile} />
        )}

        {activeTab === 'history' && (
          <HistoryView setActiveTab={setActiveTab} posts={posts} />
        )}

        <PostDetailModal 
          selectedPost={selectedPost} setSelectedPost={setSelectedPost}
          triggerToast={triggerToast} onTaken={handlePostTaken} onReserve={handlePostReserve}
        />

        <FilterModal 
          show={showFilterModal} onClose={() => setShowFilterModal(false)} 
          initialState={globalFilterState} onApply={setGlobalFilterState} 
        />

        <AchievementModal 
          achievement={unlockedAchievement} 
          onClose={() => setUnlockedAchievement(null)} 
        />

        {showToast && (
          <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-xl z-[3000] animate-bounce flex items-center gap-2 font-bold text-sm ${showToast.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}>
            {showToast.msg}
          </div>
        )}
      </main>
      <FloatingNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}