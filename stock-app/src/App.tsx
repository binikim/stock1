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
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#030712] flex flex-col font-sans transition-colors duration-300 relative overflow-hidden">
      {/* 3차원 네온 광원 배경 스폿 (Glassmorphism 극대화) */}
      <div className="absolute top-[-100px] left-[-50px] blur-glow-purple opacity-70" />
      <div className="absolute top-[400px] right-[-100px] blur-glow-indigo opacity-80" />
      <div className="absolute bottom-[200px] left-[15%] blur-glow-purple opacity-50" />

      {/* 글로벌 헤더 (Glassmorphic) */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/20 dark:border-white/5 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="p-2 bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 rounded-xl text-white shadow-lg shadow-indigo-500/20 transform hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                주식 가계부
              </h1>
              <span className="text-[9px] text-indigo-550 dark:text-indigo-400 font-bold tracking-wider uppercase mt-1 block">
                Portfolio Copilot
              </span>
            </div>
          </div>

          {/* 데스크탑 탭 메뉴 */}
          <nav className="hidden md:flex space-x-2">
            {[
              { id: 'dashboard', label: '대시보드', icon: BarChart3, color: 'text-indigo-500' },
              { id: 'portfolio', label: '포트폴리오', icon: TableProperties, color: 'text-violet-500' },
              { id: 'records', label: '매수 기록', icon: History, color: 'text-sky-500' },
              { id: 'chatbot', label: 'AI 투자 상담', icon: MessageSquareCode, color: 'text-emerald-500', badge: !!config.geminiApiKey },
              { id: 'settings', label: '설정', icon: SettingsIcon, color: 'text-slate-400' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 relative ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-650/20 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="flex h-2 w-2 relative ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 모바일 탭 메뉴 (하단 고정) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-around py-2 shadow-2xl">
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
                isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.badge && !isActive && (
                  <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </div>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 메인 콘텐츠 바디 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 z-10 relative">
        {/* 상시 데이터 유실 알림 배너 (더 고급스럽게 다듬음) */}
        {records.length > 0 && activeTab === 'dashboard' && (
          <div className="mb-6 bg-gradient-to-r from-indigo-50/70 to-violet-50/70 dark:from-indigo-950/20 dark:to-violet-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-indigo-800 dark:text-indigo-300 backdrop-blur-sm">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                <AlertCircle className="w-4 h-4" />
              </div>
              <span>현재 {records.length}개의 거래 내역이 브라우저 LocalStorage에만 보관 중입니다. 기기 변경 시 데이터가 소실되므로 수시로 백업해 주세요.</span>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/40 border border-transparent dark:border-indigo-500/30 px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex-shrink-0 self-end sm:self-auto"
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
