import { supabase } from './supabase';

/**
 * 上傳圖片到 Supabase Storage 並回傳公開 URL
 * @param {File} file - 來自 input[type=file] 的 File 物件
 * @returns {Promise<string|null>} 公開圖片 URL，失敗回傳 null
 */
export async function uploadFoodImage(file) {
  try {
    if (!supabase || !file) return null;

    // 產生唯一檔名：timestamp-randomId.ext
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `posts/${fileName}`;

    // 上傳到 food-images bucket
    const { error } = await supabase.storage
      .from('food-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Image upload error:', error);
      return null;
    }

    // 取得公開 URL
    const { data } = supabase.storage
      .from('food-images')
      .getPublicUrl(filePath);

    return data?.publicUrl ?? null;
  } catch (err) {
    console.error('uploadFoodImage unexpected error:', err);
    return null;
  }
}
