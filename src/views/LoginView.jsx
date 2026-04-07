import React, { useState } from 'react';
import { Leaf, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginView() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode]           = useState('login'); // 'login' | 'signup'
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
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
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        // onAuthStateChange 會自動更新 user，App 會自動切換到主畫面
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
        setSuccess('驗證信已寄出，請前往信箱確認後即可登入！');
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              placeholder="電子信箱"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm text-gray-800 dark:text-zinc-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="密碼（至少 6 字元）"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
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
              : (mode === 'login' ? '登入' : '建立帳號')
            }
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-gray-400 dark:text-zinc-600 text-center">
        使用即代表你同意食光機的服務條款
      </p>
    </div>
  );
}
