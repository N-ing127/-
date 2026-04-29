import { supabase } from './supabase';

// 跨瀏覽器可顯示的格式白名單（HEIC/HEIF 排除：Chrome/Firefox/Edge 無法 render）
const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 5;

/**
 * 上傳圖片到 Supabase Storage 並回傳公開 URL
 * @param {File} file
 * @returns {Promise<{ url: string|null, error: string|null }>}
 */
export async function uploadFoodImage(file) {
  try {
    if (!supabase) return { url: null, error: 'Supabase 未設定' };
    if (!file)     return { url: null, error: '沒有選擇檔案' };

    // ── 1. MIME 白名單（防 HEIC / 未知格式）────────────────────────
    const mime = (file.type || '').toLowerCase();
    if (!ACCEPTED_MIME.includes(mime)) {
      return {
        url: null,
        error: 'iPhone 拍照請改 JPG 格式（設定→相機→格式→相容性最佳），或選 PNG/WEBP'
      };
    }

    // ── 2. 大小檢查（Supabase Storage RLS / Free tier 上限）──────
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return { url: null, error: `檔案過大（>${MAX_SIZE_MB}MB），請壓縮後重試` };
    }

    // ── 3. 由 MIME 決定副檔名（避免 file.name 沒副檔名 / 非預期值）─
    const extMap = {
      'image/jpeg': 'jpg',
      'image/png':  'png',
      'image/webp': 'webp',
      'image/gif':  'gif',
    };
    const ext = extMap[mime];
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `posts/${fileName}`;

    // ── 4. 上傳 ──────────────────────────────────────────────────
    const { error: uploadErr } = await supabase.storage
      .from('food-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType:  mime,
        upsert:       false,
      });

    if (uploadErr) {
      console.error('[uploadFoodImage] upload error:', uploadErr);
      return { url: null, error: `上傳失敗：${uploadErr.message}` };
    }

    // ── 5. 取得公開 URL（bucket 必須為 public，否則此 URL 會 403）──
    const { data } = supabase.storage.from('food-images').getPublicUrl(filePath);
    if (!data?.publicUrl) {
      return { url: null, error: '無法取得圖片 URL（請確認 bucket 為 public）' };
    }

    return { url: data.publicUrl, error: null };
  } catch (err) {
    console.error('[uploadFoodImage] unexpected:', err);
    return { url: null, error: '未預期錯誤，請重試' };
  }
}
