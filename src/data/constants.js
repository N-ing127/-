// constants.js

// 臺灣大學校園中心座標
export const NTU_CENTER = { lat: 25.0188, lng: 121.5408 };

// 地點清單 (新增、修正並更新座標)
export const LOCATIONS = [
  // 核心區
  { id: 'fu_bell', name: '傅鐘', lat: 25.0182, lng: 121.5390 },
  { id: 'admin_bldg', name: '行政大樓', lat: 25.0186, lng: 121.5398 },
  { id: 'xiaofu_sq', name: '小福', lat: 25.0175, lng: 121.5367 }, // 小福樓 -> 小福
  
  // 教學區
  { id: 'common_studies', name: '共同教學館', lat: 25.0189, lng: 121.5369 }, // 共同
  { id: 'boya_bldg', name: '博雅教學館', lat: 25.0163, lng: 121.5348 }, // 博雅
  { id: 'gen_teaching_bldg', name: '普通教學館', lat: 25.0199, lng: 121.5435 }, // 新增
  
  // 理工區
  { id: 'mech_eng_bldg', name: '機械系館', lat: 25.0181, lng: 121.5436 }, // 新增
];

// 重構後的成就定義 (略)
export const ACHIEVEMENTS_DATA = [
  { 
    id: 'first_share', 
    title: '初次發聲', 
    description: '成功發布第 1 筆惜食分享', 
    icon: 'Megaphone',
    color: 'bg-blue-500', 
    rule: { type: 'threshold', statKey: 'postedCount', targetValue: 1, operator: '>=' } 
  },
  { 
    id: 'food_saver_1', 
    title: '惜食見習生', 
    description: '累積領取滿 5 次食物', 
    icon: 'Leaf', 
    color: 'bg-emerald-500', 
    rule: { type: 'threshold', statKey: 'savedCount', targetValue: 5, operator: '>=' }
  },
  { 
    id: 'food_saver_2', 
    title: '不浪費大師', 
    description: '累積領取滿 10 次食物', 
    icon: 'Award', 
    color: 'bg-orange-500', 
    rule: { type: 'threshold', statKey: 'savedCount', targetValue: 10, operator: '>=' }
  },
  { 
    id: 'night_owl', 
    title: '校園夜貓子', 
    description: '在 22:00 後領取或發布食物', 
    icon: 'Moon', 
    color: 'bg-indigo-500', 
    rule: { type: 'threshold', statKey: 'nightOwlActions', targetValue: 1, operator: '>=' }
  }
];

// 食物種類 (已更新)
export const FOOD_TYPES = ['點心/烘焙', '正餐/主食', '水果/蔬菜', '飲品/湯品', '其他'];

// 預設標籤 (已更新)
export const PREDEFINED_TAGS = ['素食', '蛋奶素', ,'葷食', '需自備餐具', '需自備容器', '需微波'];

// 確保這裡的 ID 和類型同步：
export const INITIAL_POSTS = [
  {
    id: 1, provider: '教務處', locationId: 'admin_bldg', locationDetail: '2F 第一會議室',
    foodType: '點心/烘焙', quantity: '3', unit: '盒',
    pickupTime: new Date().toISOString(), startTime: new Date().toISOString(),
    expireTime: new Date(new Date().getTime() + 7200000).toISOString(),
    tags: ['蛋奶素'], status: 'available', note: '',
    timestamp: new Date().getTime() - 1000 * 60 * 15, imageColor: 'bg-orange-100', imageUrl: null
  },
  {
    id: 2, provider: '機械系學會', locationId: 'common_studies', locationDetail: '101 教室外',
    foodType: '正餐/主食', quantity: '5', unit: '個',
    pickupTime: new Date().toISOString(), startTime: new Date().toISOString(),
    expireTime: new Date(new Date().getTime() + 3600000).toISOString(),
    tags: ['需自備餐具'], status: 'available', note: '',
    timestamp: new Date().getTime() - 1000 * 60 * 5, imageColor: 'bg-blue-100', imageUrl: null
  }
];