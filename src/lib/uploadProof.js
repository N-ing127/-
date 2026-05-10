import { supabase } from './supabase';
import { compressImage } from './compressImage';

/**
 * 上傳領取存證照片到 claim-proofs bucket（不是 public）
 * 路徑格式：{userId}/{postId}-{timestamp}.webp
 * 回傳 storage path（給 RPC 用，舉報時 admin 用 signed URL 取）
 */
export async function uploadClaimProof(file, postId, userId) {
  if (!supabase || !file || !userId || !postId) {
    return { path: null, error: 'INVALID_ARGS' };
  }
  try {
    const compressed = await compressImage(file);
    const ext = (compressed.type.split('/')[1] || 'webp').replace('jpeg', 'jpg');
    const path = `${userId}/${postId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('claim-proofs')
      .upload(path, compressed, { contentType: compressed.type, upsert: false });
    if (error) {
      console.error('[uploadClaimProof] storage error:', error);
      return { path: null, error: error.message };
    }
    return { path, error: null };
  } catch (err) {
    console.error('[uploadClaimProof] unexpected:', err);
    return { path: null, error: err.message };
  }
}
