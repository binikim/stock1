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
  // 현재 인라인 편집 중인 티커 상태
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState<string>('');

  // 시장별 통화 포맷팅 함수
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

  // 수익률 포맷팅 함수
  const formatRate = (rate: number) => {
    const sign = rate > 0 ? '+' : '';
    return `${sign}${rate.toFixed(2)}%`;
  };

  // 인라인 수정 시작
  const startEditing = (ticker: string, currentVal: number) => {
    setEditingTicker(ticker);
    setTempPrice(currentVal.toString());
  };

  // 인라인 수정 완료 저장
  const savePrice = (ticker: string) => {
    const parsed = parseFloat(tempPrice);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateManualPrice(ticker, parsed);
    }
    setEditingTicker(null);
  };

  // 키 다운 핸들러 (Enter 입력 시 저장)
  const handleKeyDown = (e: React.KeyboardEvent, ticker: string) => {
    if (e.key === 'Enter') {
      savePrice(ticker);
    } else if (e.key === 'Escape') {
      setEditingTicker(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      {/* 테이블 상단 바 */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">보유 종목 현황</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {!hasApiKey 
              ? '💡 설정에서 시세 API 키를 등록하면 실시간 시세가 자동 반영됩니다.'
              : '현재가는 실시간 API로 갱신되며, 조회 실패 시 수동 입력 값으로 표시됩니다.'}
          </p>
        </div>
        <button
          onClick={onRefreshPrices}
          disabled={isRefreshing || !hasApiKey}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? '갱신 중...' : '시세 갱신'}</span>
        </button>
      </div>

      {/* 테이블 영역 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
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
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300">
            {items.length > 0 ? (
              items.map((item) => {
                const isProfit = item.profit >= 0;
                const isManual = item.isManualPrice;

                return (
                  <tr
                    key={item.ticker}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    {/* 종목명 및 티커 */}
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{item.ticker}</div>
                    </td>

                    {/* 시장 구분 */}
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.market === 'domestic'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                      }`}>
                        {item.market === 'domestic' ? '국내' : '해외'}
                      </span>
                    </td>

                    {/* 보유수량 */}
                    <td className="py-4 px-6 text-right font-mono font-medium">
                      {item.totalQuantity.toLocaleString()}
                    </td>

                    {/* 평균매입가 */}
                    <td className="py-4 px-6 text-right font-mono font-medium">
                      {formatCurrency(item.avgBuyPrice, item.market)}
                    </td>

                    {/* 현재가 (수동/자동 입력 지원) */}
                    <td className="py-4 px-6 text-right font-mono">
                      {editingTicker === item.ticker ? (
                        <div className="flex items-center justify-end space-x-1">
                          <input
                            type="number"
                            step="any"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.ticker)}
                            className="w-24 px-2 py-1 text-right text-xs bg-slate-100 dark:bg-slate-800 border border-indigo-400 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                            autoFocus
                          />
                          <button
                            onClick={() => savePrice(item.ticker)}
                            className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="group flex items-center justify-end space-x-1.5 cursor-pointer" onClick={() => startEditing(item.ticker, item.currentPrice)}>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {formatCurrency(item.currentPrice, item.market)}
                          </span>
                          <button className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-opacity">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          {isManual && (
                            <span className="group-hover:hidden" title="시세 API가 없거나 에러가 발생하여 수동 입력/기본값 모드입니다.">
                              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 평가금액 */}
                    <td className="py-4 px-6 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">
                      {formatCurrency(item.totalAmount, item.market)}
                    </td>

                    {/* 평가손익 */}
                    <td className={`py-4 px-6 text-right font-mono font-semibold ${
                      isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {item.profit > 0 ? '+' : ''}
                      {formatCurrency(item.profit, item.market)}
                    </td>

                    {/* 수익률 */}
                    <td className={`py-4 px-6 text-right font-mono font-semibold ${
                      isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatRate(item.profitRate)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-12 px-6 text-center text-slate-400 dark:text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-700" />
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
