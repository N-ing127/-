import { useState, useEffect } from 'react';
import { MockApiService } from '../services/api';

export const usePosts = (triggerToast) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        // 從持久化 Mock API 獲取數據
        const data = await MockApiService.fetchPosts();
        if (isMounted) {
          setPosts(data);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) triggerToast('無法載入貼文', 'error');
        setIsLoading(false);
      }
    };

    loadData();

    // 輪詢機制 (每 30 秒更新)
    const intervalId = setInterval(loadData, 30000);
    return () => { isMounted = false; clearInterval(intervalId); };
  }, [triggerToast]);

  const updatePostStatus = async (post, newStatus) => {
    const originalPosts = [...posts];
    
    // 樂觀更新 (假設成功)
    const updatedPosts = posts.map(p => p.id === post.id ? { ...p, status: newStatus } : p);
    setPosts(updatedPosts);

    try {
      // 呼叫 API，API 會更新其內部持久化狀態
      await MockApiService.updatePostStatus(post.id, newStatus);
      return true;
    } catch (error) {
      // 失敗回滾
      setPosts(originalPosts); 
      triggerToast(error.message, 'error');
      return false;
    }
  };

  const addPost = async (newPostData) => {
    try {
      // 呼叫 API，API 會創建貼文並更新其內部持久化狀態
      const createdPost = await MockApiService.createPost(newPostData);
      // 確保狀態被更新 (新貼文放在最前面)
      setPosts(prev => [createdPost, ...prev]);
      return true;
    } catch (error) {
      triggerToast('發布失敗，請稍後再試', 'error');
      return false;
    }
  };

  return { posts, isLoading, updatePostStatus, addPost };
};