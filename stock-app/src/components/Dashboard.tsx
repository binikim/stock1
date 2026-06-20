import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PortfolioItem, PortfolioSummary } from '../types';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Award, Percent } from 'lucide-react';

interface DashboardProps {
  items: PortfolioItem[];
  summary: PortfolioSummary;
}

// 최신 핀테크 트렌드에 맞춘 차분한 모노톤 & 딥블루 컬러셋
const COLORS = [
  '#09090b', // Zinc 950 (대표)
  '#2563eb', // Royal Blue (포인트)
  '#52525b', // Zinc 600
  '#3b82f6', // Blue 500
  '#71717a', // Zinc 500
  '#60a5fa', // Blue 400
  '#a1a1aa', // Zinc 400
  '#93c5fd', // Blue 300
];

export const Dashboard: React.FC<DashboardProps> = ({ items, summary }) => {
  const hasData = items.length > 0;

  // Recharts 데이터 매핑
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
    <div className="space-y-6 animate-fade-in">
      {/* 1. 요약 카드 섹션 (모노톤 플랫 패널) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 총 투자금 */}
        <div className="flat-panel rounded-xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">총 투자 원금</p>
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-0.5 font-mono">
              {formatValue(summary.totalInvestment)}
            </h3>
          </div>
        </div>

        {/* 총 평가금액 */}
        <div className="flat-panel rounded-xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">총 평가 자산</p>
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-0.5 font-mono">
              {formatValue(summary.totalValue)}
            </h3>
          </div>
        </div>

        {/* 총 평가손익 */}
        <div className="flat-panel rounded-xl p-6 shadow-sm flex items-center space-x-4">
          <div className={`p-2.5 rounded-lg ${
            isProfit 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455'
          }`}>
            {isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">누적 평가 손익</p>
            <h3 className={`text-xl font-bold tracking-tight mt-0.5 font-mono ${
              isProfit ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'
            }`}>
              {summary.totalProfit > 0 ? '+' : ''}{formatValue(summary.totalProfit)}
            </h3>
          </div>
        </div>

        {/* 누적 수익률 */}
        <div className="flat-panel rounded-xl p-6 shadow-sm flex items-center space-x-4">
          <div className={`p-2.5 rounded-lg ${
            isProfit 
              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455'
          }`}>
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">누적 수익률</p>
            <h3 className={`text-xl font-bold tracking-tight mt-0.5 font-mono ${
              isProfit ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'
            }`}>
              {summary.totalProfit > 0 ? '+' : ''}{summary.totalProfitRate.toFixed(2)}%
            </h3>
          </div>
        </div>
      </div>

      {/* 2. 자산 비중 차트 섹션 */}
      <div className="flat-panel rounded-xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <PieIcon className="w-4 h-4 text-zinc-500" />
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">자산 배분 비율 (평가액 기준)</h4>
        </div>

        {hasData && chartData.length > 0 ? (
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* 도넛 차트 */}
            <div className="w-full lg:w-1/2 h-64 relative flex items-center justify-center">
              <div className="absolute flex flex-col items-center justify-center text-center select-none">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  총 자산 가치
                </span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-0.5 font-mono">
                  {formatValue(summary.totalValue)}
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${formatValue(Number(value))}`, '평가액']}
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      color: '#fafafa',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 범례 리스트 */}
            <div className="w-full lg:w-1/2 max-h-64 overflow-y-auto pr-2 space-y-2">
              {items.map((item, index) => {
                const totalVal = summary.totalValue > 0 ? summary.totalValue : 1;
                const ratio = (item.totalAmount / totalVal) * 100;
                return (
                  <div 
                    key={item.ticker} 
                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/40 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">
                          {item.name}
                        </div>
                        <div className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                          {item.ticker} • {item.market === 'domestic' ? '국내' : '해외'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-zinc-900 dark:text-white text-xs">
                        {ratio.toFixed(1)}%
                      </div>
                      <div className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                        {formatValue(item.totalAmount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center text-zinc-400">
              <PieIcon className="w-6 h-6 text-zinc-400" />
            </div>
            <div className="space-y-1">
              <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-xs">자산 비중을 표시할 데이터가 없습니다.</p>
              <p className="text-zinc-400 dark:text-zinc-650 text-[11px]">매수 거래 기록을 추가하여 자산 비율을 확인해 보세요.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
