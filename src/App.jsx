import React, { useState, useCallback } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

// Hooks & Services
import { usePosts } from './hooks/usePosts';
import { useProfile } from './hooks/useProfile';

// Views
import HomeView from './views/HomeView';
import PostFoodView from './views/PostFoodView';
import ProfileView from './views/ProfileView';
import NotificationSettingsView from './views/NotificationSettingsView';

// UI Components
import FloatingNav from './components/shared/FloatingNav';
import PostDetailModal from './components/shared/PostDetailModal';
import FilterModal from './components/shared/FilterModal';
import { SWUpdateToast } from './components/shared/SWUpdateToast';

export default function TimeMachineApp() {
  const [activeTab, setActiveTab] = useState('home'); 
  const [showToast, setShowToast] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null); 
  const [userLocation, setUserLocation] = useState({ lat: 25.0190, lng: 121.5390 });
  const [isLocating, setIsLocating] = useState(false);
  
  // 全局篩選狀態
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [globalFilterState, setGlobalFilterState] = useState({
    selectedTypes: [], 
    selectedTags: [],  
    minQuantity: 1,    
  });
  
  // Toast Helper
  const triggerToast = useCallback((msg, type = 'success') => {
    setShowToast({ msg, type });
    setTimeout(() => setShowToast(null), 3000);
  }, []);

  // Use Custom Hooks
  const { posts, isLoading, updatePostStatus, addPost } = usePosts(triggerToast);
  const { profile, setProfile, updateStats } = useProfile(triggerToast);

  // Handlers
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
      updateStats(stats => {
        const isNight = new Date().getHours() >= 22;
        return {
          ...stats,
          exp: stats.exp + 50,
          savedCount: stats.savedCount + 1,
          savedWeight: parseFloat((stats.savedWeight + 0.4).toFixed(1)),
          nightOwlActions: isNight ? stats.nightOwlActions + 1 : stats.nightOwlActions
        };
      });
      triggerToast('領取成功！ +50 XP', 'success');
      setSelectedPost(null);
    }
  };

  // 修正函數：接收單個貼文物件並發布
  const handleCreatePost = async (newPost) => {
    const success = await addPost(newPost);
    if (success) {
       setActiveTab('home');
       triggerToast('發布成功！', 'success');
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-stone-50 shadow-2xl overflow-hidden font-sans text-gray-800 relative">
      
      <SWUpdateToast />

      <main className="flex-1 overflow-hidden relative z-0">
        
        {isLoading && activeTab === 'home' && (
           <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/50 backdrop-blur-sm">
             <div className="animate-spin text-4xl">⌛</div>
           </div>
        )}

        {activeTab === 'home' && (
          <HomeView 
            posts={posts} 
            setSelectedPost={setSelectedPost} 
            userLocation={userLocation} 
            setUserLocation={setUserLocation} 
            onLocateMe={handleLocateMe} 
            isLocating={isLocating}
            setActiveTab={setActiveTab}
            // 傳遞篩選狀態
            globalFilterState={globalFilterState}
            setShowFilterModal={setShowFilterModal}
            // 傳遞動作函數給 AlertBar 使用
            onPostTaken={handlePostTaken}
            onPostReserve={handlePostReserve}
          />
        )}
        
        {activeTab === 'post' && (
          <PostFoodView 
            // 修正：傳遞新的發布函數
            onCreatePost={handleCreatePost} 
            setActiveTab={setActiveTab} 
            triggerToast={triggerToast} 
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView 
            setActiveTab={setActiveTab} 
            profile={profile} 
            setProfile={setProfile} 
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationSettingsView setActiveTab={setActiveTab} />
        )}
        
        {/* Modals */}
        <PostDetailModal 
          selectedPost={selectedPost} 
          setSelectedPost={setSelectedPost}
          triggerToast={triggerToast}
          onTaken={handlePostTaken}
          onReserve={handlePostReserve}
        />

        <FilterModal 
          show={showFilterModal} 
          onClose={() => setShowFilterModal(false)} 
          initialState={globalFilterState} 
          onApply={setGlobalFilterState} 
        />

        {showToast && (
          <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-xl z-[3000] animate-bounce flex items-center gap-2 font-bold text-sm ${showToast.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-800 text-white'}`}>
            {showToast.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
            {showToast.msg}
          </div>
        )}
      </main>

      <FloatingNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}