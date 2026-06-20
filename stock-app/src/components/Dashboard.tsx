import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PortfolioItem, PortfolioSummary } from '../types';
import { TrendingUp, TrendingDown, Wallet, Award, ArrowUpRight, ArrowDownRight, PieChart as PieIcon } from 'lucide-react';

interface DashboardProps {
  items: PortfolioItem[];
  summary: PortfolioSummary;
}

// 미래형 금융 플랫폼 스타일의 리치 네온/사이버 팝 컬러 팔레트
const GRADIENT_COLORS = [
  '#6366f1', // Cyber Indigo
  '#10b981', // Neon Emerald
  '#8b5cf6', // Electric Purple
  '#3b82f6', // Bright Blue
  '#f43f5e', // Cyber Rose
  '#06b6d4', // Neon Cyan
  '#f59e0b', // Amber Gold
  '#ec4899', // Hot Pink
];

export const Dashboard: React.FC<DashboardProps> = ({ items, summary }) => {
  const hasData = items.length > 0;

  const chartData = items
    .map((item) => ({
      name: item.name,
      ticker: item.ticker,
      value: Math.max(0, item.totalAmount),
    }))
    .filter((data) => data.value > 0);

  const isProfit = summary.totalProfit >= 0;

  const formatValue = (val: number) => {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. 요약 카드 섹션 (Bento Grid Style with Glowing Borders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 총 투자 원금 */}
        <div className="trendy-card trendy-card-hover p-6 flex flex-col justify-between h-40 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-450">
              총 투자 원금
            </span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-2xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
              {formatValue(summary.totalInvestment)}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">누적 투입 현금 자산</p>
          </div>
        </div>

        {/* 총 평가 자산 */}
        <div className="trendy-card trendy-card-hover p-6 flex flex-col justify-between h-40 border-l-4 border-l-violet-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-450">
              총 평가 자산
            </span>
            <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 text-violet-650 dark:text-violet-400 rounded-2xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 dark:from-white dark:via-slate-100 dark:to-indigo-200">
              {formatValue(summary.totalValue)}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">실시간 기준 평가 가치</p>
          </div>
        </div>

        {/* 누적 평가 손익 */}
        <div className={`trendy-card trendy-card-hover p-6 flex flex-col justify-between h-40 border-l-4 ${
          isProfit ? 'border-l-emerald-500' : 'border-l-rose-500'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-450">
              누적 평가 손익
            </span>
            <div className={`p-2.5 rounded-2xl ${
              isProfit 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
            }`}>
              {isProfit ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-extrabold tracking-tight font-sans ${
              isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {summary.totalProfit > 0 ? '+' : ''}{formatValue(summary.totalProfit)}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">평가 손익 차액</p>
          </div>
        </div>

        {/* 누적 수익률 */}
        <div className={`trendy-card trendy-card-hover p-6 flex flex-col justify-between h-40 border-l-4 ${
          isProfit ? 'border-l-emerald-500' : 'border-l-rose-500'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-450">
              누적 수익률
            </span>
            <div className={`p-2.5 rounded-2xl ${
              isProfit 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
            }`}>
              {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-4">
            <h3 className={`text-2xl font-extrabold tracking-tight font-sans ${
              isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {summary.totalProfit > 0 ? '+' : ''}{summary.totalProfitRate.toFixed(2)}%
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">원금 대비 수익률</p>
          </div>
        </div>
      </div>

      {/* 2. 자산 비중 차트 섹션 (Glassmorphism layout) */}
      <div className="trendy-card p-6 md:p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-650 dark:text-indigo-400">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-450 dark:text-slate-400">포트폴리오 자산 비중</h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">보유 중인 주식 자산 분산도</p>
          </div>
        </div>

        {hasData && chartData.length > 0 ? (
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            {/* 차트 영역 */}
            <div className="w-full lg:w-1/2 h-72 relative flex items-center justify-center">
              {/* 차트 중앙 글래스 서클 */}
              <div className="absolute flex flex-col items-center justify-center text-center select-none bg-white/60 dark:bg-[#121320]/60 backdrop-blur-md border border-slate-200/40 dark:border-slate-800/40 rounded-full w-32 h-32 shadow-xl">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  총 평가 자산
                </span>
                <span className="text-lg font-extrabold text-slate-800 dark:text-white mt-1">
                  {formatValue(summary.totalValue)}
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={76}
                    outerRadius={104}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((_entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={GRADIENT_COLORS[index % GRADIENT_COLORS.length]} 
                        className="focus:outline-none hover:opacity-90 transition-opacity duration-200 cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${formatValue(Number(value))}`, '평가액']}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 17, 28, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      color: '#f8fafc',
                      fontSize: '11px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    }}
                    itemStyle={{ color: '#f8fafc' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 범례 리스트 */}
            <div className="w-full lg:w-1/2 max-h-72 overflow-y-auto pr-2 space-y-2.5">
              {items.map((item, index) => {
                const totalVal = summary.totalValue > 0 ? summary.totalValue : 1;
                const ratio = (item.totalAmount / totalVal) * 100;
                return (
                  <div 
                    key={item.ticker} 
                    className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/10 border border-slate-200/40 dark:border-slate-800/30 rounded-2xl hover:scale-[1.01] hover:border-indigo-500/20 dark:hover:border-indigo-400/25 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3.5">
                      <span
                        className="w-4 h-4 rounded-xl flex-shrink-0 shadow-sm"
                        style={{ 
                          backgroundColor: GRADIENT_COLORS[index % GRADIENT_COLORS.length]
                        }}
                      />
                      <div>
                        <div className="font-extrabold text-slate-850 dark:text-slate-200 text-xs">
                          {item.name}
                        </div>
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono tracking-wide mt-0.5 uppercase">
                          {item.ticker} • {item.market === 'domestic' ? '국내' : '해외'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                        {ratio.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                        {formatValue(item.totalAmount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900/35 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
              <PieIcon className="w-6 h-6 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-slate-700 dark:text-slate-300 font-extrabold text-sm">자산 비중을 표시할 데이터가 없습니다.</p>
              <p className="text-slate-400 dark:text-slate-550 text-xs">매수 기록을 추가하여 자산 비율을 확인해 보세요.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
