import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, Shield, AlertOctagon, Ban, Flag, Loader2, User,
  UserCheck, UserX, RotateCcw,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';

const SectionCard = ({ icon: Icon, title, count, color, children }) => (
  <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-black text-base">{title}</h3>
        <p className="text-xs text-gray-500">{count} 筆</p>
      </div>
    </div>
    <div className="space-y-2">{children}</div>
  </div>
);

const AdminDashboardView = ({ setActiveTab, triggerToast }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);

  const refresh = useCallback(async () => {
    const { data: res, error } = await supabase.rpc('admin_list_disputes');
    if (error) { setError(error.message); return; }
    if (res?.error) { setError(res.error); return; }
    setData(res);
    setError(null);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Admin actions
  const handleUnshadowban = async (userId, name) => {
    if (!window.confirm(`解除 ${name || '此用戶'} 的 shadowban？\n所有針對該用戶的封鎖記錄將被清除。`)) return;
    setActingId(userId);
    try {
      const { data, error } = await supabase.rpc('admin_unshadowban', { p_user_id: userId });
      if (error || !data?.success) {
        triggerToast?.(data?.error === 'FORBIDDEN' ? '⛔ 非管理員' : '解封失敗', 'error');
        return;
      }
      triggerToast?.(`${name || '用戶'} 已解封`, 'success');
      await refresh();
    } finally {
      setActingId(null);
    }
  };

  const handleClearFlags = async (userId, name, count) => {
    if (!window.confirm(`清除 ${name || '此用戶'} 本月 ${count} 次標記？\n會回補 ${count * 5} 信任分。`)) return;
    setActingId(userId);
    try {
      const { data } = await supabase.rpc('admin_clear_flags', { p_user_id: userId });
      if (!data?.success) { triggerToast?.('清除失敗', 'error'); return; }
      triggerToast?.(`已清除 ${data.cleared} 次標記`, 'success');
      await refresh();
    } finally {
      setActingId(null);
    }
  };

  const handleToggleRole = async (userId, role, currentValue, name) => {
    const action = currentValue ? '撤銷' : '授予';
    const labelMap = { admin: 'Admin', partner: '白名單合作單位', hunter: '幽靈獵手' };
    if (!window.confirm(`${action} ${name || '此用戶'} 的「${labelMap[role]}」身份？`)) return;
    setActingId(userId);
    try {
      const { data } = await supabase.rpc('admin_set_role', {
        p_user_id: userId, p_role: role, p_value: !currentValue,
      });
      if (!data?.success) { triggerToast?.('操作失敗', 'error'); return; }
      triggerToast?.(`${action}「${labelMap[role]}」成功`, 'success');
      await refresh();
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-zinc-950">
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-zinc-800 p-4 pt-12 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => setActiveTab('profile')} className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800">
          <ChevronLeft className="w-6 h-6 text-gray-500" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Shield className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-black">後台管理</h2>
        </div>
        <button onClick={refresh} className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800">
          <RotateCcw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error === 'FORBIDDEN' ? '⛔ 非管理員身份' : `錯誤：${error}`}
          </div>
        )}

        {!data && !error && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {data && (
          <>
            <SectionCard icon={Ban} title="Shadowban 用戶" count={data.shadowbanned?.length ?? 0} color="bg-gray-700">
              {(data.shadowbanned ?? []).length === 0 && <p className="text-xs text-gray-400">無</p>}
              {(data.shadowbanned ?? []).map(p => (
                <div key={p.id} className="p-3 bg-stone-50 dark:bg-zinc-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{p.display_name}</p>
                      <p className="text-gray-400 text-[10px]">{p.ntu_email}</p>
                    </div>
                    <span className="text-[10px] text-gray-500">{new Date(p.shadowbanned_at).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => handleUnshadowban(p.id, p.display_name)}
                    disabled={actingId === p.id}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-lg flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {actingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                    解除 Shadowban
                  </button>
                </div>
              ))}
            </SectionCard>

            <SectionCard icon={Flag} title="本月被標記 ≥3 次" count={data.flagged_users?.length ?? 0} color="bg-red-500">
              {(data.flagged_users ?? []).length === 0 && <p className="text-xs text-gray-400">無</p>}
              {(data.flagged_users ?? []).map(p => (
                <div key={p.id} className="p-3 bg-stone-50 dark:bg-zinc-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{p.display_name}</p>
                      <p className="text-gray-400 text-[10px]">信任分 {p.trust_score}</p>
                    </div>
                    <span className="font-black text-red-600">{p.flagged_count_month} 次</span>
                  </div>
                  <button
                    onClick={() => handleClearFlags(p.id, p.display_name, p.flagged_count_month)}
                    disabled={actingId === p.id}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-lg flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {actingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                    清除標記 (+{p.flagged_count_month * 5} 信任)
                  </button>
                </div>
              ))}
            </SectionCard>

            <SectionCard icon={AlertOctagon} title="最近舉報" count={data.disputes?.length ?? 0} color="bg-orange-500">
              {(data.disputes ?? []).length === 0 && <p className="text-xs text-gray-400">無</p>}
              {(data.disputes ?? []).map(d => (
                <div key={d.id} className="p-3 bg-stone-50 dark:bg-zinc-800 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                      d.dispute_type === 'ghost_misreport' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {d.dispute_type === 'ghost_misreport' ? '撞單舉報' : '幽靈便當'}
                    </span>
                    <span className="text-gray-400 text-[10px]">{new Date(d.created_at).toLocaleString('zh-TW')}</span>
                  </div>
                  <p className="font-mono text-[10px] text-gray-500 break-all">距離 {Math.round(d.distance_m)}m · post {d.post_id?.slice(0,8)}</p>
                </div>
              ))}
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardView;
