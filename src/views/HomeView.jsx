import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Clock, Bell, MapPin, Navigation, X, Utensils, Filter } from 'lucide-react';
import LeafletMap from '../components/map/LeafletMap';
import PostCard from '../components/shared/PostCard';
import ProximityAlertBar from '../components/shared/ProximityAlertBar';
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
  onPostClaim,
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

  const handleCardClick = (post) => {
    setSelectedPost(post);
    setFilterLoc(post.locationId);
  };

  const activeFilterCount = globalFilterState.selectedTypes.length + globalFilterState.selectedTags.length + (globalFilterState.minQuantity > 1 ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-zinc-950 transition-colors pb-20">
      {/* 恢復完整 Logo 排版與動畫 */}
      <div className="sticky top-0 z-50 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-white/50 dark:border-zinc-800 shadow-xl shadow-black/5 px-5 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer group select-none" onClick={() => window.location.reload()}>
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
        <ProximityAlertBar post={nearbyPostAlert} onTake={(p) => onPostClaim(p, 1)} onDetail={setSelectedPost} onClose={() => setIsAlertDismissed(true)} />
      )}

      {/* 地圖區域 */}
      <div className="relative h-60 mx-4 mt-4 overflow-hidden bg-white/10 dark:bg-black/20 border border-gray-200 dark:border-zinc-800 shadow-lg rounded-[28px]">
        <div className="w-full h-full">
          <LeafletMap posts={posts} userLocation={userLocation} filterLoc={filterLoc} onPinClick={handlePinClick} setSelectedPost={setSelectedPost} />
        </div>
        <button onClick={onLocateMe} disabled={isLocating} className="absolute bottom-3 right-3 w-10 h-10 bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-xl shadow-lg border border-white/50 dark:border-zinc-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 z-[1001]">
          {isLocating ? <div className="animate-spin text-xs">⌛</div> : <Navigation className="w-5 h-5 fill-current" />}
        </button>
      </div>

      {/* 操作區：Tab 與 篩選 同行 */}
      <div className="px-5 mt-5 mb-2 flex items-center justify-between gap-3">
        <div className="flex-1 flex bg-gray-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-gray-200/50 dark:border-zinc-800">
          <button 
            onClick={() => { setViewMode('all'); setFilterLoc(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'all' ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-md' : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700'}`}
          >
            <MapPin className="w-3.5 h-3.5" /> 探索全部
          </button>
          <button 
            onClick={() => { setViewMode('near'); setFilterLoc(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'near' ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-md' : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700'}`}
          >
            <Navigation className="w-3.5 h-3.5" /> 僅看附近
          </button>
        </div>

        <div className="flex gap-2">
           <button 
             onClick={() => setShowFilterModal(true)} 
             className={`w-12 h-12 rounded-2xl border transition-all flex items-center justify-center relative ${activeFilterCount > 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-white dark:bg-zinc-900 text-gray-500 border-gray-200 dark:border-zinc-800 hover:shadow-md'}`}
           >
             <Filter className="w-5 h-5" />
             {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-zinc-950">{activeFilterCount}</span>}
           </button>
           {filterLoc && (
             <button onClick={() => handlePinClick(null)} className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"><X className="w-5 h-5" /></button>
           )}
        </div>
      </div>

      {/* 列表區域（pb-28 為 FloatingNav 預留空間）*/}
      <div className="flex-1 px-4 space-y-4 overflow-y-auto pb-28">
        <div className="px-1 mt-2 mb-1 flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
            {filterLoc ? LOCATIONS.find(l=>l.id===filterLoc)?.name : (viewMode === 'near' ? '附近動態' : '最新分享')}
          </h3>
          <span className="text-[10px] font-bold text-emerald-600/60 dark:text-emerald-400/60 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
            {sortedPosts.length} 個機會
          </span>
        </div>
        
        {sortedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-zinc-600 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <Utensils className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm font-medium">目前沒有符合條件的惜食</p>
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