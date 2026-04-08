import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 如果 Supabase 未設定（缺少 env vars），直接結束 loading
    if (!supabase) {
      setLoading(false);
      return;
    }

    // 1. 取得目前 session（頁面重載後恢復登入狀態）
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. 訂閱 auth 狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // 首次註冊時自動建立 profile 記錄
        if (event === 'SIGNED_IN' && currentUser) {
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
        }
      }
    );

    return () => subscription.unsubscribe();
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
