import { INITIAL_POSTS } from '../data/constants';
import { delay } from '../utils/helpers';

const STORAGE_KEY = 'time_machine_posts_mock_db';

// 輔助函式：從 localStorage 載入或初始化資料
const getInitialPosts = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error("Failed to load mock posts from localStorage", e);
    }
    // 如果是第一次載入或載入失敗，使用初始數據並寫入 localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
    return INITIAL_POSTS;
};

// 模擬 DB 狀態 (在模組頂層聲明，確保單例)
let mockDatabase = getInitialPosts();

// 輔助函式：更新並儲存到 localStorage
const persistChanges = (newPosts) => {
    mockDatabase = newPosts;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockDatabase));
};


export const MockApiService = {
  
  // 修正：從持久化狀態中獲取貼文
  fetchPosts: async () => { 
    await delay(600); 
    // 返回持久化狀態的深拷貝，避免外部直接修改
    return JSON.parse(JSON.stringify(mockDatabase)); 
  },
  
  // 新增貼文並更新持久化狀態
  createPost: async (postData) => {
    await delay(800);
    const createdPost = { 
      ...postData, 
      id: Date.now(), 
      status: 'available', 
      timestamp: Date.now() 
    };
    
    // 將新貼文加到 DB 前端
    const newPosts = [createdPost, ...mockDatabase];
    persistChanges(newPosts);
    
    return createdPost;
  },
  
  // 更新貼文狀態並更新持久化狀態
  updatePostStatus: async (postId, status) => {
    await delay(500);
    // 模擬 5% 的隨機錯誤
    if (Math.random() > 0.95) throw new Error('網路連線不穩定，請重試');
    
    // 尋找並更新貼文狀態
    const newPosts = mockDatabase.map(p => 
      p.id === postId ? { ...p, status: status } : p
    );
    
    persistChanges(newPosts);
    
    return { id: postId, status };
  }
};