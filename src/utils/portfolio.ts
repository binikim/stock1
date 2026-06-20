import type { TransactionRecord, PortfolioItem, PortfolioSummary } from '../types';

/**
 * 매수 기록과 현재 시세 정보를 기반으로 각 종목의 포트폴리오 항목들을 계산합니다.
 * @param records 매수 기록 배열
 * @param manualPrices 설정 또는 테이블에서 사용자가 수동으로 입력한 시세 맵
 * @param apiPrices 실시간 API로 받아온 시세 맵
 */
export function calculatePortfolioItems(
  records: TransactionRecord[],
  manualPrices: Record<string, number> = {},
  apiPrices: Record<string, number> = {}
): PortfolioItem[] {
  const grouped: Record<string, {
    records: TransactionRecord[];
    totalQuantity: number;
    totalCost: number;
  }> = {};

  // 1. 종목별 그룹화 및 기본 수량, 총 매입 금액 집계
  records.forEach((record) => {
    const key = record.ticker;
    if (!grouped[key]) {
      grouped[key] = { records: [], totalQuantity: 0, totalCost: 0 };
    }
    grouped[key].records.push(record);
    grouped[key].totalQuantity += record.quantity;
    grouped[key].totalCost += record.price * record.quantity;
  });

  // 2. 종목별 포트폴리오 상태 계산
  const items: PortfolioItem[] = Object.keys(grouped).map((ticker) => {
    const group = grouped[ticker];
    const firstRecord = group.records[0];
    
    // 평균매입가 = 총매입금액 / 총매수수량
    const avgBuyPrice = group.totalQuantity > 0 ? group.totalCost / group.totalQuantity : 0;
    
    // 현재가 결정: API 가격 우선 -> 수동 입력 가격 -> 둘 다 없으면 평균매입가로 기본 지정
    let currentPrice = avgBuyPrice;
    let isManualPrice = false;

    if (apiPrices[ticker] !== undefined && apiPrices[ticker] !== null) {
      currentPrice = apiPrices[ticker];
    } else if (manualPrices[ticker] !== undefined && manualPrices[ticker] !== null) {
      currentPrice = manualPrices[ticker];
      isManualPrice = true;
    } else {
      // API 데이터와 수동 입력 모두 없는 경우, 사용자가 입력하도록 평균 매입가를 기본으로 보되, 
      // 이 상태를 수동 지정(폴백) 상태로 간주
      isManualPrice = true;
    }

    const totalAmount = currentPrice * group.totalQuantity;
    const profit = (currentPrice - avgBuyPrice) * group.totalQuantity;
    const profitRate = avgBuyPrice > 0 ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;

    return {
      ticker,
      name: firstRecord.name,
      market: firstRecord.market,
      totalQuantity: group.totalQuantity,
      avgBuyPrice,
      currentPrice,
      totalAmount,
      profit,
      profitRate,
      isManualPrice,
    };
  });

  return items;
}

/**
 * 종목별 포트폴리오 데이터를 종합하여 전체 대시보드 요약 데이터를 산출합니다.
 * @param items 포트폴리오 아이템 배열
 */
export function calculatePortfolioSummary(items: PortfolioItem[]): PortfolioSummary {
  let totalInvestment = 0;
  let totalValue = 0;

  items.forEach((item) => {
    // 종목의 총 투자 원금 = 평균 매입가 * 보유 수량
    totalInvestment += item.avgBuyPrice * item.totalQuantity;
    // 종목의 총 평가금 = 현재가 * 보유 수량
    totalValue += item.totalAmount;
  });

  const totalProfit = totalValue - totalInvestment;
  const totalProfitRate = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

  return {
    totalInvestment,
    totalValue,
    totalProfit,
    totalProfitRate,
  };
}
