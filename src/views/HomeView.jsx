import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Clock, Bell, MapPin, Navigation, X, Utensils, Filter } from 'lucide-react';
import LeafletMap from '../components/map/LeafletMap';
import PostCard from '../components/shared/PostCard';
import ProximityAlertBar from '../components/shared/ProximityAlertBar'; // 新增引用
import ButtonToggleGroup from '../components/ui/ButtonToggleGroup';
import { LOCATIONS } from '../data/constants';
import { calculateDistance } from '../utils/helpers';
import { useProximityAlert } from '../hooks/useProximityAlert'; // 新增引用

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
  onPostTaken,    // 新增 props
  onPostReserve   // 新增 props
}) => {
  const [filterLoc, setFilterLoc] = useState(null); 
  const [viewMode, setViewMode] = useState('all');

  // 1. 使用 Proximity Hook 偵測附近貼文
  const nearbyPostAlert = useProximityAlert(posts, userLocation);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  // 2. 智慧重置邏輯：只有當偵測到的「最近貼文 ID」改變時，才重置關閉狀態
  useEffect(() => {
    if (nearbyPostAlert?.id) {
        setIsAlertDismissed(false);
    }
  }, [nearbyPostAlert?.id]);

  // 核心篩選邏輯
  const filteredPosts = useMemo(() => {
    const { selectedTypes, selectedTags, minQuantity } = globalFilterState;

    return posts.filter(p => {
      // 1. 基礎篩選 (地點/附近)
      if (viewMode === 'near') {
         const loc = LOCATIONS.find(l => l.id === p.locationId);
         if (calculateDistance(userLocation, loc) >= 800) return false;
      }
      if (filterLoc && filterLoc !== 'all' && p.locationId !== filterLoc) return false;

      // 2. 進階篩選 (食物種類)
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.foodType)) return false;

      // 3. 進階篩選 (標籤 - OR 邏輯)
      if (selectedTags.length > 0) {
        const hasSelectedTag = p.tags.some(tag => selectedTags.includes(tag));
        if (!hasSelectedTag) return false;
      }

      // 4. 進階篩選 (數量)
      if (parseInt(p.quantity) < minQuantity) return false;

      return true;
    });
  }, [posts, filterLoc, viewMode, userLocation, globalFilterState]);

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      const statusOrder = { 'available': 0, 'reserved': 1, 'taken': 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
      if (a.status === 'available') {
        const distA = calculateDistance(userLocation, LOCATIONS.find(l => l.id === a.locationId));
        const distB = calculateDistance(userLocation, LOCATIONS.find(l => l.id === b.locationId));
        if (distA !== distB) return distA - distB;
      }
      return b.timestamp - a.timestamp;
    });
  }, [filteredPosts, userLocation]);

  const handlePinClick = useCallback((locId) => {
    setFilterLoc(prev => prev === locId ? null : locId);
    setViewMode('all');
  }, []);

  const filterOptions = [
    { label: '探索全部', value: 'all', icon: MapPin },
    { label: '僅看附近', value: 'near', icon: Navigation }
  ];

  const activeFilterCount = globalFilterState.selectedTypes.length + globalFilterState.selectedTags.length + (globalFilterState.minQuantity > 1 ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-stone-50 pb-20">
      {/* Top Navbar */}
      <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-xl shadow-black/5 px-5 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer group select-none">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-white to-emerald-50 rounded-xl border border-emerald-100/80 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Clock className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="font-black text-lg leading-none text-slate-800 tracking-tight group-hover:text-emerald-700 transition-colors">TimeMachine</h1>
            <span className="text-[10px] font-bold text-emerald-600/80 tracking-[0.2em] uppercase mt-0.5 ml-0.5">食 光 機</span>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab('notifications')}
          className="relative p-2.5 rounded-full hover:bg-white/50 border border-transparent hover:border-white/50 hover:shadow-sm"
        >
          <Bell className="w-6 h-6 text-slate-600" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white shadow-sm"></span>
        </button>
      </div>

      {/* Proximity Alert Bar */}
      {nearbyPostAlert && !isAlertDismissed && (
        <ProximityAlertBar 
            post={nearbyPostAlert} 
            onTake={onPostTaken} 
            onDetail={setSelectedPost} 
            onClose={() => setIsAlertDismissed(true)} 
        />
      )}

      {/* Map Hero */}
      <div className="relative h-64 mx-4 mt-4 overflow-hidden z-0 bg-white/10 backdrop-blur-3xl border border-white/30 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.25)] rounded-[32px] transition-all duration-500 hover:border-white/70">
        <div className="w-full h-full relative z-0">
          <LeafletMap 
            posts={posts} 
            userLocation={userLocation} 
            filterLoc={filterLoc} 
            onPinClick={handlePinClick} 
            setSelectedPost={setSelectedPost} 
          />
        </div>
        <button 
          onClick={onLocateMe}
          disabled={isLocating}
          className="absolute bottom-4 right-4 w-12 h-12 bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-white/50 flex items-center justify-center text-emerald-700 hover:scale-105 active:scale-95 transition-all z-[1001]"
        >
          {isLocating ? <div className="animate-spin text-xl">⌛</div> : <Navigation className="w-6 h-6 fill-current" />}
        </button>
      </div>

      {/* Filter Bar & List */}
      <div className="px-5 mt-6 mb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
             <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {filterLoc ? LOCATIONS.find(l=>l.id===filterLoc)?.name : (viewMode === 'near' ? '附近分享' : '惜食動態')}
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">
                   {viewMode === 'near' ? '顯示距離 800m 內的項目' : (filterLoc ? '該地點目前的分享' : `共有 ${sortedPosts.length} 個分享機會`)}
                </p>
             </div>
          </div>
          
          <div className="flex gap-2">
             <button 
               onClick={() => setShowFilterModal(true)} 
               className={`
                 p-2.5 rounded-xl border transition-all flex items-center justify-center relative
                 ${activeFilterCount > 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}
               `}
             >
               <Filter className="w-5 h-5" />
               {activeFilterCount > 0 && (
                 <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                   {activeFilterCount}
                 </span>
               )}
             </button>

             {filterLoc && (
               <button onClick={() => handlePinClick(null)} className="p-2.5 bg-gray-100 rounded-xl hover:bg-gray-200 text-gray-500 transition-colors">
                 <X className="w-5 h-5" />
               </button>
             )}
          </div>
        </div>
        
        <ButtonToggleGroup 
          options={filterOptions} 
          value={viewMode}
          onChange={(val) => {
             setViewMode(val);
             if (val === 'all' || val === 'near') setFilterLoc(null);
          }} 
        />
      </div>

      <div className="flex-1 px-4 space-y-4 overflow-y-auto">
        {sortedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <Utensils className="w-8 h-8 text-gray-400" />
            </div>
            <p>目前沒有符合條件的食物</p>
            {activeFilterCount > 0 && (
               <button 
                 onClick={() => setShowFilterModal(true)} 
                 className="mt-2 text-emerald-600 font-bold text-sm hover:underline"
               >
                 調整篩選條件
               </button>
            )}
          </div>
        ) : (
          sortedPosts.map(post => {
            const distance = calculateDistance(userLocation, LOCATIONS.find(l => l.id === post.locationId));
            return (
              <PostCard 
                key={post.id} 
                post={post}
                distance={distance}
                onClick={() => setSelectedPost(post)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default HomeView;