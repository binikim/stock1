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
      {/* 데이터 유실 주의 경고 */}
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-200">환경 설정 및 자산 백업</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">애플리케이션 옵션 조정 및 데이터 보존 장치를 설정합니다.</p>
        </div>

        {/* 로컬스토리지 경고 카드 */}
        <div className="bg-slate-100/60 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 flex items-start space-x-3.5 text-slate-700 dark:text-slate-355">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-200">데이터 보존 안내 (LocalStorage 방식)</h5>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              본 서비스는 별도의 백엔드 데이터베이스가 없는 서버리스 앱입니다. **모든 데이터는 브라우저 내부 LocalStorage에 보존**되므로 캐시를 지우거나 시크릿 모드를 사용할 경우 거래 이력이 **모두 삭제되며 복구가 불가능**합니다. 정기적인 CSV 다운로드 백업을 권장합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 1. API 키 설정 카드 */}
      <div className="trendy-card p-6 md:p-8 space-y-6">
        <div className="flex items-center space-x-2.5 pb-4.5 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-650 dark:text-indigo-400">
            <Key className="w-4 h-4" />
          </div>
          <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">API 연동 키 저장소</h5>
        </div>

        {/* 보안 경고 */}
        <div className="bg-rose-500/5 dark:bg-rose-950/10 border border-rose-500/10 dark:border-rose-950/20 rounded-2xl p-4 flex items-start space-x-3 text-rose-650 dark:text-rose-400/90">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="space-y-1">
            <h5 className="text-[11px] font-black uppercase tracking-wider">자격 증명 평문 저장 주의</h5>
            <p className="text-[10px] leading-relaxed opacity-95">
              입력하시는 외부 API Key는 브라우저 LocalStorage에 **암호화 없이 평문 상태로 저장**됩니다. 공용 컴퓨터 환경에서는 키 정보의 유출 예방을 위해 보존에 주의해 주세요.
            </p>
          </div>
        </div>

        <div className="space-y-5 text-xs">
          {/* Gemini API Key */}
          <div className="space-y-2">
            <label htmlFor="input-gemini-key" className="block font-black text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500">
              Gemini API Key (AI 포트폴리오 상담용)
            </label>
            <input
              id="input-gemini-key"
              type="password"
              placeholder="Google AI Studio API Key"
              value={geminiApiKey}
              onChange={(e) => onUpdateGeminiKey(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs text-slate-900 dark:text-white"
            />
            <p className="text-[9px] text-slate-400 dark:text-slate-550 leading-relaxed">
              Google AI Studio에서 무료로 발급받으실 수 있으며, `gemini-3-flash-preview` 모델 호출에 사용됩니다.
            </p>
          </div>

          {/* Finnhub API Key */}
          <div className="space-y-2">
            <label htmlFor="input-stock-key" className="block font-black text-[10px] uppercase tracking-wider text-slate-450 dark:text-slate-500">
              Finnhub API Key (실시간 현재가 조회용)
            </label>
            <input
              id="input-stock-key"
              type="password"
              placeholder="Finnhub.io API Token"
              value={stockApiKey}
              onChange={(e) => onUpdateStockKey(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-550 font-mono text-xs text-slate-900 dark:text-white"
            />
            <p className="text-[9px] text-slate-400 dark:text-slate-555 leading-relaxed">
              Finnhub에 등록하신 고유 토큰 키를 적으면 포트폴리오 탭의 현재가가 실시간 주식 가격으로 동기화됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 2. 테마 설정 카드 */}
      <div className="trendy-card p-5 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-slate-55 dark:bg-slate-900 rounded-2xl text-slate-650 dark:text-slate-400 shadow-sm border border-slate-200/50 dark:border-slate-800/50">
            {isDarkMode ? <Moon className="w-4.5 h-4.5 text-indigo-400" /> : <Sun className="w-4.5 h-4.5 text-amber-500" />}
          </div>
          <div>
            <h5 className="text-xs font-extrabold text-slate-850 dark:text-slate-200">다크 모드</h5>
            <p className="text-[10px] text-slate-400 dark:text-slate-550">화면의 조도 테마 모드를 토글합니다.</p>
          </div>
        </div>
        <button
          onClick={onToggleDarkMode}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isDarkMode ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'
          }`}
        >
          <span
            className={`${
              isDarkMode ? 'translate-x-5.5' : 'translate-x-0.5'
            } inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#070913] transition-transform shadow-md`}
          />
        </button>
      </div>

      {/* 3. CSV 백업 및 복원 카드 */}
      <div className="trendy-card p-6 md:p-8 space-y-6">
        <div className="flex items-center space-x-2.5 pb-4.5 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-650 dark:text-indigo-400">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">자산 데이터 백업 및 복원</h5>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          {/* 내보내기 */}
          <div className="p-5 border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl flex flex-col justify-between">
            <div className="space-y-1.5 mb-5">
              <h6 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">CSV 파일로 내보내기</h6>
              <p className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-550">
                현재 보존되어 있는 모든 거래 일지 데이터를 엑셀과 호환되는 CSV 백업 파일 형식으로 내려받습니다.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center space-x-1.5 w-full py-2.5 bg-white dark:bg-slate-800/80 text-slate-750 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors shadow-sm btn-trendy"
            >
              <Download className="w-3.5 h-3.5" />
              <span>백업 파일 내려받기</span>
            </button>
          </div>

          {/* 가져오기 */}
          <div className="p-5 border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl space-y-4.5">
            <div className="space-y-1.5">
              <h6 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">백업 파일 올리기</h6>
              <p className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-555">
                이전에 다운로드해 놓은 거래 일지 CSV 파일을 업로드하여 데이터를 복구합니다.
              </p>
            </div>

            {/* 복구 라디오 */}
            <div className="flex flex-col space-y-2 text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <label className="flex items-center space-x-2 cursor-pointer hover:text-indigo-500 transition-colors">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="w-4 h-4 text-indigo-650 focus:ring-indigo-500 accent-indigo-500"
                />
                <span>기존 기록 유지하며 덧붙이기 (Append)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer hover:text-indigo-500 transition-colors">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'overwrite'}
                  onChange={() => setImportMode('overwrite')}
                  className="w-4 h-4 text-indigo-650 focus:ring-indigo-500 accent-indigo-500"
                />
                <span>기존 기록 무시하고 덮어쓰기 (Overwrite)</span>
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
                className="flex items-center justify-center space-x-1.5 w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-650 dark:from-emerald-600 dark:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-300 btn-trendy"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>백업 파일 복구하기</span>
              </button>
            </div>
          </div>
        </div>

        {/* 상태 메시지 */}
        {importStatus && (
          <div className={`p-4 rounded-xl border flex items-start space-x-2.5 text-xs font-bold animate-fade-in ${
            importStatus.success
              ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/5 border-rose-500/15 text-rose-600 dark:text-rose-400'
          }`}>
            {importStatus.success ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
