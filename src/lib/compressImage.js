// 純 Canvas 圖片壓縮 (零依賴)
// 設計原則：
//  1. 短邊 ≤ MAX_DIMENSION (1280px) — 維持顯示清晰度，大幅縮檔
//  2. 輸出 WebP quality 0.82 — Chrome/Edge/Firefox/Safari 14+ 通用
//  3. 自動 EXIF orientation 修正（瀏覽器 createImageBitmap 預設處理）
//  4. 失敗 fallback 為原檔（不阻擋上傳）

const MAX_DIMENSION = 1280;
const QUALITY = 0.82;
const OUTPUT_TYPE = 'image/webp';

/**
 * 壓縮圖片 File，回傳新 File（仍為 File instance，可直接給 supabase.storage.upload）
 * @param {File} file
 * @returns {Promise<File>} 壓縮後 File；若壓縮失敗回傳原檔
 */
export async function compressImage(file) {
  if (!file || !file.type?.startsWith('image/')) return file;

  // 已經很小 (< 300KB) 直接跳過
  if (file.size < 300 * 1024) return file;

  try {
    // createImageBitmap 比 Image 物件快、自動處理 EXIF orientation
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

    // 計算目標尺寸（短邊鎖 MAX_DIMENSION）
    const { width: w, height: h } = bitmap;
    const scale = Math.min(1, MAX_DIMENSION / Math.min(w, h));
    const targetW = Math.round(w * scale);
    const targetH = Math.round(h * scale);

    // 用 OffscreenCanvas（比 DOM canvas 快，支援 worker），fallback DOM canvas
    const canvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(targetW, targetH)
      : Object.assign(document.createElement('canvas'), { width: targetW, height: targetH });

    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close?.();

    // 輸出 Blob
    let blob;
    if (canvas.convertToBlob) {
      blob = await canvas.convertToBlob({ type: OUTPUT_TYPE, quality: QUALITY });
    } else {
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, OUTPUT_TYPE, QUALITY)
      );
    }
    if (!blob) return file;

    // 若壓縮後反而變大（罕見，極小圖時 webp overhead），回傳原檔
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], newName, { type: OUTPUT_TYPE, lastModified: Date.now() });
  } catch (err) {
    console.warn('[compressImage] failed, fallback to original:', err.message);
    return file;
  }
}
