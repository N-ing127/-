import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { CheckCircle, AlertCircle, Award, X, Sparkles, PartyPopper } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import LoginView from './views/LoginView';

// Hooks & Services
import { usePosts } from './hooks/usePosts';
import { useProfile } from './hooks/useProfile';
import { useTokens } from './hooks/useTokens';
import { useHeatmap } from './hooks/useHeatmap';
import { useSettlements } from './hooks/useSettlements';
import { useGhostStates } from './hooks/useGhostStates';
import { useAllGhostStates } from './hooks/useAllGhostStates';

// Views
import HomeView from './views/HomeView';
import PostFoodView from './views/PostFoodView';
import ProfileView from './views/ProfileView';
import NotificationSettingsView from './views/NotificationSettingsView';
import CarbonImpactView from './views/CarbonImpactView';
import HistoryView from './views/HistoryView';
import AdminDashboardView from './views/AdminDashboardView';

// UI Components
import FloatingNav from './components/shared/FloatingNav';
import PostDetailModal from './components/shared/PostDetailModal';
import FilterModal from './components/shared/FilterModal';
import SharePostModal from './components/shared/SharePostModal';
// PWA SW 已停用，SWUpdateToast 移除

const AchievementModal = ({ achievement, onClose }) => {
  if (!achievement) return null;
  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-emerald-950/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[40px] p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
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

// Auth gate wrapper（獨立 component，確保不違反 Hook 規則）
export default function AppRoot() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-stone-50 dark:bg-zinc-950">
      <div className="animate-spin text-4xl text-emerald-500">⌛</div>
    </div>
  );
  if (!user) return <LoginView />;
  return <TimeMachineApp />;
}

function TimeMachineApp() {
  const [activeTab, setActiveTab] = useState('home');
  // localStorage 在 Safari Private / Brave 嚴格模式可能 throw，必須兜底
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('theme') === 'dark'; } catch { return false; }
  });
  const [showToast, setShowToast] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null); 
  const [unlockedAchievement, setUnlockedAchievement] = useState(null);
  const [userLocation, setUserLocation] = useState({ lat: 25.0185, lng: 121.5385 });
  const [isLocating, setIsLocating] = useState(false);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [globalFilterState, setGlobalFilterState] = useState({
    selectedTypes: [], selectedTags: [], minQuantity: 1,    
  });

  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch {}
  }, [isDark]);

  const triggerToast = useCallback((msg, type = 'success') => {
    setShowToast({ msg, type });
    setTimeout(() => setShowToast(null), 3000);
  }, []);

  const { posts, isFetching, isMutating, claimPost, reservePost, addPost } = usePosts(triggerToast);
  const { profile, setProfile, updateStats } = useProfile(triggerToast);
  const { tokens, stakedPostIds, revealedCoords, isStaking, stakeToken } = useTokens(triggerToast);
  const heatmapCounts = useHeatmap(posts.map(p => p.id));
  const settlements = useSettlements();
  // 主頁 banner 優先順序：voided (要警示) > pending in window > 最近 settled
  const activeSettlement =
    settlements.find(s => s.status === 'voided') ||
    settlements.find(s => s.isInWindow) ||
    null;
  // Phase 3: ghost states — 我 stake 過、被別人領走 pending 中的 post
  const myGhosts = useGhostStates();
  // Phase 6: 獵手 / Admin 看全網 ghosts (用 profile?. 避免 TDZ)
  const hunterEnabled = (profile?.isGhostHunter === true) || (profile?.isAdmin === true);
  const allGhosts = useAllGhostStates(hunterEnabled);
  const ghostPosts = useMemo(() => {
    if (!hunterEnabled) return myGhosts;
    const idSet = new Set(myGhosts.map(g => g.id));
    const extra = allGhosts.filter(g => !idSet.has(g.id));
    return [...myGhosts, ...extra];
  }, [myGhosts, allGhosts, hunterEnabled]);

  // 預設 profile，避免 null 時整棵 component tree 被銷毀
  const safeProfile = profile ?? {
    name: '載入中…', displayName: '載入中…',
    department: '', avatar: null, banner: null,
    avatarUrl: null, bannerUrl: null,
    stats: { exp: 0, level: 1, nextLevelExp: 200, savedCount: 0, savedWeight: 0, nightOwlActions: 0 },
    unlockedAchievements: [],
    settings: { showNearbyAlert: false, notificationRadius: 500 },
  };

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
    const success = await reservePost(post);
    if (success) {
      triggerToast('預訂成功！', 'success');
      setSelectedPost(null);
    }
  };

  // Phase 2: claimPost 簽名變 (post, qty, proof)，proof = { url, lat, lng }
  const handlePostClaim = async (post, qty = 1, proof = null) => {
    const result = await claimPost(post, qty, proof);
    if (result?.success) {
      const xpGain = 50 * qty;
      const weightGain = parseFloat((0.4 * qty).toFixed(1));
      const isNight = new Date().getHours() >= 22;
      const newAch = await updateStats(stats => ({
        ...stats,
        exp: stats.exp + xpGain,
        savedCount: stats.savedCount + qty,
        savedWeight: parseFloat((stats.savedWeight + weightGain).toFixed(1)),
        nightOwlActions: isNight ? stats.nightOwlActions + 1 : stats.nightOwlActions
      }));

      if (newAch) {
        setUnlockedAchievement(newAch);
      } else {
        triggerToast(`領取成功！ +${xpGain} XP，結算中 15 分鐘`, 'success');
      }
      const livePost = posts.find(p => p.id === post.id);
      if (!livePost || livePost.quantity <= 0) {
        setSelectedPost(null);
      }
      return true;
    }
    return false;
  };

  const handleCreatePost = async (newPost) => {
    const success = await addPost(newPost);
    if (success) {
       setActiveTab('home');
       triggerToast('發布成功！', 'success');
    }
  };

  const handleSharePost = (post) => {
    setShowShareModal(true);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-stone-50 dark:bg-zinc-950 shadow-2xl overflow-hidden font-sans text-gray-800 dark:text-zinc-100 relative transition-colors">
      {/* PWA SW 已停用 */}
      <main className="flex-1 overflow-hidden relative z-0">
        {/* 僅首次載入顯示 overlay，靜默 refetch 不會觸發 */}
        {isFetching && activeTab === 'home' && (
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
            setShowFilterModal={setShowFilterModal} onPostClaim={handlePostClaim}
            onPostReserve={handlePostReserve} showNearbyAlert={safeProfile.settings?.showNearbyAlert}
            tokens={tokens} stakedPostIds={stakedPostIds} revealedCoords={revealedCoords}
            heatmapCounts={heatmapCounts}
            activeSettlement={activeSettlement}
            ghostPosts={ghostPosts}
            triggerToast={triggerToast}
          />
        )}

        {activeTab === 'post' && (
          <PostFoodView onCreatePost={handleCreatePost} setActiveTab={setActiveTab} triggerToast={triggerToast} />
        )}

        {activeTab === 'profile' && (
          <ProfileView setActiveTab={setActiveTab} profile={safeProfile} setProfile={setProfile} isDark={isDark} setIsDark={setIsDark} />
        )}

        {activeTab === 'notifications' && (
          <NotificationSettingsView setActiveTab={setActiveTab} profile={safeProfile} setProfile={setProfile} />
        )}

        {activeTab === 'carbon_impact' && (
          <CarbonImpactView setActiveTab={setActiveTab} profile={safeProfile} />
        )}

        {activeTab === 'history' && (
          <HistoryView setActiveTab={setActiveTab} posts={posts} />
        )}

        {activeTab === 'admin' && safeProfile.isAdmin && (
          <AdminDashboardView setActiveTab={setActiveTab} />
        )}

        {/* 確保這裡有傳入 onShare */}
        <PostDetailModal
          selectedPost={selectedPost} setSelectedPost={setSelectedPost}
          posts={posts} triggerToast={triggerToast}
          onClaim={handlePostClaim} onReserve={handlePostReserve}
          onShare={handleSharePost} isMutating={isMutating}
          tokens={tokens} stakedPostIds={stakedPostIds} revealedCoords={revealedCoords}
          heatmapCounts={heatmapCounts} isStaking={isStaking} onStake={stakeToken}
          ghostPosts={ghostPosts}
          isAdmin={safeProfile.isAdmin === true}
        />

        <FilterModal 
          show={showFilterModal} onClose={() => setShowFilterModal(false)} 
          initialState={globalFilterState} onApply={setGlobalFilterState} 
        />

        {/* 確保這裡只有在 showShareModal 為真時才渲染 */}
        {showShareModal && (
          <SharePostModal 
            post={selectedPost} 
            onClose={() => setShowShareModal(false)} 
            triggerToast={triggerToast}
          />
        )}

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
      <FloatingNav activeTab={activeTab} setActiveTab={setActiveTab} tokens={tokens} />
    </div>
  );
}