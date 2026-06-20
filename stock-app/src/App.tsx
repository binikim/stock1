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
  }, [config.stockApiKey, uniqueTickers.length]);

  // 6. 계산된 포트폴리오 데이터 도출
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
      const aiReply = await sendGeminiChatMessage(updatedHistory, summaryStr, config.geminiApiKey);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        role: 'model',
        content: aiReply,
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prev) => [...prev, botMsg]);
    } catch (error: any) {
      alert(`AI 상담사 호출 실패: ${error.message || '알 수 없는 API 에러'}`);
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
        const adjustedImported = imported.map((item) => ({
          ...item,
          id: `imp-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
        }));
        return [...prev, ...adjustedImported];
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] flex flex-col font-sans transition-colors duration-200">
      {/* 글로벌 헤더 (Minimal flat border) */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#121214] border-b border-zinc-200 dark:border-zinc-800 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="p-1.5 bg-zinc-900 dark:bg-zinc-150 rounded-lg text-white dark:text-black">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
                주식 가계부
              </h1>
              <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-bold tracking-wider uppercase mt-1 block">
                Portfolio Copilot
              </span>
            </div>
          </div>

          {/* 데스크탑 탭 메뉴 */}
          <nav className="hidden md:flex space-x-1">
            {[
              { id: 'dashboard', label: '대시보드', icon: BarChart3 },
              { id: 'portfolio', label: '포트폴리오', icon: TableProperties },
              { id: 'records', label: '매수 기록', icon: History },
              { id: 'chatbot', label: 'AI 투자 상담', icon: MessageSquareCode, badge: !!config.geminiApiKey },
              { id: 'settings', label: '설정', icon: SettingsIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="flex h-1.5 w-1.5 relative ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-zinc-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 모바일 탭 메뉴 (하단 고정) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#121214]/95 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around py-2 shadow">
        {[
          { id: 'dashboard', label: '대시보드', icon: BarChart3 },
          { id: 'portfolio', label: '포트폴리오', icon: TableProperties },
          { id: 'records', label: '매수 기록', icon: History },
          { id: 'chatbot', label: 'AI 상담', icon: MessageSquareCode, badge: !!config.geminiApiKey },
          { id: 'settings', label: '설정', icon: SettingsIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-1 px-3 space-y-0.5 text-[9px] font-bold transition-colors ${
                isActive ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'
              }`}
            >
              <div className="relative">
                <Icon className="w-4.5 h-4.5" />
                {tab.badge && !isActive && (
                  <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-zinc-500" />
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 메인 콘텐츠 바디 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 relative">
        {/* 상시 데이터 유실 알림 배너 */}
        {records.length > 0 && activeTab === 'dashboard' && (
          <div className="mb-6 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-zinc-650 dark:text-zinc-400">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-zinc-500" />
              <span>현재 {records.length}개의 거래 데이터가 기기(브라우저) LocalStorage에만 적재되어 있습니다.</span>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-xs font-bold text-zinc-900 dark:text-zinc-100 hover:underline flex-shrink-0"
            >
              CSV 백업받기 →
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
