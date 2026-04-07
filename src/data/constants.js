// constants.js

// 臺灣大學校園中心 (傅鐘附近)
export const NTU_CENTER = { lat: 25.01737, lng: 121.53915 };

// 精確校對後的校園地點座標
export const LOCATIONS = [
  { id: 'fu_bell', name: '傅鐘', lat: 25.01737, lng: 121.53915 },
  { id: 'admin_bldg', name: '行政大樓', lat: 25.01725, lng: 121.54045 },
  { id: 'xiaofu_sq', name: '小福廣場', lat: 25.01768, lng: 121.53690 },
  { id: 'common_studies', name: '共同教學館', lat: 25.01575, lng: 121.53765 },
  { id: 'boya_bldg', name: '博雅教學館', lat: 25.01895, lng: 121.53655 },
  { id: 'gen_teaching_bldg', name: '普通教學館', lat: 25.02085, lng: 121.53735 },
  { id: 'mech_eng_bldg', name: '機械工程系館', lat: 25.01890, lng: 121.54135 },
  { id: 'main_lib', name: '總圖書館', lat: 25.01615, lng: 121.54055 },
  { id: 'social_sci', name: '社科院', lat: 25.02105, lng: 121.54275 },
  { id: 'ee_bldg_2', name: '電機二館', lat: 25.01875, lng: 121.54315 },
];

export const ACHIEVEMENTS_DATA = [
  { id: 'first_share', title: '初次發聲', description: '成功發布第 1 筆惜食分享', icon: 'Megaphone', color: 'bg-blue-500' },
  { id: 'food_saver_1', title: '惜食見習生', description: '累積領取滿 5 次食物', icon: 'Leaf', color: 'bg-emerald-500' },
  { id: 'food_saver_2', title: '不浪費大師', description: '累積領取滿 10 次食物', icon: 'Award', color: 'bg-orange-500' },
  { id: 'night_owl', title: '校園夜貓子', description: '在 22:00 後領取或發布食物', icon: 'Moon', color: 'bg-indigo-500' }
];

export const FOOD_TYPES = ['點心/烘焙', '正餐/主食', '水果/蔬菜', '飲品/湯品', '其他'];
export const PREDEFINED_TAGS = ['素食', '蛋奶素', '葷食', '需自備餐具', '需自備容器', '需微波'];

export const INITIAL_PROFILE = {
  name: '台大惜食者',
  department: '工學院 · 機械工程系',
  avatar: null,
  banner: null,
  stats: { level: 1, exp: 450, nextLevelExp: 1000, savedCount: 12, savedWeight: 4.8, nightOwlActions: 5 },
  unlockedAchievements: ['food_saver_1'],
  settings: { showNearbyAlert: true, subscribedLocs: [], subscribedUsers: [], subscribedFoodTypes: [] }
};

// 建議：將你的照片放到 public/images/ 資料夾，並確保檔名對應
export const INITIAL_POSTS = [
  {
    id: 101,
    foodType: '正餐/主食',
    quantity: 2,
    unit: '份',
    locationId: 'mech_eng_bldg',
    locationDetail: '一樓大廳販賣機旁',
    provider: '機械系學會',
    status: 'available',
    timestamp: Date.now() - 3600000,
    pickupTime: new Date(Date.now() - 3600000).toISOString(),
    expireTime: new Date(Date.now() + 7200000).toISOString(),
    tags: ['葷食', '需自備餐具'],
    imageUrl: '/images/food1.jpg', 
    imageColor: 'bg-orange-100'
  },
  {
    id: 102,
    foodType: '點心/烘焙',
    quantity: 5,
    unit: '個',
    locationId: 'main_lib',
    locationDetail: '正門口左側石椅',
    provider: '總圖之友',
    status: 'available',
    timestamp: Date.now() - 1800000,
    pickupTime: new Date(Date.now() - 1800000).toISOString(),
    expireTime: new Date(Date.now() + 10800000).toISOString(),
    tags: ['蛋奶素', '需自備容器'],
    imageUrl: '/images/food2.jpg',
    imageColor: 'bg-emerald-100'
  },
  {
    id: 103,
    foodType: '飲品/湯品',
    quantity: 1,
    unit: '公升',
    locationId: 'social_sci',
    locationDetail: '辜振甫圖書館 2樓',
    provider: '社科院辦公室',
    status: 'available',
    timestamp: Date.now() - 5400000,
    pickupTime: new Date(Date.now() - 5400000).toISOString(),
    expireTime: new Date(Date.now() + 3600000).toISOString(),
    tags: ['需自備容器'],
    imageUrl: '/images/food3.jpg',
    imageColor: 'bg-blue-100'
  },
  {
    id: 104,
    foodType: '水果/蔬菜',
    quantity: 3,
    unit: '盒',
    locationId: 'xiaofu_sq',
    locationDetail: '二樓休息區',
    provider: '生農學院代表',
    status: 'available',
    timestamp: Date.now() - 2400000,
    pickupTime: new Date(Date.now() - 2400000).toISOString(),
    expireTime: new Date(Date.now() + 5400000).toISOString(),
    tags: ['素食'],
    imageUrl: '/images/food4.jpg',
    imageColor: 'bg-red-100'
  },
  {
    id: 105,
    foodType: '正餐/主食',
    quantity: 4,
    unit: '份',
    locationId: 'boya_bldg',
    locationDetail: '101教室後方',
    provider: '通識教育中心',
    status: 'reserved',
    timestamp: Date.now() - 600000,
    pickupTime: new Date(Date.now() - 600000).toISOString(),
    expireTime: new Date(Date.now() + 1800000).toISOString(),
    tags: ['葷食'],
    imageUrl: '/images/food5.jpg',
    imageColor: 'bg-teal-100'
  },
  {
    id: 106,
    foodType: '點心/烘焙',
    quantity: 10,
    unit: '片',
    locationId: 'ee_bldg_2',
    locationDetail: '三樓交誼廳',
    provider: '電機系辦',
    status: 'taken',
    timestamp: Date.now() - 7200000,
    pickupTime: new Date(Date.now() - 7200000).toISOString(),
    expireTime: new Date(Date.now() - 3600000).toISOString(),
    tags: ['蛋奶素'],
    imageUrl: '/images/food6.jpg',
    imageColor: 'bg-amber-100'
  }
];