import { LOCATIONS } from '../data/constants';

/**
 * DB row → 前端 Post 物件（含向後相容欄位）
 * 從 usePosts.js 抽出，給 useGhostStates 等其他 hook 共用
 */
export const mapPost = (raw) => {
  const locName = raw.location_name ?? '';
  const mainLocName = locName.split(' · ')[0];
  const matchedLoc = LOCATIONS.find(l => l.name === mainLocName);
  const posterName = raw.profiles?.display_name ?? '匿名食光人';

  return {
    id:           raw.id,
    posterId:     raw.poster_id,
    title:        raw.title,
    foodType:     raw.food_type,
    tags:         raw.tags ?? [],
    quantity:     raw.quantity,
    description:  raw.description,
    imageUrl:     raw.image_url,
    lat:          parseFloat(raw.latitude),
    lng:          parseFloat(raw.longitude),
    locationName: raw.location_name,
    status:       raw.status,
    expiresAt:    raw.expires_at,
    createdAt:    raw.created_at,
    // 向後相容
    locationId:     matchedLoc?.id ?? null,
    locationDetail: locName.includes(' · ') ? locName.split(' · ')[1] : raw.description,
    provider:       posterName,
    pickupTime:     raw.created_at,
    expireTime:     raw.expires_at,
    unit:           '份',
    imageColor:     'bg-emerald-100',
    // Phase 1: 模糊化座標
    coarseLat:      raw.coarse_lat ? parseFloat(raw.coarse_lat) : null,
    coarseLng:      raw.coarse_lng ? parseFloat(raw.coarse_lng) : null,
    coarseLabel:    raw.coarse_label ?? mainLocName ?? '校園附近',
  };
};
