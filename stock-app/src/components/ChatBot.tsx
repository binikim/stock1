import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, PortfolioItem, PortfolioSummary } from '../types';
import { Send, Bot, User, Trash2, Key, Sparkles, Loader2 } from 'lucide-react';

interface ChatBotProps {
  apiKey: string;
  portfolioItems: PortfolioItem[];
  portfolioSummary: PortfolioSummary;
  chatHistory: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
  onClearChat: () => void;
  isSending: boolean;
  onNavigateToSettings: () => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({
  apiKey,
  chatHistory,
  onSendMessage,
  onClearChat,
  isSending,
  onNavigateToSettings,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    
    try {
      await onSendMessage(messageContent);
    } catch (err) {
      // 에러 핸들링
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isSending]);

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      let currentLine = line;

      // 1. 헤더 처리 (###)
      if (currentLine.startsWith('### ')) {
        return (
          <h5 key={lineIdx} className="text-sm font-extrabold text-slate-900 dark:text-white mt-4 mb-1.5 flex items-center space-x-1">
            <span className="w-1 h-3.5 bg-indigo-500 rounded-full" />
            <span>{currentLine.replace('### ', '')}</span>
          </h5>
        );
      }
      if (currentLine.startsWith('## ')) {
        return (
          <h4 key={lineIdx} className="text-base font-extrabold text-indigo-900 dark:text-indigo-400 mt-5 mb-2.5">
            {currentLine.replace('## ', '')}
          </h4>
        );
      }

      // 2. 리스트 처리 (- 또는 *)
      const listMatch = currentLine.match(/^[-*]\s+(.*)$/);
      if (listMatch) {
        return (
          <li key={lineIdx} className="ml-4 list-disc text-xs md:text-sm text-slate-700 dark:text-slate-300 my-1 leading-relaxed">
            {parseInlineMarkdown(listMatch[1])}
          </li>
        );
      }

      // 3. 일반 줄바꿈 처리 및 인라인 마크다운 렌더링
      if (currentLine.trim() === '') {
        return <div key={lineIdx} className="h-2" />;
      }

      return (
        <p key={lineIdx} className="text-xs md:text-sm leading-relaxed text-slate-750 dark:text-slate-300">
          {parseInlineMarkdown(currentLine)}
        </p>
      );
    });
  };

  const parseInlineMarkdown = (text: string) => {
    const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    const parts = text.split(regex);
    if (parts.length === 1) return text;

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-extrabold text-slate-950 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-slate-800 dark:text-slate-200">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="px-2 py-0.5 bg-slate-200/50 dark:bg-slate-800 font-mono text-[11px] text-indigo-600 dark:text-indigo-400 rounded-lg border border-slate-300/30 dark:border-white/5">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center p-8 glass-panel border border-white/20 dark:border-white/5 rounded-3xl min-h-[480px] space-y-6 text-center animate-fade-in">
        <div className="p-4.5 bg-gradient-to-tr from-indigo-500/10 to-indigo-500/20 dark:from-indigo-950/40 dark:to-indigo-950/60 rounded-full text-indigo-600 dark:text-indigo-400 shadow-inner">
          <Key className="w-10 h-10 animate-pulse" />
        </div>
        <div className="max-w-sm space-y-2">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">투자 조언용 AI 비서 설정 필요</h4>
          <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed">
            사용자의 포트폴리오를 자산 비서가 실시간으로 분석하고 분산 투자에 대한 맞춤 컨설팅을 제공하기 위해 **Gemini API 키**를 먼저 등록해 주세요.
          </p>
        </div>
        <button
          onClick={onNavigateToSettings}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-700 hover:to-indigo-850 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/15 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4" />
          <span>설정으로 이동하여 API 키 등록</span>
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel border border-white/20 dark:border-white/5 rounded-3xl shadow-sm flex flex-col h-[640px] overflow-hidden animate-fade-in">
      {/* 챗봇 헤더 */}
      <div className="px-6 py-4 bg-slate-50/40 dark:bg-slate-850/15 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 via-indigo-750 to-purple-650 text-white rounded-2xl shadow-md shadow-indigo-550/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">AI 포트폴리오 코파일럿</h4>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">포트폴리오 대화 연동 완료</span>
            </div>
          </div>
        </div>
        {chatHistory.length > 0 && (
          <button
            onClick={onClearChat}
            className="flex items-center space-x-1.5 text-xs text-rose-500 hover:text-rose-700 font-bold p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>상담 초기화</span>
          </button>
        )}
      </div>

      {/* 대화 기록 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-14 h-14 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner">
              <Bot className="w-7 h-7" />
            </div>
            <div className="max-w-sm space-y-1">
              <p className="text-slate-800 dark:text-slate-200 font-bold text-sm">무엇이든 분석해 드립니다</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs leading-relaxed">
                현재 포트폴리오 자산 배분 비중의 안정성, 수익률 개선 가이드, 그리고 리스크 관리 방안에 대해 인공지능 투자 상담을 나누어 보세요.
              </p>
            </div>
          </div>
        ) : (
          chatHistory.map((message) => {
            const isBot = message.role === 'model';
            return (
              <div
                key={message.id}
                className={`flex space-x-3.5 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {/* 봇 아바타 */}
                {isBot && (
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-100/40 dark:border-indigo-900/30 shadow-inner">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                )}

                {/* 챗 버블 */}
                <div
                  className={`max-w-[78%] rounded-2xl p-4.5 shadow-sm text-slate-800 dark:text-slate-100 ${
                    isBot
                      ? 'bg-slate-50/70 dark:bg-slate-850/50 border border-slate-100 dark:border-white/5 rounded-tl-none leading-relaxed'
                      : 'bg-gradient-to-tr from-indigo-600 via-indigo-750 to-purple-650 text-white rounded-tr-none shadow-indigo-650/15'
                  }`}
                >
                  {isBot ? (
                    <div className="space-y-1.5">{renderMarkdown(message.content)}</div>
                  ) : (
                    <p className="text-xs md:text-sm leading-relaxed">{message.content}</p>
                  )}
                  <div
                    className={`text-[9px] text-right mt-1.5 select-none ${
                      isBot ? 'text-slate-400 dark:text-slate-500' : 'text-indigo-200'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* 유저 아바타 */}
                {!isBot && (
                  <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-850 text-slate-650 dark:text-slate-350 flex items-center justify-center flex-shrink-0 shadow-inner border border-slate-200/50 dark:border-white/5">
                    <User className="w-4.5 h-4.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* AI 타이핑 로더 */}
        {isSending && (
          <div className="flex space-x-3.5 justify-start animate-pulse">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-100/40 dark:border-indigo-900/30 shadow-inner">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div className="bg-slate-50/70 dark:bg-slate-850/50 border border-slate-100 dark:border-white/5 rounded-2xl rounded-tl-none p-4 flex items-center space-x-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span>포트폴리오 비서가 자산 데이터 요약을 기반으로 답변을 구성 중입니다...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 대화 입력 창 */}
      <form
        onSubmit={handleSend}
        className="px-6 py-4.5 bg-slate-50/40 dark:bg-slate-850/15 border-t border-slate-100 dark:border-white/5 flex items-center space-x-3"
      >
        <input
          type="text"
          placeholder="나의 현재 자산 포트폴리오를 평가하고 보완할 점을 조언해 줘..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isSending}
          className="flex-1 px-4.5 py-3 text-xs md:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-55"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isSending}
          className="p-3 bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-650 text-white rounded-2xl transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.04] active:scale-[0.96]"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
