import React, { useMemo } from 'react'; // 引入 useMemo
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // 引入 Popup
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LOCATIONS, NTU_CENTER } from '../../data/constants';
import { calculateDistance } from '../../utils/helpers'; // 引入計算距離
import MapPostPopup from '../shared/MapPostPopup'; // 引入新增的組件

const LeafletMap = ({ posts, userLocation, filterLoc, onPinClick, setSelectedPost }) => { // 接收 setSelectedPost
  
  // 建立客製化圖標 (邏輯不變)
  const createCustomIcon = (count, isSelected, name) => {
    const bubbleColor = count > 0 ? 'bg-orange-500' : 'bg-gray-700';
    const pointerColor = count > 0 ? 'border-t-orange-500' : 'border-t-gray-700';
    
    // Lucide Utensils Icon SVG
    const utensilsSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-white/50">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
      </svg>
    `;

    const htmlContent = `
      <div class="flex flex-col items-center" style="transform-origin: bottom center;">
        <div class="leaflet-marker-bubble ${bubbleColor} ${isSelected ? 'scale-125 z-50 ring-4 ring-white/30' : 'scale-100 z-10'}">
          <span class="leaflet-marker-content">
            ${count > 0 ? `剩 ${count}` : utensilsSvg}
          </span>
        </div>
        <div class="leaflet-marker-pointer ${pointerColor}"></div>
        ${isSelected ? `<span class="absolute top-full mt-1 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-gray-700 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap border border-white/50">${name}</span>` : ''}
      </div>
    `;

    return L.divIcon({
      html: htmlContent,
      className: 'bg-transparent',
      iconSize: [50, 50],
      iconAnchor: [25, 50]
    });
  };

  const userIcon = L.divIcon({
    className: 'bg-transparent',
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-600 ring-2 ring-white"></span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  // NEW: 計算距離並分組 posts (優化性能)
  const postsWithDistance = useMemo(() => { 
    if (!userLocation || !userLocation.lat) return posts.map(p => ({...p, distance: 0})); 
    return posts.map(post => { 
      const loc = LOCATIONS.find(l => l.id === post.locationId); 
      // 處理找不到地點的情況，避免崩潰
      const distance = loc ? calculateDistance(userLocation, loc) : 99999; 
      return { ...post, distance }; 
    }); 
  }, [posts, userLocation]);

  return (
    <MapContainer 
      center={NTU_CENTER} 
      zoom={15} 
      scrollWheelZoom={true} 
      className="w-full h-full z-0 bg-stone-100 rounded-[32px]" 
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="opacity-80 saturate-[0.8]"
      />
      
      {LOCATIONS.map(loc => {
        const availablePosts = postsWithDistance.filter(p => p.locationId === loc.id && p.status === 'available');
        const availableCount = availablePosts.length;
        const isSelected = filterLoc === loc.id;
        // 取得距離最近的第一個可展示貼文
        const firstPost = availablePosts.sort((a, b) => a.distance - b.distance)[0]; 

        return (
          <Marker 
            key={loc.id} 
            position={[loc.lat, loc.lng]} 
            icon={createCustomIcon(availableCount, isSelected, loc.name)}
            eventHandlers={{
              // 保留點擊 Marker 時篩選列表的功能
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                onPinClick(loc.id);
              }
            }}
          > 
            {/* NEW: 浮動 Glass Popover */}
            {availableCount > 0 && firstPost && (
              <Popup minWidth={250}>
                {/* MapPostPopup 將渲染 Popover 內容 */}
                <MapPostPopup 
                    post={firstPost} 
                    locationName={loc.name}
                />
                
                {/* 隱藏的 DOM 元素作為觸發詳情 Modal 的橋接點 */}
                <button 
                  id={`map-popup-detail-${firstPost.id}`} // 使用唯一 ID
                  onClick={() => setSelectedPost(firstPost)} 
                  className="hidden"
                ></button>
              </Popup>
            )}
          </Marker>
        );
      })}

      {userLocation && userLocation.lat && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
      )}
    </MapContainer>
  );
};

export default LeafletMap;