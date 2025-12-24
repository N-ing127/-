import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Clock, Bell, MapPin, Navigation, X, Utensils, Filter } from 'lucide-react';
import LeafletMap from '../components/map/LeafletMap';
import PostCard from '../components/shared/PostCard';
import ProximityAlertBar from '../components/shared/ProximityAlertBar';
import ButtonToggleGroup from '../components/ui/ButtonToggleGroup';
import { LOCATIONS } from '../data/constants';
import { calculateDistance } from '../utils/helpers';
import { useProximityAlert } from '../hooks/useProximityAlert';

const HomeView = ({ 
  posts, 
  setSelectedPost, 
  userLocation, 
  setUserLocation, 
  onLocateMe, 
  isLocating, 
  setActiveTab,
  globalFilterState, 
  setShowFilterModal,
  onPostTaken,
  onPostReserve,
  showNearbyAlert 
}) => {
  const [filterLoc, setFilterLoc] = useState(null); 
  const [viewMode, setViewMode] = useState('all');

  const nearbyPostAlert = useProximityAlert(posts, userLocation);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  useEffect(() => {
    if (nearbyPostAlert?.id) {
        setIsAlertDismissed(false);
    }
  }, [nearbyPostAlert?.id]);

  const filteredPosts = useMemo(() => {
    const { selectedTypes, selectedTags, minQuantity } = globalFilterState;

    return posts.filter(p => {
      if (viewMode === 'near') {
         const loc = LOCATIONS.find(l => l.id === p.locationId);
         if (calculateDistance(userLocation, loc) >= 800) return false;
      }
      if (filterLoc && filterLoc !== 'all' && p.locationId !== filterLoc) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.foodType)) return false;
      if (selectedTags.length > 0) {
        const hasSelectedTag = p.tags.some(tag => selectedTags.includes(tag));
        if (!hasSelectedTag) return false;
      }
      if (parseInt(p.quantity) < minQuantity) return false;
      return true;
    });
  }, [posts, filterLoc, viewMode, userLocation, globalFilterState]);

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      const statusOrder = { 'reserved': 0, 'available': 1, 'taken': 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
      const distA = calculateDistance(userLocation, LOCATIONS.find(l => l.id === a.locationId));
      const distB = calculateDistance(userLocation, LOCATIONS.find(l => l.id === b.locationId));
      return distA - distB;
    });
  }, [filteredPosts, userLocation]);

  const handlePinClick = useCallback((locId) => {
    setFilterLoc(prev => prev === locId ? null : locId);
    setViewMode('all');
  }, []);

  // 優化：點擊貼文卡片時，地圖自動聚焦到該系館
  const handleCardClick = (post) => {
    setSelectedPost(post);
    setFilterLoc(post.locationId);
  };

  const filterOptions = [
    { label: '探索全部', value: 'all', icon: MapPin },
    { label: '僅看附近', value: 'near', icon: Navigation }
  ];

  const activeFilterCount = globalFilterState.selectedTypes.length + globalFilterState.selectedTags.length + (globalFilterState.minQuantity > 1 ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-zinc-950 transition-colors pb-20">
      <div className="sticky top-0 z-50 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-white/50 dark:border-zinc-800 shadow-xl shadow-black/5 px-5 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer group select-none">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-white to-emerald-50 dark:from-zinc-800 dark:to-zinc-900 rounded-xl border border-emerald-100/80 dark:border-emerald-900/30 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-black text-lg leading-none text-slate-800 dark:text-zinc-100 tracking-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">TimeMachine</h1>
            <span className="text-[10px] font-bold text-emerald-600/80 tracking-[0.2em] uppercase mt-0.5 ml-0.5">食 光 機</span>
          </div>
        </div>
        <button onClick={() => setActiveTab('notifications')} className="relative p-2.5 rounded-full hover:bg-white/50 dark:hover:bg-zinc-800 border border-transparent hover:border-white/50 dark:hover:border-zinc-700 hover:shadow-sm">
          <Bell className="w-6 h-6 text-slate-600 dark:text-zinc-400" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-zinc-900 shadow-sm"></span>
        </button>
      </div>

      {showNearbyAlert && nearbyPostAlert && !isAlertDismissed && (
        <ProximityAlertBar post={nearbyPostAlert} onTake={onPostTaken} onDetail={setSelectedPost} onClose={() => setIsAlertDismissed(true)} />
      )}

      <div className="relative h-64 mx-4 mt-4 overflow-hidden z-0 bg-white/10 dark:bg-black/20 backdrop-blur-3xl border border-white/30 dark:border-zinc-800 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.25)] rounded-[32px] transition-all duration-500 hover:border-white/70">
        <div className="w-full h-full relative z-0">
          <LeafletMap posts={posts} userLocation={userLocation} filterLoc={filterLoc} onPinClick={handlePinClick} setSelectedPost={setSelectedPost} />
        </div>
        <button onClick={onLocateMe} disabled={isLocating} className="absolute bottom-4 right-4 w-12 h-12 bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-2xl shadow-lg border border-white/50 dark:border-zinc-700 flex items-center justify-center text-emerald-700 dark:text-emerald-400 hover:scale-105 active:scale-95 transition-all z-[1001]">
          {isLocating ? <div className="animate-spin text-xl">⌛</div> : <Navigation className="w-6 h-6 fill-current" />}
        </button>
      </div>

      <div className="px-5 mt-6 mb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-zinc-100">{filterLoc ? LOCATIONS.find(l=>l.id===filterLoc)?.name : (viewMode === 'near' ? '附近分享' : '惜食動態')}</h3>
            <p className="text-sm text-gray-400 dark:text-zinc-500 mt-0.5">{viewMode === 'near' ? '顯示距離 800m 內的項目' : (filterLoc ? '該地點目前的分享' : `共有 ${sortedPosts.length} 個分享機會`)}</p>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setShowFilterModal(true)} className={`p-2.5 rounded-xl border transition-all flex items-center justify-center relative ${activeFilterCount > 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-white dark:bg-zinc-900 text-gray-500 border-gray-200 dark:border-zinc-800 hover:bg-gray-50'}`}>
               <Filter className="w-5 h-5" />
               {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">{activeFilterCount}</span>}
             </button>
             {filterLoc && <button onClick={() => handlePinClick(null)} className="p-2.5 bg-gray-100 dark:bg-zinc-800 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-500 transition-colors"><X className="w-5 h-5" /></button>}
          </div>
        </div>
        <ButtonToggleGroup options={filterOptions} value={viewMode} onChange={(val) => { setViewMode(val); if (val === 'all' || val === 'near') setFilterLoc(null); }} />
      </div>

      <div className="flex-1 px-4 space-y-4 overflow-y-auto">
        {sortedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-zinc-600">
            <div className="w-20 h-20 bg-gray-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4"><Utensils className="w-8 h-8 text-gray-400" /></div>
            <p>目前沒有符合條件的食物</p>
          </div>
        ) : (
          sortedPosts.map(post => {
            const distance = calculateDistance(userLocation, LOCATIONS.find(l => l.id === post.locationId));
            return <PostCard key={post.id} post={post} distance={distance} onClick={() => handleCardClick(post)} />;
          })
        )}
      </div>
    </div>
  );
};

export default HomeView;