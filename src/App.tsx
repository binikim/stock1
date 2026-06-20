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
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';

function App() {
  // 1. 전역 상태 정의 (LocalStorage 기반)
  const [records, setRecords] = useLocalStorage<TransactionRecord[]>('stock_portfolio_records', []);
  const [config, setConfig] = useLocalStorage<AppConfig>('stock_portfolio_config', {
    geminiApiKey: '',
    stockApiKey: '',
    isDarkMode: true,
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#070913] flex flex-col font-sans transition-colors duration-300 pb-20 md:pb-0">
      {/* 글로벌 헤더 (Glassmorphism Fintech Header) */}
      <header className="sticky top-0 z-40 glass-header transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-slate-300 leading-none">
                주식 가계부
              </h1>
              <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-black tracking-widest uppercase mt-1.5 block">
                Portfolio Copilot
              </span>
            </div>
          </div>

          {/* 데스크탑 탭 메뉴 & 테마 토글 */}
          <div className="hidden md:flex items-center space-x-4">
            <nav className="flex space-x-1.5 bg-slate-100/50 dark:bg-slate-950/40 p-1.5 rounded-2xl border border-slate-200/40 dark:border-slate-850/30">
              {[
                { id: 'dashboard', label: '대시보드', icon: BarChart3, activeClass: 'bg-gradient-to-r from-indigo-550 to-violet-600 text-white shadow-[0_8px_16px_-4px_rgba(99,102,241,0.3)]' },
                { id: 'portfolio', label: '포트폴리오', icon: TableProperties, activeClass: 'bg-gradient-to-r from-violet-550 to-purple-600 text-white shadow-[0_8px_16px_-4px_rgba(139,92,246,0.3)]' },
                { id: 'records', label: '매수 기록', icon: History, activeClass: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-[0_8px_16px_-4px_rgba(245,158,11,0.3)]' },
                { id: 'chatbot', label: 'AI 투자 상담', icon: MessageSquareCode, activeClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_8px_16px_-4px_rgba(16,185,129,0.3)]', badge: !!config.geminiApiKey },
                { id: 'settings', label: '설정', icon: SettingsIcon, activeClass: 'bg-gradient-to-r from-slate-700 to-slate-850 dark:from-slate-600 dark:to-slate-750 text-white shadow-[0_8px_16px_-4px_rgba(71,85,105,0.3)]' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 btn-trendy ${
                      isActive
                        ? tab.activeClass
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="flex h-1.5 w-1.5 relative ml-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* 헤더 다크모드 토글 스위치 */}
            <button
              onClick={() => setConfig((prev) => ({ ...prev, isDarkMode: !prev.isDarkMode }))}
              className="p-2.5 bg-white dark:bg-[#121320]/80 border border-slate-200/60 dark:border-slate-800/60 rounded-xl text-slate-600 dark:text-slate-450 hover:text-indigo-500 dark:hover:text-indigo-400 hover:scale-105 transition-all duration-200 shadow-sm"
              title={config.isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {config.isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 탭 메뉴 (하단 고정) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-45 bg-white/95 dark:bg-[#161822]/95 border-t border-[#e7e5e4] dark:border-[#232635] flex items-center justify-around py-2 shadow-lg">
        {[
          { id: 'dashboard', label: '대시보드', icon: BarChart3, color: 'text-teal-600 dark:text-teal-400' },
          { id: 'portfolio', label: '포트폴리오', icon: TableProperties, color: 'text-violet-500' },
          { id: 'records', label: '매수 기록', icon: History, color: 'text-amber-500' },
          { id: 'chatbot', label: 'AI 상담', icon: MessageSquareCode, color: 'text-emerald-500', badge: !!config.geminiApiKey },
          { id: 'settings', label: '설정', icon: SettingsIcon, color: 'text-stone-400' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-1 px-3 space-y-0.5 text-[9px] font-bold transition-colors ${
                isActive ? tab.color : 'text-stone-400'
              }`}
            >
              <div className="relative">
                <Icon className="w-4.5 h-4.5" />
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* 상시 데이터 유실 알림 배너 */}
        {records.length > 0 && activeTab === 'dashboard' && (
          <div className="mb-6 bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/20 dark:border-amber-900/30 rounded-2xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-amber-850 dark:text-amber-400">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <span>현재 LocalStorage 상태입니다. 기기 이동 시 데이터를 지키기 위해 CSV 백업을 적극 활용하세요.</span>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex-shrink-0"
            >
              CSV 백업본 내려받기 →
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
