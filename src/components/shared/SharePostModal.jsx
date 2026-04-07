import React, { useRef, useState } from 'react';
import { X, Download, CheckCircle, MapPin, Clock, User, Sparkles } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import Button from '../ui/Button';
import { LOCATIONS } from '../../data/constants';

const SharePostModal = ({ post, onClose, triggerToast }) => {
  if (!post) return null;

  const cardRef = useRef();
  const [isDownloading, setIsDownloading] = useState(false);

  const location = LOCATIONS.find(loc => loc.id === post.locationId);
  const pickupDate = new Date(post.pickupTime);
  const expireDate = new Date(post.expireTime);

  const formattedTime = `${pickupDate.getHours().toString().padStart(2, '0')}:${pickupDate.getMinutes().toString().padStart(2, '0')} - ${expireDate.getHours().toString().padStart(2, '0')}:${expireDate.getMinutes().toString().padStart(2, '0')}`;
  const formattedDate = `${pickupDate.getMonth() + 1}/${pickupDate.getDate()}`;

  const handleDownloadImage = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      // 增加延遲確保 DOM 完全渲染
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await htmlToImage.toPng(cardRef.current, { 
        quality: 1,
        pixelRatio: 2, // 提高清晰度
        backgroundColor: '#09090b' 
      });
      const link = document.createElement('a');
      link.download = `惜食分享_${post.foodType}.png`;
      link.href = dataUrl;
      link.click();
      triggerToast('卡片已保存到相簿', 'success');
      onClose();
    } catch (error) {
      console.error('下載失敗:', error);
      triggerToast('下載失敗，請重試', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        {/* 頂部關閉按鈕 */}
        <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors">
          <X className="w-8 h-8" />
        </button>

        {/* 實際會被截圖的區域 */}
        <div 
          ref={cardRef} 
          className="w-full aspect-[3/4] bg-zinc-950 rounded-[40px] overflow-hidden relative shadow-2xl border border-white/10"
        >
          {/* 背景裝飾 */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 z-0"></div>
          
          <div className="relative z-10 h-full flex flex-col p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-black text-lg leading-none">TimeMachine</h1>
                <p className="text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase">食 光 機</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4 self-start">
                Campus Food Sharing
              </div>
              <h2 className="text-4xl font-black text-white mb-2 leading-tight">{post.foodType}</h2>
              <p className="text-zinc-400 font-medium mb-8">數量：{post.quantity} {post.unit}</p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">地點</p>
                    <p className="text-zinc-200 font-bold text-sm">{location?.name} · {post.locationDetail}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
                    <Clock className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">時間</p>
                    <p className="text-zinc-200 font-bold text-sm">{formattedDate} ({formattedTime})</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-zinc-400" />
                </div>
                <span className="text-zinc-400 text-xs font-medium">發布者：{post.provider}</span>
              </div>
              <Sparkles className="w-5 h-5 text-emerald-500/50" />
            </div>
          </div>
        </div>

        {/* 操作按鈕 (不包含在截圖內) */}
        <div className="w-full mt-8">
          <Button 
            onClick={handleDownloadImage} 
            disabled={isDownloading}
            className="w-full py-4 rounded-3xl bg-white text-black hover:bg-zinc-200 flex items-center justify-center gap-2 font-black transition-all active:scale-95"
          >
            {isDownloading ? (
              <div className="animate-spin text-xl">⌛</div>
            ) : (
              <>
                <Download className="w-5 h-5" />
                儲存分享圖片
              </>
            )}
          </Button>
          <p className="text-center text-white/40 text-[10px] mt-4 tracking-widest font-bold">
            邀請朋友一起參與台大惜食行動
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;