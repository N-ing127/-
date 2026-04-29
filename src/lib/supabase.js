import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[食光機] 缺少 Supabase 環境變數。\n' +
    '請在專案根目錄建立 .env.local 檔案，內容：\n' +
    'VITE_SUPABASE_URL=https://你的專案.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=你的anon-key\n' +
    '然後重新啟動 dev server。'
  );
}

// localStorage 防呆 wrapper：Safari Private / 隱私模式下 setItem 會 throw
const safeStorage = {
  getItem: (k) => {
    try { return globalThis.localStorage?.getItem(k) ?? null; } catch { return null; }
  },
  setItem: (k, v) => {
    try { globalThis.localStorage?.setItem(k, v); } catch {}
  },
  removeItem: (k) => {
    try { globalThis.localStorage?.removeItem(k); } catch {}
  },
};

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage:            safeStorage,
        persistSession:     true,
        autoRefreshToken:   true,
        detectSessionInUrl: true,
      },
      // 明確較短超時（global fetch wrapper），避免請求無限掛起
      global: {
        fetch: (input, init = {}) => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10_000); // 10s
          return fetch(input, { ...init, signal: controller.signal })
            .finally(() => clearTimeout(timeout));
        },
      },
    })
  : null;
