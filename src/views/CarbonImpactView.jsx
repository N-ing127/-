import React from 'react';
import { ArrowLeft, Leaf, Info, Package, Utensils, ZapOff, Bike } from 'lucide-react';

const CarbonImpactView = ({ setActiveTab, profile }) => {
  const carbonSaved = (profile.stats.savedCount * 5.237).toFixed(2);

  const CarbonFactorRow = ({ label, icon: Icon, weight, factor, total, color }) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
          <p className="font-bold text-gray-800 dark:text-zinc-100 text-sm">{label}</p>
          <p className="text-[10px] text-gray-400">係數: {factor} kgCO₂e/kg</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-black text-gray-800 dark:text-zinc-100">{total} <span className="text-[10px] font-normal text-gray-400">kg</span></p>
        <p className="text-[10px] text-gray-500">份量: {weight}kg</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-zinc-950 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 p-4 pt-12 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => setActiveTab('profile')} className="p-2 -ml-2 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-500" />
        </button>
        <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100">碳足跡分析報告</h2>
      </div>

      <div className="p-5 space-y-6 overflow-y-auto pb-24">
        {/* 總結卡片 */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[32px] text-white shadow-xl shadow-emerald-500/20">
          <div className="flex justify-between items-start mb-4">
            <Leaf className="w-8 h-8 opacity-80" />
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">功能單位: 500g 熟食</span>
          </div>
          <p className="text-emerald-100 text-sm font-medium">您已累計減少碳排放</p>
          <h3 className="text-4xl font-black mt-1">{carbonSaved} <span className="text-lg font-normal">kgCO₂e</span></h3>
          <p className="text-[10px] mt-4 opacity-70 leading-relaxed">
            * 基準參考：一個台鐵便當規格 (480g±20g)<br/>
            * 地理範疇：國立台灣大學校總區
          </p>
        </div>

        {/* 盤查明細 */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Info className="w-3 h-3" /> 單份便當組成分析
          </h4>
          <CarbonFactorRow label="有機越光米" icon={Utensils} weight="0.20" factor="1.59" total="0.318" color="bg-blue-500" />
          <CarbonFactorRow label="豬肉 (主菜)" icon={Utensils} weight="0.13" factor="36.9" total="4.797" color="bg-red-500" />
          <CarbonFactorRow label="季節時蔬" icon={Utensils} weight="0.13" factor="0.40" total="0.052" color="bg-emerald-500" />
          <CarbonFactorRow label="紙製餐盒" icon={Package} weight="0.02" factor="3.50" total="0.070" color="bg-orange-500" />
          
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
            <span className="font-bold text-emerald-800 dark:text-emerald-400">總計單份排放量</span>
            <span className="font-black text-xl text-emerald-700 dark:text-emerald-300">5.237 kgCO₂e</span>
          </div>
        </div>

        {/* 排除範疇說明 */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-4 bg-gray-100 dark:bg-zinc-900 rounded-2xl flex flex-col items-center text-center">
            <ZapOff className="w-6 h-6 text-gray-400 mb-2" />
            <p className="text-[10px] font-bold text-gray-500 dark:text-zinc-400">平台營運與能耗<br/>(已相互抵銷不計)</p>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-zinc-900 rounded-2xl flex flex-col items-center text-center">
            <Bike className="w-6 h-6 text-gray-400 mb-2" />
            <p className="text-[10px] font-bold text-gray-500 dark:text-zinc-400">取餐交通能耗<br/>(校內單車近乎零排)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonImpactView;