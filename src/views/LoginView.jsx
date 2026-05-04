import React, { useState, useEffect } from 'react';
import { Leaf, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginView() {
  const { signIn, signUp, resetPassword, updateUser, signOut } = useAuth();

  const [mode, setMode]           = useState('login'); // 'login' | 'signup' | 'reset'
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // ── 註冊時驗證 NTU 信箱 ──
      if (mode === 'signup') {
        if (!email.toLowerCase().endsWith('@ntu.edu.tw')) {
          setError('請使用 NTU 信箱註冊（@ntu.edu.tw）');
          setIsLoading(false);
          return;
        }
      }

      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        // onAuthStateChange 會自動更新 user，App 會自動切換到主畫面
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setSuccess('驗證信已寄出，請前往信箱確認後即可登入！');
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setSuccess('密碼重設信已寄出，請檢查信箱並按照指示重新設置密碼！');
        setEmail('');
      } else if (mode === 'recover') {
        // 確認兩次密碼一致
        if (!password || password.length < 6) {
          setError('密碼至少需 6 個字元');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('兩次密碼不一致');
          setIsLoading(false);
          return;
        }
        const { error } = await updateUser({ password });
        if (error) throw error;
        // 為安全起見，更新完密碼後先登出，並導回登入畫面
        await signOut();
        setSuccess('密碼已更新，請使用新密碼登入');
        setMode('login');
      }
    } catch (err) {
      const messages = {
        'Invalid login credentials':    '信箱或密碼錯誤',
        'Email not confirmed':           '請先驗證信箱',
        'User already registered':       '此信箱已註冊，請直接登入',
        'Password should be at least 6 characters': '密碼至少需 6 個字元',
      };
      setError(messages[err.message] ?? err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 偵測 Supabase recovery redirect（type=recovery）自動切換到輸入新密碼模式
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('type') === 'recovery') {
        setMode('recover');
        // 清掉 query 參數避免重複處理
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, document.title, url.toString());
      }
    } catch (e) {}
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-stone-50 dark:bg-zinc-950 px-6">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[28px] flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Leaf className="w-10 h-10 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-800 dark:text-zinc-100 tracking-tight">食光機</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">台大校園剩食分享平台</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-6 space-y-5">
        {/* Tab 切換 */}
        {mode !== 'reset' && (
          <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-2xl p-1">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                  mode === m
                    ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-gray-500 dark:text-zinc-400'
                }`}
              >
                {m === 'login' ? '登入' : '註冊'}
              </button>
            ))}
          </div>
        )}
        {mode === 'reset' && (
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 dark:text-zinc-100 mb-1">重設密碼</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">輸入註冊信箱以接收重設連結</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              placeholder={mode === 'reset' ? '註冊信箱' : (mode === 'signup' ? 'NTU信箱（必須）' : '您註冊的NTU信箱')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              pattern={mode === 'signup' ? '.*@ntu\.edu\.tw$' : undefined}
              className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
            />
          </div>

          {/* Password - 在 login/signup/recover 顯示 */}
          {(mode !== 'reset') && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="密碼（至少 6 字元）"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required={mode !== 'reset'}
                minLength={6}
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          )}

          {/* 確認密碼 - 只在 recover 模式顯示 */}
          {mode === 'recover' && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="再次輸入新密碼"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              />
            </div>
          )}

          {/* Error / Success */}
          {error   && <p className="text-xs text-red-500 text-center font-medium">{error}</p>}
          {success && <p className="text-xs text-emerald-600 text-center font-medium">{success}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : (mode === 'login' ? '登入' : mode === 'signup' ? '建立帳號' : '發送重設信')
            }
          </button>

          {/* 忘記密碼連結 - 只在 login 模式顯示 */}
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => { setMode('reset'); setError(''); setSuccess(''); setPassword(''); }}
              className="w-full text-center text-sm text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
            >
              忘記密碼？
            </button>
          )}

          {/* 返回登入連結 - 只在 reset 模式顯示 */}
          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="w-full text-center text-sm text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
            >
              回到登入
            </button>
          )}
        </form>
      </div>

      <p className="mt-6 text-xs text-gray-400 dark:text-zinc-600 text-center">
        使用即代表你同意食光機的服務條款
      </p>
    </div>
  );
}
