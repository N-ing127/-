import { useState, useEffect } from 'react';
import { INITIAL_POSTS } from '../data/constants';

export const usePosts = (triggerToast) => {
  const [posts, setPosts] = useState(() => {
    const saved = localStorage.getItem('time-machine-posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [isLoading, setIsLoading] = useState(false);

  // 持久化儲存
  useEffect(() => {
    localStorage.setItem('time-machine-posts', JSON.stringify(posts));
  }, [posts]);

  /**
   * 核心功能：自動清理已領取超過 10 分鐘的貼文
   */
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const tenMinutesInMs = 10 * 60 * 1000;

      setPosts(currentPosts => {
        const filtered = currentPosts.filter(post => {
          // 如果貼文已領取，且存有 takenAt 時間
          if (post.status === 'taken' && post.takenAt) {
            const timePassed = now - post.takenAt;
            // 超過 10 分鐘就濾掉 (回傳 false)
            return timePassed < tenMinutesInMs;
          }
          // 其他狀態（available, reserved）或是剛領取還沒到時間的都保留
          return true;
        });

        // 只有在數量有變動時才更新 state，避免不必要的重新渲染
        return filtered.length !== currentPosts.length ? filtered : currentPosts;
      });
    }, 60000); // 每 60 秒檢查一次

    return () => clearInterval(cleanupInterval);
  }, []);

  const updatePostStatus = async (post, newStatus) => {
    setIsLoading(true);
    try {
      // 模擬網路延遲
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setPosts(prev => prev.map(p => {
        if (p.id === post.id) {
          return { 
            ...p, 
            status: newStatus,
            // 如果狀態變為已領取，記錄當下的時間戳記
            takenAt: newStatus === 'taken' ? Date.now() : p.takenAt 
          };
        }
        return p;
      }));
      return true;
    } catch (error) {
      triggerToast('更新失敗', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addPost = async (newPost) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPosts(prev => [newPost, ...prev]);
      return true;
    } catch (error) {
      triggerToast('發布失敗', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { posts, isLoading, updatePostStatus, addPost };
};