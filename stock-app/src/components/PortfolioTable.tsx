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
    <div className="flat-panel rounded-xl shadow-sm overflow-hidden animate-fade-in">
      {/* 테이블 상단 툴바 */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">보유 종목 현황</h4>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
            {!hasApiKey 
              ? '💡 설정에서 시세 API 키를 등록하면 실시간 시세가 자동 반영됩니다.'
              : '현재가는 실시간 API로 갱신되며, 조회 실패 시 수동 입력 값으로 표시됩니다.'}
          </p>
        </div>
        <button
          onClick={onRefreshPrices}
          disabled={isRefreshing || !hasApiKey}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? '갱신 중...' : '시세 갱신'}</span>
        </button>
      </div>

      {/* 테이블 영역 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-zinc-50/50 dark:bg-zinc-900/10 text-zinc-450 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider border-b border-zinc-250/60 dark:border-zinc-800">
              <th className="py-4 px-6">종목명/티커</th>
              <th className="py-4 px-6 text-center">시장</th>
              <th className="py-4 px-6 text-right">보유수량</th>
              <th className="py-4 px-6 text-right">평균매입가</th>
              <th className="py-4 px-6 text-right">현재가</th>
              <th className="py-4 px-6 text-right">평가금액</th>
              <th className="py-4 px-6 text-right">평가손익</th>
              <th className="py-4 px-6 text-right">수익률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 text-xs md:text-sm text-zinc-700 dark:text-zinc-300">
            {items.length > 0 ? (
              items.map((item) => {
                const isProfit = item.profit >= 0;
                const isManual = item.isManualPrice;

                return (
                  <tr
                    key={item.ticker}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                  >
                    {/* 종목명 및 티커 */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">{item.ticker}</div>
                    </td>

                    {/* 시장 구분 */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-700">
                        {item.market === 'domestic' ? '국내' : '해외'}
                      </span>
                    </td>

                    {/* 보유수량 */}
                    <td className="py-4 px-6 text-right font-mono font-medium">
                      {item.totalQuantity.toLocaleString()}
                    </td>

                    {/* 평균매입가 */}
                    <td className="py-4 px-6 text-right font-mono font-medium text-zinc-500">
                      {formatCurrency(item.avgBuyPrice, item.market)}
                    </td>

                    {/* 현재가 (수동/자동 입력 지원) */}
                    <td className="py-4 px-6 text-right font-mono">
                      {editingTicker === item.ticker ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <input
                            type="number"
                            step="any"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.ticker)}
                            className="w-24 px-2 py-1 text-right text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono text-zinc-900 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => savePrice(item.ticker)}
                            className="p-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="group flex items-center justify-end space-x-2 cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40 px-2 py-1 rounded inline-flex float-right transition-colors" 
                          onClick={() => startEditing(item.ticker, item.currentPrice)}
                        >
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(item.currentPrice, item.market)}
                          </span>
                          <Edit2 className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {isManual && (
                            <span title="API 시세 오류 또는 키 없음으로 인한 수동 모드" className="flex-shrink-0">
                              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 평가금액 */}
                    <td className="py-4 px-6 text-right font-mono font-semibold text-zinc-950 dark:text-zinc-50">
                      {formatCurrency(item.totalAmount, item.market)}
                    </td>

                    {/* 평가손익 */}
                    <td className={`py-4 px-6 text-right font-mono font-semibold ${
                      isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-455'
                    }`}>
                      {item.profit > 0 ? '+' : ''}
                      {formatCurrency(item.profit, item.market)}
                    </td>

                    {/* 수익률 */}
                    <td className={`py-4 px-6 text-right font-mono font-bold ${
                      isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-455'
                    }`}>
                      {formatRate(item.profitRate)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-12 px-6 text-center text-zinc-400 dark:text-zinc-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-zinc-300 dark:text-zinc-700" />
                    <span>등록된 매수 기록이 없습니다. 매수 기록 탭에서 자산을 추가해 주세요.</span>
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
