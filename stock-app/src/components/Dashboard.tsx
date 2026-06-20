import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PortfolioItem, PortfolioSummary } from '../types';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Award, Percent } from 'lucide-react';

interface DashboardProps {
  items: PortfolioItem[];
  summary: PortfolioSummary;
}

// 고고하고 화려한 프리미엄 네온 컬러 팔레트
const COLORS = [
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#f43f5e', // Rose
];

export const Dashboard: React.FC<DashboardProps> = ({ items, summary }) => {
  const hasData = items.length > 0;

  // Recharts용 데이터 포맷팅
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
      {/* 1. 요약 카드 섹션 (글래스모피즘 + 호버 효과 적용) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 총 투자금 */}
        <div className="glass-panel hover-premium rounded-3xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-indigo-500 to-indigo-650 text-white rounded-2xl shadow-md shadow-indigo-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">총 투자 원금</p>
            <h3 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-mono">
              {formatValue(summary.totalInvestment)}
            </h3>
          </div>
        </div>

        {/* 총 평가금액 */}
        <div className="glass-panel hover-premium rounded-3xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-violet-500 to-purple-650 text-white rounded-2xl shadow-md shadow-violet-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">총 평가 자산</p>
            <h3 className="text-2xl font-extrabold tracking-tight text-gradient font-mono">
              {formatValue(summary.totalValue)}
            </h3>
          </div>
        </div>

        {/* 총 평가손익 */}
        <div className="glass-panel hover-premium rounded-3xl p-6 shadow-sm flex items-center space-x-4">
          <div className={`p-3 rounded-2xl shadow-md text-white ${
            isProfit 
              ? 'bg-gradient-to-tr from-emerald-400 to-emerald-600 shadow-emerald-500/20' 
              : 'bg-gradient-to-tr from-rose-400 to-rose-600 shadow-rose-500/20'
          }`}>
            {isProfit ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">누적 평가 손익</p>
            <h3 className={`text-2xl font-extrabold tracking-tight font-mono ${
              isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-455'
            }`}>
              {summary.totalProfit > 0 ? '+' : ''}{formatValue(summary.totalProfit)}
            </h3>
          </div>
        </div>

        {/* 누적 수익률 */}
        <div className="glass-panel hover-premium rounded-3xl p-6 shadow-sm flex items-center space-x-4">
          <div className={`p-3 rounded-2xl shadow-md text-white ${
            isProfit 
              ? 'bg-gradient-to-tr from-emerald-400 to-emerald-600 shadow-emerald-500/20' 
              : 'bg-gradient-to-tr from-rose-400 to-rose-600 shadow-rose-500/20'
          }`}>
            <Percent className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">누적 수익률</p>
            <h3 className={`text-2xl font-extrabold tracking-tight font-mono ${
              isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-455'
            }`}>
              {summary.totalProfit > 0 ? '+' : ''}{summary.totalProfitRate.toFixed(2)}%
            </h3>
          </div>
        </div>
      </div>

      {/* 2. 자산 비중 차트 섹션 */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center space-x-2.5 mb-8">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-550 dark:text-indigo-400">
            <PieIcon className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">자산 배분 비중 (평가액 기준)</h4>
        </div>

        {hasData && chartData.length > 0 ? (
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* 차트 영역 - 도넛 중앙 정보 겹치기 기법 */}
            <div className="w-full lg:w-1/2 h-72 relative flex items-center justify-center">
              <div className="absolute flex flex-col items-center justify-center text-center select-none">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">
                  총 평가 자산
                </span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
                  {formatValue(summary.totalValue)}
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none transition-all duration-300 hover:opacity-90" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${formatValue(Number(value))}`, '평가자산']}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: 'none',
                      borderRadius: '16px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 범례 영역 (마우스 인터랙션과 연동된 커스텀 카드 리스트) */}
            <div className="w-full lg:w-1/2 max-h-72 overflow-y-auto pr-2 space-y-3">
              {items.map((item, index) => {
                const totalVal = summary.totalValue > 0 ? summary.totalValue : 1;
                const ratio = (item.totalAmount / totalVal) * 100;
                return (
                  <div 
                    key={item.ticker} 
                    className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-850/40 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className="w-3.5 h-3.5 rounded-xl flex-shrink-0 shadow-inner"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {item.ticker} • {item.market === 'domestic' ? '국내' : '해외'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {ratio.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-450 dark:text-slate-500 font-mono mt-0.5">
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
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400 shadow-inner">
              <PieIcon className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            </div>
            <div className="space-y-1">
              <p className="text-slate-550 dark:text-slate-400 font-bold text-sm">자산 비중을 표시할 데이터가 없습니다.</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs">매수 기록을 추가하거나 실시간 시세를 갱신하면 자산 차트가 활성화됩니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
