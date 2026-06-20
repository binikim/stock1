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

  // 메시지 전송
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    
    try {
      await onSendMessage(messageContent);
    } catch (err) {
      // 상위 컴포넌트에서 에러 핸들링
    }
  };

  // 대화 추가 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isSending]);

  // 자체 마크다운 파서 및 렌더링 도우미 (정규식을 활용한 커스텀 구현)
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      let currentLine = line;

      // 1. 헤더 처리 (###)
      if (currentLine.startsWith('### ')) {
        return (
          <h5 key={lineIdx} className="text-sm font-bold text-slate-800 dark:text-slate-105 mt-3 mb-1">
            {currentLine.replace('### ', '')}
          </h5>
        );
      }
      if (currentLine.startsWith('## ')) {
        return (
          <h4 key={lineIdx} className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2">
            {currentLine.replace('## ', '')}
          </h4>
        );
      }

      // 2. 리스트 처리 (- 또는 *)
      const listMatch = currentLine.match(/^[-*]\s+(.*)$/);
      if (listMatch) {
        return (
          <li key={lineIdx} className="ml-4 list-disc text-sm text-slate-700 dark:text-slate-350 my-1">
            {parseInlineMarkdown(listMatch[1])}
          </li>
        );
      }

      // 3. 일반 줄바꿈 처리 및 인라인 마크다운 렌더링
      if (currentLine.trim() === '') {
        return <div key={lineIdx} className="h-2" />;
      }

      return (
        <p key={lineIdx} className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {parseInlineMarkdown(currentLine)}
        </p>
      );
    });
  };

  // 볼드(**), 이탤릭(*), 인라인코드(`) 파싱 함수
  const parseInlineMarkdown = (text: string) => {
    // 텍스트를 문자열 및 React 요소의 혼합 배열로 가공
    const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    const parts = text.split(regex);
    if (parts.length === 1) return text;

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index} className="italic text-slate-800 dark:text-slate-200">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 font-mono text-xs text-indigo-500 rounded">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  // API 키가 등록되지 않은 경우 경고 화면
  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl min-h-[450px] space-y-6 text-center animate-fade-in">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-650 dark:text-indigo-400">
          <Key className="w-10 h-10 animate-pulse" />
        </div>
        <div className="max-w-sm space-y-2">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">AI 투자 상담 챗봇 사용 불가</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            사용자의 포트폴리오를 자산 비서가 분석하고 상담하기 위해서는 **Gemini API 키** 설정이 필요합니다.
          </p>
        </div>
        <button
          onClick={onNavigateToSettings}
          className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
        >
          <Sparkles className="w-4 h-4" />
          <span>설정으로 이동하여 API 키 등록</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-sm flex flex-col h-[600px] overflow-hidden animate-fade-in">
      {/* 챗봇 헤더 */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-inner">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">AI 포트폴리오 비서</h4>
            <div className="flex items-center space-x-1 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-400 font-medium">대기 중 • 포트폴리오 요약 정보 제공됨</span>
            </div>
          </div>
        </div>
        {chatHistory.length > 0 && (
          <button
            onClick={onClearChat}
            className="flex items-center space-x-1.5 text-xs text-rose-500 hover:text-rose-700 font-semibold p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>대화 기록 초기화</span>
          </button>
        )}
      </div>

      {/* 대화 이력 영역 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-indigo-500">
              <Bot className="w-6 h-6" />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-slate-700 dark:text-slate-350 font-medium text-sm">무엇이든 물어보세요!</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs">
                현재 주식 자산 구성 비율과 평가 손익 등을 물어보거나 일반적인 투자 조언을 얻을 수 있습니다.
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
                {/* 챗봇 아이콘 */}
                {isBot && (
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-100 dark:border-indigo-900">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* 메시지 버블 */}
                <div
                  className={`max-w-[75%] rounded-2xl p-4 space-y-1.5 shadow-sm text-slate-800 dark:text-slate-100 ${
                    isBot
                      ? 'bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}
                >
                  {isBot ? (
                    <div className="space-y-1">{renderMarkdown(message.content)}</div>
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                  <div
                    className={`text-[9px] text-right mt-1 ${
                      isBot ? 'text-slate-400' : 'text-indigo-250'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* 유저 아이콘 */}
                {!isBot && (
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* 로딩 표시 */}
        {isSending && (
          <div className="flex space-x-3 justify-start animate-pulse">
            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-100 dark:border-indigo-900">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center space-x-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              <span>포트폴리오 비서가 생각하고 답변을 작성 중입니다...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <form
        onSubmit={handleSend}
        className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-3"
      >
        <input
          type="text"
          placeholder="포트폴리오 분석, 자산 조언 등을 입력해 보세요..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isSending}
          className="flex-1 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isSending}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow disabled:opacity-55 disabled:cursor-not-allowed hover:scale-105"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
