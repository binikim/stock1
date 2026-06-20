import { describe, it, expect } from 'vitest';
import { calculatePortfolioItems, calculatePortfolioSummary } from './portfolio';
import type { TransactionRecord } from '../types';

describe('Portfolio Math & Aggregation Tests', () => {
  const mockRecords: TransactionRecord[] = [
    {
      id: '1',
      ticker: 'AAPL',
      name: '애플',
      market: 'foreign',
      date: '2026-06-15',
      price: 150,
      quantity: 10,
    },
    {
      id: '2',
      ticker: 'AAPL',
      name: '애플',
      market: 'foreign',
      date: '2026-06-16',
      price: 180,
      quantity: 10,
    },
    {
      id: '3',
      ticker: '005930',
      name: '삼성전자',
      market: 'domestic',
      date: '2026-06-17',
      price: 70000,
      quantity: 5,
    },
  ];

  it('종목별 그룹화 및 평균 매입가 계산 검증 (calculatePortfolioItems)', () => {
    // AAPL: 10주 @ 150 + 10주 @ 180 = 20주, 총 3300원, 평균 165
    // 삼성전자: 5주 @ 70000 = 5주, 평균 70000
    const items = calculatePortfolioItems(mockRecords, {}, {});

    expect(items.length).toBe(2);

    const aapl = items.find((item) => item.ticker === 'AAPL');
    expect(aapl).toBeDefined();
    expect(aapl?.totalQuantity).toBe(20);
    expect(aapl?.avgBuyPrice).toBe(165);

    const samsung = items.find((item) => item.ticker === '005930');
    expect(samsung).toBeDefined();
    expect(samsung?.totalQuantity).toBe(5);
    expect(samsung?.avgBuyPrice).toBe(70000);
  });

  it('API 시세 및 수동 입력 시세 반영에 따른 손익/수익률 계산 검증', () => {
    const apiPrices = { AAPL: 200 }; // AAPL API 시세 200 (평단가 165 대비 +35)
    const manualPrices = { '005930': 77000 }; // 삼성전자 수동 시세 77000 (평단가 70000 대비 +7000)

    const items = calculatePortfolioItems(mockRecords, manualPrices, apiPrices);

    const aapl = items.find((item) => item.ticker === 'AAPL')!;
    expect(aapl.currentPrice).toBe(200);
    expect(aapl.totalAmount).toBe(200 * 20); // 4000
    expect(aapl.profit).toBe((200 - 165) * 20); // 700
    expect(aapl.profitRate).toBeCloseTo(((200 - 165) / 165) * 100, 4);
    expect(aapl.isManualPrice).toBe(false);

    const samsung = items.find((item) => item.ticker === '005930')!;
    expect(samsung.currentPrice).toBe(77000);
    expect(samsung.totalAmount).toBe(77000 * 5); // 385000
    expect(samsung.profit).toBe((77000 - 70000) * 5); // 35000
    expect(samsung.profitRate).toBeCloseTo(((77000 - 70000) / 70000) * 100, 4);
    expect(samsung.isManualPrice).toBe(true);
  });

  it('전체 포트폴리오 집계 연산 검증 (calculatePortfolioSummary)', () => {
    // AAPL: 평단 165, 수량 20, 현재가 200 -> 매입 3300, 평가 4000, 손익 700
    // 삼성전자: 평단 70000, 수량 5, 현재가 77000 -> 매입 350000, 평가 385000, 손익 35000
    // 총 매입 = 3300 + 350000 = 353300
    // 총 평가 = 4000 + 385000 = 389000
    // 총 손익 = 35700
    // 총 수익률 = (35700 / 353300) * 100 = 10.1047%
    const apiPrices = { AAPL: 200 };
    const manualPrices = { '005930': 77000 };

    const items = calculatePortfolioItems(mockRecords, manualPrices, apiPrices);
    const summary = calculatePortfolioSummary(items);

    expect(summary.totalInvestment).toBe(353300);
    expect(summary.totalValue).toBe(389000);
    expect(summary.totalProfit).toBe(35700);
    expect(summary.totalProfitRate).toBeCloseTo((35700 / 353300) * 100, 4);
  });
});
