import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PortfolioItem, PortfolioSummary } from '../types';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Award } from 'lucide-react';

interface DashboardProps {
  items: PortfolioItem[];
  summary: PortfolioSummary;
}

// 프리미엄 도넛 차트 컬러 팔레트
const COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#f43f5e', // Rose
];

export const Dashboard: React.FC<DashboardProps> = ({ items, summary }) => {
  const hasData = items.length > 0;

  // Recharts를 위한 데이터 변환 (평가금액 기준 비중 계산)
  const chartData = items
    .map((item) => ({
      name: `${item.name} (${item.ticker})`,
      value: Math.max(0, item.totalAmount), // 음수 방지
    }))
    .filter((data) => data.value > 0);

  const isProfit = summary.totalProfit >= 0;

  // 가격 포맷팅 (원화/달러 구분은 없으므로 천 단위 콤마 추가)
  const formatValue = (val: number) => {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. 요약 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 총 투자금 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">총 투자금</p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mt-1">
              {formatValue(summary.totalInvestment)}
            </h3>
          </div>
        </div>

        {/* 총 평가금액 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className="p-3 bg-violet-50 dark:bg-violet-950/50 rounded-xl text-violet-600 dark:text-violet-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">총 평가금액</p>
            <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mt-1">
              {formatValue(summary.totalValue)}
            </h3>
          </div>
        </div>

        {/* 총 손익 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className={`p-3 rounded-xl ${isProfit ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'}`}>
            {isProfit ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">총 평가손익</p>
            <h3 className={`text-2xl font-bold tracking-tight mt-1 ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {summary.totalProfit > 0 ? '+' : ''}{formatValue(summary.totalProfit)}
            </h3>
          </div>
        </div>

        {/* 총 수익률 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center space-x-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
          <div className={`p-3 rounded-xl ${isProfit ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'}`}>
            {isProfit ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">총 수익률</p>
            <h3 className={`text-2xl font-bold tracking-tight mt-1 ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {summary.totalProfit > 0 ? '+' : ''}{summary.totalProfitRate.toFixed(2)}%
            </h3>
          </div>
        </div>
      </div>

      {/* 2. 자산 비중 차트 섹션 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-6">
          <PieIcon className="w-5 h-5 text-indigo-500" />
          <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">자산 포트폴리오 비중 (평가금액 기준)</h4>
        </div>

        {hasData && chartData.length > 0 ? (
          <div className="w-full h-80 flex flex-col md:flex-row items-center justify-center">
            {/* 차트 영역 */}
            <div className="w-full md:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${formatValue(Number(value))}`, '평가금액']}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* 범례 영역 (Recharts 기본 범례 대신 커스텀 리스트로 깔끔하게 구성) */}
            <div className="w-full md:w-1/2 mt-6 md:mt-0 max-h-60 overflow-y-auto px-4 space-y-3">
              {items.map((item, index) => {
                const totalVal = summary.totalValue > 0 ? summary.totalValue : 1;
                const ratio = (item.totalAmount / totalVal) * 100;
                return (
                  <div key={item.ticker} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-xs">
                        {item.name} <span className="text-slate-400 text-xs">{item.ticker}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">{ratio.toFixed(1)}%</span>
                      <span className="text-xs text-slate-400">({formatValue(item.totalAmount)})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
              <PieIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">자산 비중을 표시할 데이터가 없습니다.</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">매수 기록을 추가하거나 실시간 시세를 갱신해 보세요.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
