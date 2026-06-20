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
    <div className="glass-panel rounded-3xl shadow-sm overflow-hidden animate-fade-in border border-white/20 dark:border-white/5">
      {/* 테이블 상단 툴바 */}
      <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">보유 종목 현황</h4>
          <p className="text-xs text-slate-400 dark:text-slate-550 mt-1">
            {!hasApiKey 
              ? '💡 설정에서 시세 API 키를 등록하면 미국/한국 종목의 가격이 주기적으로 갱신됩니다.'
              : '실시간 API 시세는 우선 반영되며, 조회 불능 시 아래의 수동 입력값이 대체 사용됩니다.'}
          </p>
        </div>
        <button
          onClick={onRefreshPrices}
          disabled={isRefreshing || !hasApiKey}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-700 hover:to-indigo-850 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-[0.98]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? '시세 갱신 중...' : '실시간 시세 갱신'}</span>
        </button>
      </div>

      {/* 테이블 뷰 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/40 dark:bg-slate-850/20 text-slate-450 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
              <th className="py-5 px-6">종목명 / 티커</th>
              <th className="py-5 px-6 text-center">시장 구분</th>
              <th className="py-5 px-6 text-right">보유 주수</th>
              <th className="py-5 px-6 text-right">평균 매수 단가</th>
              <th className="py-5 px-6 text-right">현재가 (시세)</th>
              <th className="py-5 px-6 text-right">평가 금액</th>
              <th className="py-5 px-6 text-right">평가 손익</th>
              <th className="py-5 px-6 text-right">수익률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm text-slate-700 dark:text-slate-300">
            {items.length > 0 ? (
              items.map((item) => {
                const isProfit = item.profit >= 0;
                const isManual = item.isManualPrice;

                return (
                  <tr
                    key={item.ticker}
                    className="hover:bg-indigo-50/15 dark:hover:bg-indigo-950/10 transition-colors duration-200"
                  >
                    {/* 종목명 및 티커 */}
                    <td className="py-4.5 px-6">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-550 font-mono mt-0.5 tracking-wider">{item.ticker}</div>
                    </td>

                    {/* 시장 구분 배지 */}
                    <td className="py-4.5 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                        item.market === 'domestic'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                      }`}>
                        {item.market === 'domestic' ? '국내' : '해외'}
                      </span>
                    </td>

                    {/* 보유수량 */}
                    <td className="py-4.5 px-6 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {item.totalQuantity.toLocaleString()}
                    </td>

                    {/* 평균매입가 */}
                    <td className="py-4.5 px-6 text-right font-mono font-medium text-slate-600 dark:text-slate-400">
                      {formatCurrency(item.avgBuyPrice, item.market)}
                    </td>

                    {/* 현재가 */}
                    <td className="py-4.5 px-6 text-right font-mono">
                      {editingTicker === item.ticker ? (
                        <div className="flex items-center justify-end space-x-1.5 animate-fade-in">
                          <input
                            type="number"
                            step="any"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.ticker)}
                            className="w-24 px-2.5 py-1 text-right text-xs bg-slate-50 dark:bg-slate-850 border border-indigo-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-900 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => savePrice(item.ticker)}
                            className="p-1.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-lg transition-colors shadow-sm"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => startEditing(item.ticker, item.currentPrice)}
                          className="group flex items-center justify-end space-x-2 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 px-2 py-1 rounded-lg inline-flex float-right transition-colors"
                          title="가격을 직접 수정하려면 더블클릭 또는 클릭"
                        >
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {formatCurrency(item.currentPrice, item.market)}
                          </span>
                          <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {isManual && (
                            <span title="API 시세 오류 또는 키 없음으로 인한 수동 모드" className="flex-shrink-0">
                              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 평가금액 */}
                    <td className="py-4.5 px-6 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.totalAmount, item.market)}
                    </td>

                    {/* 평가손익 */}
                    <td className={`py-4.5 px-6 text-right font-mono font-bold ${
                      isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-455'
                    }`}>
                      {item.profit > 0 ? '+' : ''}
                      {formatCurrency(item.profit, item.market)}
                    </td>

                    {/* 수익률 */}
                    <td className={`py-4.5 px-6 text-right font-mono font-extrabold ${
                      isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-455'
                    }`}>
                      {formatRate(item.profitRate)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-16 px-6 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    <span className="font-medium text-slate-500">포트폴리오에 자산이 없습니다.</span>
                    <p className="text-xs text-slate-400 max-w-xs">매수 기록 탭으로 이동하셔서 주식 기록을 입력하시면 자산 현황판이 구성됩니다.</p>
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
