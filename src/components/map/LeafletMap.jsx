import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LOCATIONS, NTU_CENTER } from '../../data/constants';

// 自定義 Marker 圖示
const createCustomIcon = (status, hasFood) => {
  let color = '#d1d5db'; 
  let scale = 'scale-75';

  if (hasFood) {
    color = '#10b981'; 
    scale = 'scale-100';
    if (status === 'reserved') {
      color = '#f59e0b'; 
      scale = 'scale-110';
    }
  }

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center ${scale} transition-all duration-300">
        ${status === 'reserved' ? '<div class="absolute w-10 h-10 bg-amber-400/40 rounded-full animate-ping"></div>' : ''}
        <div class="w-7 h-7 bg-white dark:bg-zinc-900 rounded-full shadow-md flex items-center justify-center border-2" style="border-color: ${color}">
          <div class="w-3.5 h-3.5 rounded-full" style="background-color: ${color}"></div>
        </div>
      </div>
    `,
    className: 'custom-marker-wrapper',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// 地圖自動縮放控制器：支援系館聚焦與定位聚焦
function MapUpdater({ filterLoc, userLocation }) {
  const map = useMap();
  
  useEffect(() => {
    if (filterLoc) {
      const loc = LOCATIONS.find(l => l.id === filterLoc);
      if (loc) {
        map.flyTo([loc.lat, loc.lng], 18, {
          animate: true,
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    }
  }, [filterLoc, map]);

  useEffect(() => {
    // 當 userLocation 改變（且沒有選中特定系館時），聚焦回使用者
    if (userLocation && !filterLoc) {
      map.flyTo([userLocation.lat, userLocation.lng], 17, {
        animate: true,
        duration: 1.0
      });
    }
  }, [userLocation, map]);

  return null;
}

// 精確質押 marker（金幣圖示，僅自己看得到）
const stakedPreciseIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-12 h-12 bg-amber-400/30 rounded-full animate-ping"></div>
      <div class="w-9 h-9 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full shadow-xl shadow-amber-500/50 flex items-center justify-center border-[3px] border-white">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="8"/><path d="M9 9h6"/><path d="M9 12h6"/><path d="M9 15h4"/>
        </svg>
      </div>
    </div>
  `,
  className: 'staked-marker-wrapper',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Phase 3: Ghost marker (灰色殘影，已被別人領走、結算中)
const ghostIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center opacity-70">
      <div class="w-9 h-9 bg-gray-400 rounded-full shadow-lg flex items-center justify-center border-[3px] border-white/80" style="filter: grayscale(100%);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 2a7 7 0 0 0-7 7v11l3-3 3 3 3-3 3 3 3-3 3 3V9a7 7 0 0 0-7-7H9z"/>
          <circle cx="9" cy="10" r="1.5" fill="white"/>
          <circle cx="15" cy="10" r="1.5" fill="white"/>
        </svg>
      </div>
    </div>
  `,
  className: 'ghost-marker-wrapper',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const LeafletMap = ({
  posts, userLocation, filterLoc, onPinClick,
  stakedPostIds = new Set(), revealedCoords = {}, onPostClick,
  ghostPosts = [],
}) => {
  // 我已質押 + 有揭露座標的 posts
  const stakedPosts = (posts || []).filter(p =>
    stakedPostIds.has(p.id) && (revealedCoords[p.id] || (p.lat && p.lng))
  );

  return (
    <MapContainer
      center={[NTU_CENTER.lat, NTU_CENTER.lng]}
      zoom={16}
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      <MapUpdater filterLoc={filterLoc} userLocation={userLocation} />

      {/* 第一層：地標模糊聚合 (所有人看得到) */}
      {LOCATIONS.map(loc => {
        const locPosts = (posts || []).filter(p => p.locationId === loc.id && p.status !== 'taken');
        const hasFood = locPosts.length > 0;
        const hasReserved = locPosts.some(p => p.status === 'reserved');

        return (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={createCustomIcon(hasReserved ? 'reserved' : 'available', hasFood)}
            eventHandlers={{ click: () => onPinClick(loc.id) }}
          >
            <Tooltip
              permanent={hasFood}
              direction="top"
              offset={[0, -12]}
              className={`border-none shadow-none bg-transparent font-bold text-[11px] ${hasFood ? 'text-emerald-700 dark:text-emerald-400 opacity-100' : 'text-gray-400 opacity-60'}`}
            >
              {loc.name}
            </Tooltip>
            {hasFood && (
              <Popup>
                <div className="p-1 font-sans">
                  <p className="font-bold border-b pb-1 mb-1">{loc.name}</p>
                  <p className="text-[10px] text-gray-500">有 {locPosts.length} 份惜食物資</p>
                </div>
              </Popup>
            )}
          </Marker>
        );
      })}

      {/* 第二層：我已質押的 posts 精確 marker (僅自己看得到) */}
      {stakedPosts.map(p => {
        const coord = revealedCoords[p.id] ?? { lat: p.lat, lng: p.lng };
        return (
          <Marker
            key={`staked-${p.id}`}
            position={[coord.lat, coord.lng]}
            icon={stakedPreciseIcon}
            eventHandlers={onPostClick ? { click: () => onPostClick(p) } : undefined}
            zIndexOffset={1000}
          >
            <Tooltip direction="top" offset={[0, -18]} className="bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[11px] px-2 py-1 rounded shadow">
              {p.foodType} · 已質押
            </Tooltip>
          </Marker>
        );
      })}

      {/* 第三層：Ghost markers — 我 stake 過、被別人領走 pending 中 */}
      {ghostPosts.filter(g => g.lat && g.lng).map(g => (
        <Marker
          key={`ghost-${g.id}`}
          position={[g.lat, g.lng]}
          icon={ghostIcon}
          eventHandlers={onPostClick ? { click: () => onPostClick(g) } : undefined}
          zIndexOffset={900}
        >
          <Tooltip direction="top" offset={[0, -18]} className="bg-gray-50 border border-gray-300 text-gray-700 font-bold text-[11px] px-2 py-1 rounded shadow">
            {g.foodType} · 結算中
          </Tooltip>
        </Marker>
      ))}

      <Marker
        position={[userLocation.lat, userLocation.lng]}
        icon={L.divIcon({
          html: '<div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg"></div>',
          className: 'user-marker',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })}
      />
    </MapContainer>
  );
};

export default LeafletMap;