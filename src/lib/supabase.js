import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[食光機] 缺少 Supabase 環境變數。\n' +
    '請在專案根目錄建立 .env.local 檔案，內容：\n' +
    'VITE_SUPABASE_URL=https://你的專案.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=你的anon-key\n' +
    '然後重新啟動 dev server。'
  );
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;
