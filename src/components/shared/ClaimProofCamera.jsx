import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';

/**
 * 強制拍照存證 Modal
 * Mobile: capture="environment" 喚原生後鏡頭
 * Desktop: 退回普通 file picker (允許從相簿選)
 *
 * Props:
 *   onConfirm(file)  — 用戶確認後呼叫，外部負責壓縮上傳
 *   onCancel()
 *   isSubmitting     — 外層處理中時禁用按鈕
 */
const ClaimProofCamera = ({ onConfirm, onCancel, isSubmitting = false }) => {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openPicker = () => fileRef.current?.click();

  const handlePick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    e.target.value = ''; // 允許重拍同檔
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    openPicker();
  };

  const handleConfirm = () => {
    if (file) onConfirm(file);
  };

  return (
    <div className="fixed inset-0 z-[4000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-t-[32px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[90dvh] animate-in slide-in-from-bottom duration-300">

        {/* Header */}
        <div className="shrink-0 p-5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="font-black text-lg text-gray-900 dark:text-zinc-100">領取存證照</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-500">拍下「便當空景」或「手拿便當」</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="p-2 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 法律警示 */}
        <div className="mx-5 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-red-800 dark:text-red-300 font-bold">
            照片將作為**數位存證**，若遭舉報不實將永久停權帳號。
          </p>
        </div>

        {/* 預覽或拍照按鈕 */}
        <div className="flex-1 overflow-y-auto p-5">
          {!previewUrl ? (
            <button
              type="button"
              onClick={openPicker}
              className="w-full aspect-square rounded-3xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 flex flex-col items-center justify-center gap-3 transition-all active:scale-95 hover:bg-emerald-100/50"
            >
              <div className="w-20 h-20 rounded-3xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/40">
                <Camera className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-black text-emerald-700 dark:text-emerald-400">點擊拍照</span>
              <span className="text-[11px] text-gray-500">手機會喚出原生相機</span>
            </button>
          ) : (
            <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl">
              <img src={previewUrl} alt="存證預覽" className="w-full h-full object-cover" />
              <button
                onClick={handleRetake}
                disabled={isSubmitting}
                className="absolute top-3 right-3 px-3 py-2 bg-white/95 backdrop-blur rounded-full shadow flex items-center gap-1 text-xs font-bold text-gray-700 disabled:opacity-50"
              >
                <RotateCcw className="w-3 h-3" /> 重拍
              </button>
            </div>
          )}

          {/* 隱藏 file input；capture 屬性讓 mobile 喚相機 */}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handlePick}
            className="hidden"
          />
        </div>

        {/* CTA */}
        <div className="shrink-0 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-gray-100 dark:border-zinc-800 grid grid-cols-2 gap-3">
          <Button onClick={onCancel} variant="ghost" disabled={isSubmitting}>取消</Button>
          <Button
            onClick={handleConfirm}
            disabled={!file || isSubmitting}
            className="flex items-center justify-center gap-2"
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> 上傳中</> : '確認領取'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClaimProofCamera;
