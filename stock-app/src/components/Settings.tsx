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

  // 1. CSV 파일로 내보내기 (Export)
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

    const csvContent = '\uFEFF' + csvRows.join('\n'); // Excel 한글 깨짐 방지용 BOM 추가
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stock_portfolio_backup_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. CSV 파일 가져오기 (Import)
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

        // 헤더 검증
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

        // 데이터 파싱 및 유효성 검증
        for (let i = 1; i < lines.length; i++) {
          // CSV 파싱 정규식 (쉼표 단위 분리하되 큰따옴표 내 쉼표 무시)
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

          // 데이터 정합성 검증
          if (!ticker || !name || !date || isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
            console.warn(`Row ${i} skipped: Invalid data.`, columns);
            continue;
          }

          if (market !== 'domestic' && market !== 'foreign') {
            console.warn(`Row ${i} skipped: Invalid market type.`, market);
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
          message: `성공적으로 ${parsedRecords.length}개의 매수 기록을 가져왔습니다.`,
        });

        // 폼 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err: any) {
        setImportStatus({
          success: false,
          message: `가져오기 실패: ${err.message || '알 수 없는 파일 오류'}`,
        });
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* 타이틀 및 기기 저장소 경고 */}
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">설정 및 데이터 관리</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">앱 환경 설정 및 데이터 백업을 조율합니다.</p>
        </div>

        {/* 로컬스토리지 경고 카드 */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/60 rounded-2xl p-5 flex items-start space-x-3 text-slate-700 dark:text-slate-350">
          <AlertTriangle className="w-5 h-5 text-amber-550 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100">데이터 유실 경고 (서버 없음)</h5>
            <p className="text-xs leading-relaxed">
              본 서비스는 백엔드 서버 없이 브라우저의 **LocalStorage**만을 사용하여 데이터를 관리합니다.
              따라서 **기기 변경, 브라우저 변경, 캐시 삭제 또는 시크릿 모드 사용 시 입력하신 모든 데이터가 복구 불가능하게 삭제**됩니다.
              반드시 정기적으로 아래 백업 기능을 통해 CSV 파일을 받아 로컬에 보관해 주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 1. API 키 설정 카드 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Key className="w-5 h-5 text-indigo-500" />
          <h5 className="text-base font-bold text-slate-850 dark:text-slate-100">외부 API 키 관리</h5>
        </div>

        {/* 보안 경고 */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-xl p-4 flex items-start space-x-3 text-red-650 dark:text-red-400">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-xs font-bold">평문 저장 및 공용 PC 주의 경고</h5>
            <p className="text-[11px] leading-relaxed">
              입력하시는 API 키들은 브라우저 LocalStorage에 **암호화 없이 평문(Plain Text)으로 보존**됩니다.
              학교, 도서관, PC방 등 **공용 컴퓨터 또는 타인과 공유하는 브라우저**에서 키를 입력하면 유출의 위험이 크므로 사용을 자제하거나 사용 후 설정을 비워 주세요.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          {/* Gemini API Key */}
          <div>
            <label htmlFor="input-gemini-key" className="block font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-1.5">
              Gemini API Key (AI 투자 상담용)
            </label>
            <input
              id="input-gemini-key"
              type="password"
              placeholder="AI 대화 상담에 활용할 Google AI Studio API 키 입력"
              value={geminiApiKey}
              onChange={(e) => onUpdateGeminiKey(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Google AI Studio에서 무료로 발급할 수 있으며, `gemini-3-flash-preview` 모델 호출에 사용됩니다.
            </p>
          </div>

          {/* Finnhub API Key */}
          <div>
            <label htmlFor="input-stock-key" className="block font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-550 mb-1.5">
              Finnhub API Key (실시간 시세 조회용)
            </label>
            <input
              id="input-stock-key"
              type="password"
              placeholder="실시간 주가 조회에 활용할 Finnhub.io API Token 입력"
              value={stockApiKey}
              onChange={(e) => onUpdateStockKey(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Finnhub에서 발급한 무료 API Token을 입력하면 포트폴리오 탭의 현재가가 실시간 주가로 연동됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 2. 테마 설정 카드 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isDarkMode ? <Moon className="w-5 h-5 text-violet-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
          <div>
            <h5 className="text-sm font-bold text-slate-850 dark:text-slate-100">다크 모드 적용</h5>
            <p className="text-xs text-slate-400 mt-0.5">화면의 밝은/어두운 테마 모드를 토글합니다.</p>
          </div>
        </div>
        <button
          onClick={onToggleDarkMode}
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-indigo-650 transition-colors focus:outline-none"
        >
          <span
            className={`${
              isDarkMode ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
          />
        </button>
      </div>

      {/* 3. CSV 백업 및 복원 카드 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <FileText className="w-5 h-5 text-indigo-500" />
          <h5 className="text-base font-bold text-slate-850 dark:text-slate-100">데이터 백업 및 CSV 복원</h5>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          {/* 내보내기 */}
          <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <h6 className="font-bold text-slate-800 dark:text-slate-200">매수 기록 CSV 파일로 백업</h6>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                작성하신 전체 매매 기록 데이터를 CSV 문서 파일 형식으로 추출하여 기기에 저장합니다.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center space-x-2 w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-xl font-semibold border border-slate-200 dark:border-slate-750 transition-colors mt-2"
            >
              <Download className="w-4 h-4" />
              <span>CSV 백업 내보내기</span>
            </button>
          </div>

          {/* 가져오기 */}
          <div className="p-5 border border-slate-100 dark:border-slate-800 rounded-xl space-y-4">
            <div className="space-y-1">
              <h6 className="font-bold text-slate-800 dark:text-slate-200">CSV 데이터 파일 복원</h6>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                기기에 백업된 CSV 파일로부터 거래 일지를 분석하여 로컬 스토리지에 복원합니다.
              </p>
            </div>

            {/* 가져오기 모드 선택 */}
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-650 dark:text-slate-300">기존 기록에 덧붙이기 (Append)</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="import-mode"
                  checked={importMode === 'overwrite'}
                  onChange={() => setImportMode('overwrite')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-650 dark:text-slate-300">기존 기록 덮어쓰기 (Overwrite)</span>
              </label>
            </div>

            {/* 파일 선택 */}
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleImportCSV}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>CSV 파일 업로드</span>
              </button>
            </div>
          </div>
        </div>

        {/* 업로드 상태 표시 */}
        {importStatus && (
          <div className={`p-4 rounded-xl border flex items-start space-x-2 text-xs font-semibold ${
            importStatus.success
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 text-emerald-650 dark:text-emerald-450'
              : 'bg-red-50 dark:bg-red-950/20 border-red-200 text-red-650 dark:text-red-400'
          }`}>
            {importStatus.success ? (
              <CheckCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};
