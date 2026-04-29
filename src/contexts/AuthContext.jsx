import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let resolved = false;

    // 2 秒兜底：onAuthStateChange 的 INITIAL_SESSION 通常 < 100ms 觸發，
    // 沒觸發代表 supabase client 自己卡死，直接放行。
    const failsafeTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('[Auth] INITIAL_SESSION timeout — 強制放行');
        setLoading(false);
      }
    }, 2000);

    // 唯一資料源：onAuthStateChange (INITIAL_SESSION 從 localStorage 讀，不打網路)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // 首次觸發（INITIAL_SESSION）就放行 loading
        if (!resolved) {
          resolved = true;
          clearTimeout(failsafeTimer);
          setLoading(false);

          // ── 關鍵：背景強制 refresh token（防 reload 後拿到過期 token 導致 401）──
          // 不 await：UI 不卡，後續 API 呼叫自然用新 token
          if (currentUser) {
            supabase.auth.refreshSession().catch((err) =>
              console.warn('[Auth] background refresh failed:', err.message)
            );
          }
        }

        // 首次註冊時自動建立 profile（fire-and-forget，不卡 UI）
        if (event === 'SIGNED_IN' && currentUser) {
          try {
            const { data: existing } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', currentUser.id)
              .maybeSingle();

            if (!existing) {
              await supabase.from('profiles').insert({
                id:           currentUser.id,
                display_name: currentUser.email.split('@')[0],
                ntu_email:    currentUser.email,
              });
            }
          } catch (err) {
            console.error('[Auth] profile bootstrap failed:', err);
          }
        }
      }
    );

    return () => {
      clearTimeout(failsafeTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signUp  = (email, password) =>
    supabase?.auth.signUp({ email, password }) ??
    Promise.resolve({ error: { message: 'Supabase 未設定' } });

  const signIn  = (email, password) =>
    supabase?.auth.signInWithPassword({ email, password }) ??
    Promise.resolve({ error: { message: 'Supabase 未設定' } });

  const signOut = () =>
    supabase?.auth.signOut() ??
    Promise.resolve({ error: null });

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
