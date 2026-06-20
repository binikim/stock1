export type MarketType = 'domestic' | 'foreign';

/**
 * 개별 매수 기록 데이터 모델
 */
export interface TransactionRecord {
  id: string;
  ticker: string; // 종목코드 또는 티커 (예: AAPL, 005930)
  name: string; // 종목명 (예: 애플, 삼성전자)
  market: MarketType; // 시장 구분
  date: string; // 매수일 (YYYY-MM-DD)
  price: number; // 매수가 (음수 불가)
  quantity: number; // 매수 수량 (음수 불가)
  memo?: string; // 메모 (선택사항)
}

/**
 * 종목별 집계 포트폴리오 데이터 모델
 */
export interface PortfolioItem {
  ticker: string;
  name: string;
  market: MarketType;
  totalQuantity: number; // 보유 수량
  avgBuyPrice: number; // 평균 매입가
  currentPrice: number; // 현재가 (실시간 API 또는 수동 입력)
  totalAmount: number; // 평가금액 (현재가 * 보유수량)
  profit: number; // 평가손익 (평가금액 - 총매입금액)
  profitRate: number; // 수익률 (%)
  isManualPrice: boolean; // 현재가가 수동으로 입력되었는지 여부
}

/**
 * 포트폴리오 전체 요약 데이터 모델
 */
export interface PortfolioSummary {
  totalInvestment: number; // 총 투자금 (총 매입가)
  totalValue: number; // 총 평가금액
  totalProfit: number; // 총 손익
  totalProfitRate: number; // 총 수익률 (%)
}

/**
 * 애플리케이션 전체 구성 및 설정
 */
export interface AppConfig {
  geminiApiKey: string;
  stockApiKey: string;
  isDarkMode: boolean;
  manualPrices: Record<string, number>; // 티커별 수동 입력 현재가 저장소
}

/**
 * AI 투자 상담을 위한 채팅 메시지
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string; // ISO String
}
