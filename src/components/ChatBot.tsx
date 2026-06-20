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
      // 에러 처리
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isSending]);

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      let currentLine = line;

      if (currentLine.startsWith('### ')) {
        return (
          <h5 key={lineIdx} className="text-xs font-black text-slate-900 dark:text-white mt-4 mb-2 flex items-center space-x-2">
            <span className="w-1.5 h-3.5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full" />
            <span>{currentLine.replace('### ', '')}</span>
          </h5>
        );
      }
      if (currentLine.startsWith('## ')) {
        return (
          <h4 key={lineIdx} className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-5 mb-2.5">
            {currentLine.replace('## ', '')}
          </h4>
        );
      }

      const listMatch = currentLine.match(/^[-*]\s+(.*)$/);
      if (listMatch) {
        return (
          <li key={lineIdx} className="ml-4 list-disc text-xs text-slate-650 dark:text-slate-350 my-1 leading-relaxed">
            {parseInlineMarkdown(listMatch[1])}
          </li>
        );
      }

      if (currentLine.trim() === '') {
        return <div key={lineIdx} className="h-2" />;
      }

      return (
        <p key={lineIdx} className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
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
        return <strong key={index} className="font-extrabold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-slate-750 dark:text-slate-300">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 font-mono text-[10px] text-indigo-650 dark:text-indigo-400 rounded border border-slate-200/50 dark:border-slate-800/55">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center p-8 trendy-card min-h-[460px] space-y-6 text-center animate-fade-in">
        <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-3xl text-indigo-500 dark:text-indigo-400 shadow-inner border border-indigo-500/15">
          <Key className="w-8 h-8 animate-pulse" />
        </div>
        <div className="max-w-sm space-y-2.5">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">AI 자산 비서 연동 필요</h4>
          <p className="text-xs text-slate-400 dark:text-slate-450 leading-relaxed">
            사용자의 포트폴리오를 자산 비서가 실시간으로 분석하고 분산 투자에 대한 맞춤 컨설팅을 제공하기 위해 **Gemini API 키**를 먼저 등록해 주세요.
          </p>
        </div>
        <button
          onClick={onNavigateToSettings}
          className="flex items-center space-x-1.5 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-300 btn-trendy"
        >
          <Sparkles className="w-4 h-4" />
          <span>설정으로 이동하여 API 키 등록</span>
        </button>
      </div>
    );
  }

  return (
    <div className="trendy-card shadow-lg flex flex-col h-[600px] overflow-hidden animate-fade-in">
      {/* 챗봇 헤더 */}
      <div className="px-6 py-4.5 bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-gradient-to-br from-indigo-550 to-purple-600 text-white rounded-xl shadow-md">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-850 dark:text-slate-200">AI 포트폴리오 비서</h4>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider">상담 채널 활성화됨</span>
            </div>
          </div>
        </div>
        {chatHistory.length > 0 && (
          <button
            onClick={onClearChat}
            className="flex items-center space-x-1 text-[11px] text-slate-450 hover:text-rose-500 dark:hover:text-rose-400 font-bold p-2 hover:bg-slate-105 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>상담 초기화</span>
          </button>
        )}
      </div>

      {/* 대화 이력 영역 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-500/5 dark:bg-indigo-950/15 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner border border-indigo-550/10">
              <Bot className="w-5.5 h-5.5" />
            </div>
            <div className="max-w-xs space-y-1.5">
              <p className="text-slate-850 dark:text-slate-200 font-extrabold text-xs">무엇이든 상담해 보세요</p>
              <p className="text-slate-400 dark:text-slate-550 text-[10px] leading-relaxed">
                현재 내 포트폴리오의 분산 투자 안정성, 리스크 헤지 대안, 그리고 향후 자산 성장 전략에 대하여 AI 상담 비서와 자유롭게 소통하세요.
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
                  <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900/80 text-slate-650 dark:text-slate-350 flex items-center justify-center flex-shrink-0 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* 챗 버블 */}
                <div
                  className={`max-w-[78%] rounded-2xl p-4 text-slate-800 dark:text-slate-100 text-xs md:text-sm ${
                    isBot
                      ? 'bg-slate-50/60 dark:bg-slate-900/60 border border-slate-250/40 dark:border-slate-800/40 rounded-tl-none leading-relaxed'
                      : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-tr-none shadow-md shadow-indigo-500/10'
                  }`}
                >
                  {isBot ? (
                    <div className="space-y-1.5">{renderMarkdown(message.content)}</div>
                  ) : (
                    <p className="leading-relaxed text-xs">{message.content}</p>
                  )}
                  <div
                    className={`text-[8px] text-right mt-2 select-none ${
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
                  <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900/80 text-slate-650 dark:text-slate-350 flex items-center justify-center flex-shrink-0 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* AI 타이핑 */}
        {isSending && (
          <div className="flex space-x-3.5 justify-start animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900/80 text-slate-650 dark:text-slate-350 flex items-center justify-center flex-shrink-0 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl rounded-tl-none p-4 flex items-center space-x-2 text-[10px] text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>포트폴리오 비서가 자산 진단 보고서를 작성하고 있습니다...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 창 */}
      <form
        onSubmit={handleSend}
        className="px-6 py-4.5 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-200/50 dark:border-slate-800/55 flex items-center space-x-3"
      >
        <input
          type="text"
          placeholder="내 자산 분산 상태가 안전한지 분석해 줘..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isSending}
          className="flex-1 px-4.5 py-3 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white disabled:opacity-55"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isSending}
          className="p-3 bg-gradient-to-r from-indigo-500 to-violet-650 hover:shadow-indigo-500/20 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all btn-trendy shadow-md"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
