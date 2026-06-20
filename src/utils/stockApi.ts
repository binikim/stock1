import type { MarketType } from '../types';

/**
 * 특정 종목의 현재가를 외부 시세 API(Finnhub)를 통해 비동기 조회합니다.
 * 오류가 발생하거나 데이터가 없는 경우 null을 반환하여 개별 에러를 격리합니다.
 * 
 * @param ticker 종목코드 또는 티커 (예: AAPL, 005930)
 * @param market 시장 구분 ('domestic' | 'foreign')
 * @param apiKey Finnhub API Key
 */
export async function fetchStockPrice(
  ticker: string,
  market: MarketType,
  apiKey: string
): Promise<number | null> {
  if (!apiKey) {
    return null; // API 키가 없으면 바로 null 반환하여 수동 폴백 유도
  }

  // 티커 표준화
  let formattedTicker = ticker.trim().toUpperCase();
  if (market === 'domestic') {
    // 6자리 숫자로만 구성된 경우 기본적으로 코스피(.KS)로 가공하여 조회 시도
    if (/^\d{6}$/.test(formattedTicker)) {
      formattedTicker = `${formattedTicker}.KS`;
    }
  }

  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${formattedTicker}&token=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Finnhub은 없는 티커를 조회하면 c=0을 반환하거나 응답 값이 비어 있을 수 있음
    if (data && typeof data.c === 'number' && data.c > 0) {
      return data.c;
    }
    
    return null;
  } catch (error) {
    console.error(`Failed to fetch price for ticker ${ticker}:`, error);
    return null; // 에러 격리
  }
}

/**
 * 여러 종목의 현재가를 병렬적으로 조회합니다.
 * @param tickers 종목 목록 ({ ticker, market } 형태)
 * @param apiKey Finnhub API Key
 */
export async function fetchAllStockPrices(
  tickers: { ticker: string; market: MarketType }[],
  apiKey: string
): Promise<Record<string, number>> {
  const priceMap: Record<string, number> = {};
  if (!apiKey) return priceMap;

  // 종목 중복 제거
  const uniqueTickers = Array.from(
    new Map(tickers.map((t) => [t.ticker, t])).values()
  );

  const promises = uniqueTickers.map(async (t) => {
    const price = await fetchStockPrice(t.ticker, t.market, apiKey);
    if (price !== null) {
      priceMap[t.ticker] = price;
    }
  });

  await Promise.allSettled(promises);
  return priceMap;
}
