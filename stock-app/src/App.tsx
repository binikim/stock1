import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { TransactionRecord, AppConfig, ChatMessage } from './types';
import { calculatePortfolioItems, calculatePortfolioSummary } from './utils/portfolio';
import { fetchAllStockPrices } from './utils/stockApi';
import { sendGeminiChatMessage } from './utils/gemini';

// 컴포넌트 임포트
import { Dashboard } from './components/Dashboard';
import { PortfolioTable } from './components/PortfolioTable';
import { RecordManager } from './components/RecordManager';
import { ChatBot } from './components/ChatBot';
import { Settings } from './components/Settings';

// 아이콘 임포트
import { 
  BarChart3, 
  TableProperties, 
  History, 
  MessageSquareCode, 
  Settings as SettingsIcon,
  AlertCircle
} from 'lucide-react';

function App() {
  // 1. 전역 상태 정의 (LocalStorage 기반)
  const [records, setRecords] = useLocalStorage<TransactionRecord[]>('stock_portfolio_records', []);
  const [config, setConfig] = useLocalStorage<AppConfig>('stock_portfolio_config', {
    geminiApiKey: '',
    stockApiKey: '',
    isDarkMode: false,
    manualPrices: {},
  });
  const [chatHistory, setChatHistory] = useLocalStorage<ChatMessage[]>('stock_portfolio_chat', []);

  // 2. 인메모리 임시 상태 정의
  const [apiPrices, setApiPrices] = useState<Record<string, number>>({});
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'records' | 'chatbot' | 'settings'>('dashboard');

  // 3. 다크 모드 토글 동기화
  useEffect(() => {
    if (config.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config.isDarkMode]);

  // 4. 고유한 종목 목록 수집 (티커/시장 정보)
  const uniqueTickers = useMemo(() => {
    const map = new Map<string, 'domestic' | 'foreign'>();
    records.forEach((r) => {
      map.set(r.ticker, r.market);
    });
    return Array.from(map.entries()).map(([ticker, market]) => ({ ticker, market }));
  }, [records]);

  // 5. 실시간 시세 일괄 갱신 함수
  const refreshPrices = useCallback(async () => {
    if (uniqueTickers.length === 0 || !config.stockApiKey) return;
    setIsRefreshingPrices(true);
    try {
      const prices = await fetchAllStockPrices(uniqueTickers, config.stockApiKey);
      setApiPrices(prices);
    } catch (err) {
      console.error('실시간 시세 갱신 중 에러 발생:', err);
    } finally {
      setIsRefreshingPrices(false);
    }
  }, [uniqueTickers, config.stockApiKey]);

  // 최초 앱 구동 시 자동 시세 갱신
  useEffect(() => {
    if (config.stockApiKey && uniqueTickers.length > 0) {
      refreshPrices();
    }
  }, [config.stockApiKey, uniqueTickers.length]); // 의존성 한정으로 루프 방지

  // 6. 계산된 포트폴리오 데이터 도출 (records, manualPrices, apiPrices 변경 시 재계산)
  const portfolioItems = useMemo(() => {
    return calculatePortfolioItems(records, config.manualPrices, apiPrices);
  }, [records, config.manualPrices, apiPrices]);

  // 대시보드 및 합계 요약 데이터 도출
  const portfolioSummary = useMemo(() => {
    return calculatePortfolioSummary(portfolioItems);
  }, [portfolioItems]);

  // 7. 자산 관리 CRUD 제어기들
  const handleAddRecord = (newRecord: Omit<TransactionRecord, 'id'>) => {
    const record: TransactionRecord = {
      ...newRecord,
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    };
    setRecords((prev) => [...prev, record]);
  };

  const handleUpdateRecord = (id: string, updatedFields: Omit<TransactionRecord, 'id'>) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedFields, id } : r))
    );
  };

  const handleDeleteRecord = (id: string) => {
    const targetRecord = records.find((r) => r.id === id);
    if (!targetRecord) return;
    
    const newRecords = records.filter((r) => r.id !== id);
    setRecords(newRecords);

    // 삭제 후 해당 종목의 레코드가 완전히 사라졌다면, 수동/자동 가격 맵에서도 제거
    const isTickerStillExist = newRecords.some((r) => r.ticker === targetRecord.ticker);
    if (!isTickerStillExist) {
      const updatedManualPrices = { ...config.manualPrices };
      delete updatedManualPrices[targetRecord.ticker];
      setConfig((prev) => ({
        ...prev,
        manualPrices: updatedManualPrices,
      }));
      
      const updatedApiPrices = { ...apiPrices };
      delete updatedApiPrices[targetRecord.ticker];
      setApiPrices(updatedApiPrices);
    }
  };

  // 8. 수동 현재가 갱신 제어기
  const handleUpdateManualPrice = (ticker: string, price: number) => {
    setConfig((prev) => ({
      ...prev,
      manualPrices: {
        ...prev.manualPrices,
        [ticker]: price,
      },
    }));
  };

  // 9. AI 상담 챗봇 전송 제어기
  const handleSendChatMessage = async (content: string) => {
    if (!config.geminiApiKey) return;

    // 1. 사용자 메시지 대화 이력에 우선 추가
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setIsSendingChat(true);

    try {
      // 2. AI에게 넘겨줄 실시간 포트폴리오 요약본 가공
      const summaryContext = {
        summary: {
          totalInvestment: portfolioSummary.totalInvestment,
          totalValue: portfolioSummary.totalValue,
          totalProfit: portfolioSummary.totalProfit,
          totalProfitRate: portfolioSummary.totalProfitRate,
        },
        portfolio: portfolioItems.map((item) => ({
          ticker: item.ticker,
          name: item.name,
          market: item.market,
          quantity: item.totalQuantity,
          avgBuyPrice: item.avgBuyPrice,
          currentPrice: item.currentPrice,
          profit: item.profit,
          profitRate: item.profitRate,
          totalAmount: item.totalAmount,
        })),
      };

      const summaryStr = JSON.stringify(summaryContext, null, 2);

      // 3. Gemini API 호출
      const aiReply = await sendGeminiChatMessage(updatedHistory, summaryStr, config.geminiApiKey);

      // 4. AI 답변을 이력에 추가
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        role: 'model',
        content: aiReply,
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prev) => [...prev, botMsg]);
    } catch (error: any) {
      alert(`AI 상담사 호출 실패: ${error.message || '알 수 없는 API 에러'}`);
      // 실패 시 에러 메시지를 임시 대화 창에 안내 메시지로 추가하는 것도 좋은 방법입니다.
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: `⚠️ **상담 오류 발생:** API 호출 도중 문제가 생겼습니다. API 키 상태를 점검하시거나 잠시 후 다시 시도해 주세요. (${error.message || 'Error'})`,
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleClearChatHistory = () => {
    setChatHistory([]);
  };

  // 10. CSV 가져오기 제어기
  const handleImportRecords = (imported: TransactionRecord[], mode: 'append' | 'overwrite') => {
    if (mode === 'overwrite') {
      setRecords(imported);
    } else {
      setRecords((prev) => {
        // 기존 레코드들과 중복되지 않도록 새 ID를 부여해서 덧붙임
        const adjustedImported = imported.map((item) => ({
          ...item,
          id: `imp-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
        }));
        return [...prev, ...adjustedImported];
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-55/40 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-250">
      {/* 글로벌 헤더 */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-900/75 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-650 to-violet-600 rounded-xl text-white shadow-md shadow-indigo-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                주식 가계부
              </h1>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase mt-1 block">
                Portfolio Helper SPA
              </span>
            </div>
          </div>

          {/* 데스크탑 탭 메뉴 */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-inner'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-550" />
              <span>대시보드</span>
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'portfolio'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-inner'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <TableProperties className="w-4 h-4 text-violet-550" />
              <span>포트폴리오</span>
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'records'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-inner'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <History className="w-4 h-4 text-sky-500" />
              <span>매수 기록</span>
            </button>
            <button
              onClick={() => setActiveTab('chatbot')}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'chatbot'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-inner'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <MessageSquareCode className="w-4 h-4 text-emerald-500" />
              <span>AI 투자 상담</span>
              {config.geminiApiKey && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-inner'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <SettingsIcon className="w-4 h-4 text-slate-500" />
              <span>설정</span>
            </button>
          </nav>
        </div>
      </header>

      {/* 모바일 탭 메뉴 (하단 고정 바 구조로 최적의 반응형 경험 제공) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-around py-2 shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 space-y-0.5 text-[10px] font-bold ${
            activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>대시보드</span>
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex flex-col items-center justify-center py-1 px-3 space-y-0.5 text-[10px] font-bold ${
            activeTab === 'portfolio' ? 'text-violet-650 dark:text-violet-400' : 'text-slate-400'
          }`}
        >
          <TableProperties className="w-5 h-5" />
          <span>포트폴리오</span>
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={`flex flex-col items-center justify-center py-1 px-3 space-y-0.5 text-[10px] font-bold ${
            activeTab === 'records' ? 'text-sky-550 dark:text-sky-400' : 'text-slate-400'
          }`}
        >
          <History className="w-5 h-5" />
          <span>매수 기록</span>
        </button>
        <button
          onClick={() => setActiveTab('chatbot')}
          className={`flex flex-col items-center justify-center py-1 px-3 space-y-0.5 text-[10px] font-bold relative ${
            activeTab === 'chatbot' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
          }`}
        >
          <MessageSquareCode className="w-5 h-5" />
          <span>AI 상담</span>
          {config.geminiApiKey && (
            <span className="absolute top-1 right-3 h-2 w-2 rounded-full bg-emerald-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center py-1 px-3 space-y-0.5 text-[10px] font-bold ${
            activeTab === 'settings' ? 'text-slate-800 dark:text-white' : 'text-slate-400'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span>설정</span>
        </button>
      </nav>

      {/* 메인 콘텐츠 바디 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
        {/* 상시 데이터 유실 알림 배너 */}
        {records.length > 0 && activeTab === 'dashboard' && (
          <div className="mb-6 bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl px-4 py-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-indigo-500" />
              <span>현재 {records.length}개의 거래 내역이 저장되어 있습니다. 브라우저 로컬 저장소를 사용 중이므로 백업에 신경써 주세요.</span>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-indigo-650 hover:underline font-bold"
            >
              CSV 백업받기
            </button>
          </div>
        )}

        {/* 탭 전환 렌더링 */}
        {activeTab === 'dashboard' && (
          <Dashboard items={portfolioItems} summary={portfolioSummary} />
        )}
        {activeTab === 'portfolio' && (
          <PortfolioTable
            items={portfolioItems}
            onUpdateManualPrice={handleUpdateManualPrice}
            onRefreshPrices={refreshPrices}
            isRefreshing={isRefreshingPrices}
            hasApiKey={!!config.stockApiKey}
          />
        )}
        {activeTab === 'records' && (
          <RecordManager
            records={records}
            onAddRecord={handleAddRecord}
            onUpdateRecord={handleUpdateRecord}
            onDeleteRecord={handleDeleteRecord}
          />
        )}
        {activeTab === 'chatbot' && (
          <ChatBot
            apiKey={config.geminiApiKey}
            portfolioItems={portfolioItems}
            portfolioSummary={portfolioSummary}
            chatHistory={chatHistory}
            onSendMessage={handleSendChatMessage}
            onClearChat={handleClearChatHistory}
            isSending={isSendingChat}
            onNavigateToSettings={() => setActiveTab('settings')}
          />
        )}
        {activeTab === 'settings' && (
          <Settings
            geminiApiKey={config.geminiApiKey}
            stockApiKey={config.stockApiKey}
            isDarkMode={config.isDarkMode}
            onUpdateGeminiKey={(key) => setConfig((prev) => ({ ...prev, geminiApiKey: key }))}
            onUpdateStockKey={(key) => setConfig((prev) => ({ ...prev, stockApiKey: key }))}
            onToggleDarkMode={() => setConfig((prev) => ({ ...prev, isDarkMode: !prev.isDarkMode }))}
            records={records}
            onImportRecords={handleImportRecords}
          />
        )}
      </main>
    </div>
  );
}

export default App;
