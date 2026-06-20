import React, { useRef, useState } from 'react';
import type { TransactionRecord, MarketType } from '../types';
import { Key, Moon, Sun, Download, Upload, AlertTriangle, ShieldAlert, FileText, CheckCircle } from 'lucide-react';

interface SettingsProps {
  geminiApiKey: string;
  stockApiKey: string;
  isDarkMode: boolean;
  onUpdateGeminiKey: (key: string) => void;
  onUpdateStockKey: (key: string) => void;
  onToggleDarkMode: () => void;
  records: TransactionRecord[];
  onImportRecords: (imported: TransactionRecord[], mode: 'append' | 'overwrite') => void;
}

export const Settings: React.FC<SettingsProps> = ({
  geminiApiKey,
  stockApiKey,
  isDarkMode,
  onUpdateGeminiKey,
  onUpdateStockKey,
  onToggleDarkMode,
  records,
  onImportRecords,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'append' | 'overwrite'>('append');
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleExportCSV = () => {
    if (records.length === 0) {
      alert('내보낼 매수 기록이 없습니다.');
      return;
    }

    const headers = ['id', 'ticker', 'name', 'market', 'date', 'price', 'quantity', 'memo'];
    const csvRows = [headers.join(',')];

    records.forEach((r) => {
      const memoEscaped = r.memo ? `"${r.memo.replace(/"/g, '""')}"` : '';
      const nameEscaped = `"${r.name.replace(/"/g, '""')}"`;
      const row = [
        r.id,
        r.ticker,
        nameEscaped,
        r.market,
        r.date,
        r.price,
        r.quantity,
        memoEscaped,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stock_portfolio_backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.replace(/^\uFEFF/, '').split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
        if (lines.length < 2) {
          throw new Error('가져올 데이터 행이 없습니다.');
        }

        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
        const requiredHeaders = ['ticker', 'name', 'market', 'date', 'price', 'quantity'];
        const hasRequired = requiredHeaders.every((req) => headers.includes(req));

        if (!hasRequired) {
          throw new Error('CSV 헤더 구성이 잘못되었습니다. 필수 필드: ticker, name, market, date, price, quantity');
        }

        const tickerIdx = headers.indexOf('ticker');
        const nameIdx = headers.indexOf('name');
        const marketIdx = headers.indexOf('market');
        const dateIdx = headers.indexOf('date');
        const priceIdx = headers.indexOf('price');
        const quantityIdx = headers.indexOf('quantity');
        const memoIdx = headers.indexOf('memo');
        const idIdx = headers.indexOf('id');

        const parsedRecords: TransactionRecord[] = [];

        for (let i = 1; i < lines.length; i++) {
          const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
          const columns = matches.map((c) => c.replace(/^["']|["']$/g, '').trim());

          if (columns.length < requiredHeaders.length) continue;

          const ticker = columns[tickerIdx];
          const name = columns[nameIdx];
          const market = columns[marketIdx] as MarketType;
          const date = columns[dateIdx];
          const price = parseFloat(columns[priceIdx]);
          const quantity = parseFloat(columns[quantityIdx]);
          const memo = memoIdx !== -1 ? columns[memoIdx] : undefined;
          const id = (idIdx !== -1 && columns[idIdx]) ? columns[idIdx] : Math.random().toString(36).substring(2, 9);

          if (!ticker || !name || !date || isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
            continue;
          }

          if (market !== 'domestic' && market !== 'foreign') {
            continue;
          }

          parsedRecords.push({
            id,
            ticker: ticker.toUpperCase(),
            name,
            market,
            date,
            price,
            quantity,
            memo: memo || undefined,
          });
        }

        if (parsedRecords.length === 0) {
          throw new Error('유효한 데이터 행을 파싱하지 못했습니다.');
        }

        onImportRecords(parsedRecords, importMode);
        setImportStatus({
          success: true,
          message: `성공적으로 ${parsedRecords.length}개의 거래 기록을 가져왔습니다.`,
        });

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err: any) {
        setImportStatus({
          success: false,
          message: `가져오기 실패: ${err.message || '파일 분석 중 에러'}`,
        });
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* 데이터 유실 주의 경고 및 타이틀 */}
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">환경 설정 및 자산 백업</h4>
          <p className="text-xs text-slate-400 dark:text-slate-550 mt-1">애플리케이션 옵션 조정 및 데이터 보존 장치를 설정합니다.</p>
        </div>

        {/* 로컬스토리지 경고 카드 (Glow 및 그라데이션) */}
        <div className="bg-amber-500/10 dark:bg-amber-950/20 border border-amber-500/30 dark:border-amber-900/40 rounded-3xl p-6 flex items-start space-x-3.5 text-slate-700 dark:text-slate-350">
          <AlertTriangle className="w-5 h-5 text-amber-550 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-sm font-extrabold text-slate-900 dark:text-amber-400">데이터 유실 경고 (서버 미보유)</h5>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              본 서비스는 가입 절차나 서버 백엔드가 존재하지 않아 데이터 유출 염려가 없습니다. 다만, **모든 데이터는 브라우저 내부 LocalStorage에 보존**되므로 캐시를 지우거나, 시크릿 탭 실행, 또는 브라우저 데이터를 삭제할 시 거래 이력이 **모두 파기되며 복구가 불가능**합니다. 주기적인 CSV 다운로드 백업을 간곡히 권장합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 1. API 키 설정 카드 */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-550 dark:text-indigo-400">
            <Key className="w-5 h-5" />
          </div>
          <h5 className="text-base font-bold text-slate-900 dark:text-slate-100">외부 API 자격 증명 관리</h5>
        </div>

        {/* 보안 경고 */}
        <div className="bg-rose-500/10 border border-rose-500/20 dark:border-rose-900/30 rounded-2xl p-5 flex items-start space-x-3.5 text-rose-650 dark:text-rose-400">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="space-y-1">
            <h5 className="text-xs font-bold">평문 저장에 대한 보안 주의 경고</h5>
            <p className="text-[11px] leading-relaxed text-slate-550 dark:text-slate-400">
              사용자가 설정한 모든 API 키는 암호화되지 않은 평문 상태로 브라우저 로컬 저장소에 기입됩니다.
              따라서 **여러 명이 공용으로 공유하는 PC 또는 외부 브라우저** 환경에서는 타인에 의해 유출될 위험이 있으므로 자격 증명 키 보존에 신중해 주시기 바랍니다.
            </p>
          </div>
        </div>

        <div className="space-y-5 text-sm">
          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <label htmlFor="input-gemini-key" className="block font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Gemini API Key (AI 포트폴리오 상담용)
            </label>
            <input
              id="input-gemini-key"
              type="password"
              placeholder="대화 분석에 필요한 Google AI Studio API 키 기입"
              value={geminiApiKey}
              onChange={(e) => onUpdateGeminiKey(e.target.value)}
              className="w-full px-4.5 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-xs text-slate-900 dark:text-white"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-555">
              Google AI Studio 웹페이지에서 무료 발급이 가능하며, 보유 자산을 분석해 줄 비서 모델 `gemini-3-flash-preview` 연동에 쓰입니다.
            </p>
          </div>

          {/* Finnhub API Key */}
          <div className="space-y-1.5">
            <label htmlFor="input-stock-key" className="block font-bold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-550">
              Finnhub API Key (실시간 현재가 조회용)
            </label>
            <input
              id="input-stock-key"
              type="password"
              placeholder="실시간 주가 조회에 필요한 Finnhub API 토큰 기입"
              value={stockApiKey}
              onChange={(e) => onUpdateStockKey(e.target.value)}
              className="w-full px-4.5 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-xs text-slate-900 dark:text-white"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-555">
              Finnhub.io 에서 무료 가입 시 얻을 수 있으며, 포트폴리오 테이블의 현재가 자동 업데이트 처리에 사용됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 2. 테마 설정 카드 (글래스 패널) */}
      <div className="glass-panel rounded-3xl p-6 shadow-sm flex items-center justify-between border border-white/20 dark:border-white/5">
        <div className="flex items-center space-x-3.5">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-350 shadow-inner">
            {isDarkMode ? <Moon className="w-5 h-5 text-violet-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
          </div>
          <div>
            <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">다크 테마 환경</h5>
            <p className="text-xs text-slate-400 dark:text-slate-550">어둡고 편안한 느낌의 스페이스 다크 스킨으로 전환합니다.</p>
          </div>
        </div>
        <button
          onClick={onToggleDarkMode}
          className={`relative inline-flex h-6.5 w-12 items-center rounded-full transition-colors focus:outline-none ${
            isDarkMode ? 'bg-indigo-600' : 'bg-slate-250 dark:bg-slate-800'
          }`}
        >
          <span
            className={`${
              isDarkMode ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4.5 w-4.5 transform rounded-full bg-white transition-transform shadow`}
          />
        </button>
      </div>

      {/* 3. CSV 백업 및 복원 카드 */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-550 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <h5 className="text-base font-bold text-slate-900 dark:text-slate-100">자산 데이터 백업 및 복원</h5>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          {/* 내보내기 */}
          <div className="p-5 border border-slate-200/50 dark:border-white/5 bg-slate-50/40 dark:bg-slate-900/20 rounded-2xl flex flex-col justify-between">
            <div className="space-y-1 mb-4">
              <h6 className="font-bold text-slate-800 dark:text-slate-200">일지 CSV 파일 다운로드</h6>
              <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                현재 보존되어 있는 모든 매매 체결 일지 기록을 엑셀과 호환되는 CSV 백업본으로 즉시 저장합니다.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center space-x-2 w-full py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>백업 파일 내보내기</span>
            </button>
          </div>

          {/* 가져오기 */}
          <div className="p-5 border border-slate-200/50 dark:border-white/5 bg-slate-50/40 dark:bg-slate-900/20 rounded-2xl space-y-4">
            <div className="space-y-1">
              <h6 className="font-bold text-slate-800 dark:text-slate-200">CSV 데이터 일지 복구</h6>
              <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                이전에 기기에 다운로드받은 CSV 데이터 파일을 업로드하여 기존 데이터를 복원합니다.
              </p>
            </div>

            {/* 가져오기 옵션 */}
            <div className="flex items-center space-x-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <label className="flex items-center space-x-1.5 cursor-pointer hover:text-indigo-500 transition-colors">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                />
                <span>이어서 덧붙이기 (Append)</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer hover:text-indigo-500 transition-colors">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'overwrite'}
                  onChange={() => setImportMode('overwrite')}
                  className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                />
                <span>새 데이터로 덮어쓰기 (Overwrite)</span>
              </label>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleImportCSV}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-2 w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-700 hover:to-indigo-850 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/15 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Upload className="w-4 h-4" />
                <span>백업 파일 업로드</span>
              </button>
            </div>
          </div>
        </div>

        {/* 복구 성공/실패 문구 */}
        {importStatus && (
          <div className={`p-4 rounded-2xl border flex items-start space-x-2.5 text-xs font-semibold animate-fade-in ${
            importStatus.success
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 text-emerald-650 dark:text-emerald-450 shadow-sm'
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-250 text-rose-650 dark:text-rose-400 shadow-sm'
          }`}>
            {importStatus.success ? (
              <CheckCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-rose-500" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
