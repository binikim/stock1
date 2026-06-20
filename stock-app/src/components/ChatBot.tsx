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
          <h5 key={lineIdx} className="text-xs font-bold text-zinc-900 dark:text-zinc-50 mt-3 mb-1.5 flex items-center space-x-1.5">
            <span className="w-1 h-3 bg-zinc-800 dark:bg-zinc-200 rounded-full" />
            <span>{currentLine.replace('### ', '')}</span>
          </h5>
        );
      }
      if (currentLine.startsWith('## ')) {
        return (
          <h4 key={lineIdx} className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mt-4 mb-2">
            {currentLine.replace('## ', '')}
          </h4>
        );
      }

      const listMatch = currentLine.match(/^[-*]\s+(.*)$/);
      if (listMatch) {
        return (
          <li key={lineIdx} className="ml-4 list-disc text-xs text-zinc-650 dark:text-zinc-350 my-1 leading-relaxed">
            {parseInlineMarkdown(listMatch[1])}
          </li>
        );
      }

      if (currentLine.trim() === '') {
        return <div key={lineIdx} className="h-1.5" />;
      }

      return (
        <p key={lineIdx} className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-350">
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
        return <strong key={index} className="font-bold text-zinc-900 dark:text-zinc-50">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-zinc-750 dark:text-zinc-300">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px] text-zinc-800 dark:text-zinc-200 rounded border border-zinc-200 dark:border-zinc-700">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center p-8 flat-panel rounded-xl min-h-[450px] space-y-6 text-center animate-fade-in">
        <div className="p-4 bg-zinc-100 dark:bg-zinc-800/80 rounded-full text-zinc-850 dark:text-zinc-200">
          <Key className="w-8 h-8" />
        </div>
        <div className="max-w-sm space-y-2">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">AI 자산 비서 연동 설정 필요</h4>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
            사용자의 포트폴리오를 자산 비서가 실시간으로 분석하고 분산 투자에 대한 맞춤 컨설팅을 제공하기 위해 **Gemini API 키**를 먼저 등록해 주세요.
          </p>
        </div>
        <button
          onClick={onNavigateToSettings}
          className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg text-xs font-semibold transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>설정으로 이동하여 API 키 등록</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flat-panel rounded-xl shadow-sm flex flex-col h-[600px] overflow-hidden animate-fade-in">
      {/* 챗봇 헤더 */}
      <div className="px-6 py-4 bg-zinc-55/40 dark:bg-zinc-900/10 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg">
            <Bot className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">AI 포트폴리오 비서</h4>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-zinc-400 dark:bg-zinc-650 rounded-full" />
              <span className="text-[9px] text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider">포트폴리오 대화 연동</span>
            </div>
          </div>
        </div>
        {chatHistory.length > 0 && (
          <button
            onClick={onClearChat}
            className="flex items-center space-x-1 text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-bold p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>대화 청소</span>
          </button>
        )}
      </div>

      {/* 대화 이력 영역 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg flex items-center justify-center text-zinc-500">
              <Bot className="w-5 h-5" />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-zinc-800 dark:text-zinc-200 font-bold text-xs">무엇이든 분석해 드립니다</p>
              <p className="text-zinc-400 dark:text-zinc-600 text-[10px] leading-relaxed">
                현재 포트폴리오 자산 배분 비중의 안정성, 수익률 개선 가이드, 그리고 리스크 관리 방안에 대해 AI 비서와 상담을 나누어 보세요.
              </p>
            </div>
          </div>
        ) : (
          chatHistory.map((message) => {
            const isBot = message.role === 'model';
            return (
              <div
                key={message.id}
                className={`flex space-x-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {/* 봇 아바타 */}
                {isBot && (
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 flex items-center justify-center flex-shrink-0 border border-zinc-200/50 dark:border-zinc-700/50 shadow-inner">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* 챗 버블 */}
                <div
                  className={`max-w-[78%] rounded-xl p-3.5 text-zinc-850 dark:text-zinc-100 text-xs md:text-sm ${
                    isBot
                      ? 'bg-zinc-50/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-none leading-relaxed'
                      : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-tr-none'
                  }`}
                >
                  {isBot ? (
                    <div className="space-y-1">{renderMarkdown(message.content)}</div>
                  ) : (
                    <p className="leading-relaxed text-xs">{message.content}</p>
                  )}
                  <div
                    className={`text-[8px] text-right mt-1 select-none ${
                      isBot ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-300 dark:text-zinc-600'
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
                  <div className="w-7 h-7 rounded-lg bg-zinc-150 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 flex items-center justify-center flex-shrink-0 shadow-inner border border-zinc-200/50 dark:border-zinc-700/50">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* 로딩인디케이터 */}
        {isSending && (
          <div className="flex space-x-3 justify-start animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 flex items-center justify-center flex-shrink-0 border border-zinc-200/50 dark:border-zinc-700/50 shadow-inner">
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-zinc-50/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl rounded-tl-none p-3 flex items-center space-x-2 text-[10px] text-zinc-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-550" />
              <span>포트폴리오 비서가 답변을 기안 중입니다...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 창 */}
      <form
        onSubmit={handleSend}
        className="px-6 py-4 bg-zinc-55/40 dark:bg-zinc-900/10 border-t border-zinc-200 dark:border-zinc-800 flex items-center space-x-2"
      >
        <input
          type="text"
          placeholder="자산 데이터를 기반으로 개선할 부분 조언해 줘..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isSending}
          className="flex-1 px-4 py-2.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-750 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-white disabled:opacity-55"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isSending}
          className="p-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
