import React, { useState } from 'react';
import type { PortfolioItem } from '../types';
import { RefreshCw, Edit2, Check, AlertCircle, HelpCircle } from 'lucide-react';

interface PortfolioTableProps {
  items: PortfolioItem[];
  onUpdateManualPrice: (ticker: string, price: number) => void;
  onRefreshPrices: () => Promise<void>;
  isRefreshing: boolean;
  hasApiKey: boolean;
}

export const PortfolioTable: React.FC<PortfolioTableProps> = ({
  items,
  onUpdateManualPrice,
  onRefreshPrices,
  isRefreshing,
  hasApiKey,
}) => {
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  const formatCurrency = (value: number, market: 'domestic' | 'foreign') => {
    if (market === 'domestic') {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0,
      }).format(value);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }
  };

  const formatRate = (rate: number) => {
    const sign = rate > 0 ? '+' : '';
    return `${sign}${rate.toFixed(2)}%`;
  };

  const startEditing = (ticker: string, currentVal: number) => {
    setEditingTicker(ticker);
    setTempPrice(currentVal.toString());
  };

  const savePrice = (ticker: string) => {
    const parsed = parseFloat(tempPrice);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateManualPrice(ticker, parsed);
    }
    setEditingTicker(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, ticker: string) => {
    if (e.key === 'Enter') {
      savePrice(ticker);
    } else if (e.key === 'Escape') {
      setEditingTicker(null);
    }
  };

  return (
    <div className="trendy-card shadow-lg overflow-hidden animate-fade-in">
      {/* 상단 헤더 툴바 */}
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-200">보유 종목 현황</h4>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
            {!hasApiKey 
              ? '💡 설정에서 시세 API 키를 등록하면 미국/한국 종목의 현재가가 실시간 갱신됩니다.'
              : '현재가는 실시간 API로 자동 갱신되며, 필요 시 주가를 클릭하여 임의 수정이 가능합니다.'}
          </p>
        </div>
        <button
          onClick={onRefreshPrices}
          disabled={isRefreshing || !hasApiKey}
          className="flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-650 dark:from-emerald-600 dark:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none btn-trendy"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? '갱신 중...' : '시세 새로고침'}</span>
        </button>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/10 text-slate-450 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800/55">
              <th className="py-4.5 px-6">종목 / 티커</th>
              <th className="py-4.5 px-6 text-center">시장</th>
              <th className="py-4.5 px-6 text-right">보유 수량</th>
              <th className="py-4.5 px-6 text-right">평균 매입가</th>
              <th className="py-4.5 px-6 text-right">현재가 (시세)</th>
              <th className="py-4.5 px-6 text-right">평가 금액</th>
              <th className="py-4.5 px-6 text-right">평가 손익</th>
              <th className="py-4.5 px-6 text-right">수익률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 text-xs md:text-sm text-slate-700 dark:text-slate-300">
            {items.length > 0 ? (
              items.map((item) => {
                const isProfit = item.profit >= 0;
                const isManual = item.isManualPrice;

                return (
                  <tr
                    key={item.ticker}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-900/20 transition-colors"
                  >
                    {/* 종목명 및 티커 */}
                    <td className="py-4.5 px-6">
                      <div className="font-extrabold text-slate-900 dark:text-slate-100">{item.name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 tracking-wide uppercase">{item.ticker}</div>
                    </td>

                    {/* 시장 구분 */}
                    <td className="py-4.5 px-6 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide ${
                        item.market === 'domestic'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {item.market === 'domestic' ? '국내' : '해외'}
                      </span>
                    </td>

                    {/* 보유수량 */}
                    <td className="py-4.5 px-6 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {item.totalQuantity.toLocaleString()}
                    </td>

                    {/* 평균매입가 */}
                    <td className="py-4.5 px-6 text-right font-mono font-medium text-slate-500 dark:text-slate-400">
                      {formatCurrency(item.avgBuyPrice, item.market)}
                    </td>

                    {/* 현재가 (수동/자동 입력 지원) */}
                    <td className="py-4.5 px-6 text-right font-mono">
                      {editingTicker === item.ticker ? (
                        <div className="flex items-center justify-end space-x-1.5 animate-fade-in">
                          <input
                            type="number"
                            step="any"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.ticker)}
                            className="w-24 px-2 py-1 text-right text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => savePrice(item.ticker)}
                            className="p-1 bg-indigo-550 hover:bg-indigo-600 text-white rounded-md transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="group flex items-center justify-end space-x-1.5 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 px-2 py-1.5 rounded-lg inline-flex float-right transition-all duration-200"
                          onClick={() => startEditing(item.ticker, item.currentPrice)}
                          title="클릭하여 수정"
                        >
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">
                            {formatCurrency(item.currentPrice, item.market)}
                          </span>
                          <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {isManual && (
                            <span title="수동 입력된 주가" className="flex-shrink-0">
                              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 평가금액 */}
                    <td className="py-4.5 px-6 text-right font-mono font-extrabold text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.totalAmount, item.market)}
                    </td>

                    {/* 평가손익 */}
                    <td className={`py-4.5 px-6 text-right font-mono font-bold ${
                      isProfit ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                    }`}>
                      {item.profit > 0 ? '+' : ''}
                      {formatCurrency(item.profit, item.market)}
                    </td>

                    {/* 수익률 */}
                    <td className={`py-4.5 px-6 text-right font-mono font-black ${
                      isProfit ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                    }`}>
                      {formatRate(item.profitRate)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-16 px-6 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                      <AlertCircle className="w-5 h-5 text-slate-350" />
                    </div>
                    <span className="font-extrabold text-slate-550 dark:text-slate-400 text-xs">포트폴리오가 비어 있습니다.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
