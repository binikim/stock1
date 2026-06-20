import React, { useState } from 'react';
import type { TransactionRecord, MarketType } from '../types';
import { Plus, Edit2, Trash2, Calendar, FileText, X, AlertTriangle } from 'lucide-react';

interface RecordManagerProps {
  records: TransactionRecord[];
  onAddRecord: (record: Omit<TransactionRecord, 'id'>) => void;
  onUpdateRecord: (id: string, record: Omit<TransactionRecord, 'id'>) => void;
  onDeleteRecord: (id: string) => void;
}

export const RecordManager: React.FC<RecordManagerProps> = ({
  records,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TransactionRecord | null>(null);

  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [market, setMarket] = useState<MarketType>('domestic');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [memo, setMemo] = useState('');
  const [validationError, setValidationError] = useState('');

  const uniqueTickers = Array.from(new Set(records.map((r) => r.ticker)));
  const [selectedTimelineTicker, setSelectedTimelineTicker] = useState<string>(uniqueTickers[0] || '');

  const openAddModal = () => {
    setEditingRecord(null);
    setTicker('');
    setName('');
    setMarket('domestic');
    setDate(new Date().toISOString().split('T')[0]);
    setPrice('');
    setQuantity('');
    setMemo('');
    setValidationError('');
    setIsModalOpen(true);
  };

  const openEditModal = (record: TransactionRecord) => {
    setEditingRecord(record);
    setTicker(record.ticker);
    setName(record.name);
    setMarket(record.market);
    setDate(record.date);
    setPrice(record.price.toString());
    setQuantity(record.quantity.toString());
    setMemo(record.memo || '');
    setValidationError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ticker.trim() || !name.trim() || !price || !quantity) {
      setValidationError('모든 필수 항목을 입력해 주세요.');
      return;
    }

    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseFloat(quantity);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setValidationError('매수가는 0보다 커야 합니다.');
      return;
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setValidationError('매수수량은 0보다 커야 합니다.');
      return;
    }

    const recordData = {
      ticker: ticker.trim().toUpperCase(),
      name: name.trim(),
      market,
      date,
      price: parsedPrice,
      quantity: parsedQuantity,
      memo: memo.trim() || undefined,
    };

    if (editingRecord) {
      onUpdateRecord(editingRecord.id, recordData);
    } else {
      onAddRecord(recordData);
      setSelectedTimelineTicker(recordData.ticker);
    }

    setIsModalOpen(false);
  };

  const formatCurrency = (val: number, mkt: MarketType) => {
    if (mkt === 'domestic') {
      return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(val);
    } else {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    }
  };

  const timelineRecords = records
    .filter((r) => r.ticker === selectedTimelineTicker)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 상단 액션 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">매수 거래 이력</h4>
          <p className="text-xs text-slate-400 dark:text-slate-550 mt-1">자신의 매매 일지를 기록하고 자유롭게 관리하세요.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center space-x-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-750 hover:to-violet-750 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>매수 기록 추가</span>
        </button>
      </div>

      {/* 1. 매수 기록 테이블 */}
      <div className="glass-panel rounded-3xl shadow-sm overflow-hidden border border-white/20 dark:border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/40 dark:bg-slate-850/20 text-slate-455 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                <th className="py-4.5 px-6">매수일</th>
                <th className="py-4.5 px-6">종목명 / 티커</th>
                <th className="py-4.5 px-6 text-center">시장</th>
                <th className="py-4.5 px-6 text-right">매수 단가</th>
                <th className="py-4.5 px-6 text-right">체결 수량</th>
                <th className="py-4.5 px-6 text-right">총 투자금액</th>
                <th className="py-4.5 px-6">메모</th>
                <th className="py-4.5 px-6 text-center">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm text-slate-700 dark:text-slate-300">
              {records.length > 0 ? (
                records
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/25 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {record.date}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-slate-105">{record.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-550 font-mono mt-0.5 tracking-wider">{record.ticker}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                          record.market === 'domestic'
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                        }`}>
                          {record.market === 'domestic' ? '국내' : '해외'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-medium text-slate-650 dark:text-slate-350">
                        {formatCurrency(record.price, record.market)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-medium text-slate-800 dark:text-slate-200">
                        {record.quantity.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(record.price * record.quantity, record.market)}
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 max-w-xs truncate text-xs">
                        {record.memo || <span className="text-slate-300 dark:text-slate-700">-</span>}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => openEditModal(record)}
                            className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-650 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
                            title="수정"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`${record.name} 매수 기록을 삭제하시겠습니까?`)) {
                                onDeleteRecord(record.id);
                              }
                            }}
                            className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-slate-600 dark:text-slate-300 rounded-xl transition-all"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 px-6 text-center text-slate-400 dark:text-slate-500">
                    거래 기록이 존재하지 않습니다. 우측 상단의 거래 기록 추가 버튼을 클릭해 매매 기록을 추가해 보세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. 종목별 매수 이력 타임라인 */}
      {uniqueTickers.length > 0 && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2.5">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-550 dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <span>보유 자산 거래 연대기</span>
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">대상 종목:</span>
              <select
                value={selectedTimelineTicker}
                onChange={(e) => setSelectedTimelineTicker(e.target.value)}
                className="px-3.5 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {uniqueTickers.map((t) => {
                  const itemRecords = records.filter((r) => r.ticker === t);
                  return (
                    <option key={t} value={t}>
                      {itemRecords[0]?.name} ({t})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* 타임라인 바디 */}
          <div className="relative pl-8 border-l border-slate-200 dark:border-white/10 space-y-6 ml-3 py-1">
            {timelineRecords.map((r) => (
              <div key={r.id} className="relative group">
                {/* 타임라인 도트 */}
                <div className="absolute -left-[37px] top-1.5 w-4 h-4 bg-indigo-600 rounded-full border-4 border-white dark:border-[#030712] shadow group-hover:scale-110 transition-transform" />
                
                {/* 타임라인 카드 */}
                <div className="bg-slate-50/40 dark:bg-slate-900/35 border border-slate-100 dark:border-white/5 rounded-2xl p-5 hover-premium">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3 mb-3">
                    <span className="font-mono text-xs font-extrabold text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-xl">
                      {r.date}
                    </span>
                    <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">
                      총 매매금액: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(r.price * r.quantity, r.market)}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">매수가</p>
                      <p className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200 mt-1">
                        {formatCurrency(r.price, r.market)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">매수 수량</p>
                      <p className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200 mt-1">
                        {r.quantity.toLocaleString()} 주
                      </p>
                    </div>
                  </div>
                  {r.memo && (
                    <div className="mt-4 pt-3.5 border-t border-slate-200/40 dark:border-white/5 flex items-start space-x-2 text-xs text-slate-500 dark:text-slate-400">
                      <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span className="leading-relaxed">{r.memo}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. 추가/수정 모달 (Glassmorphic) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white/90 dark:bg-slate-900/90 border border-white/20 dark:border-white/5 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all duration-300">
            {/* 모달 헤더 */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {editingRecord ? '매수 기록 편집' : '신규 매수 기록 작성'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 폼 */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {validationError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-rose-650 dark:text-rose-400 rounded-2xl flex items-start space-x-2.5 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* 시장 구분 */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  주식 시장 구분 *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMarket('domestic')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      market === 'domestic'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 text-xs'
                    }`}
                  >
                    국내 주식 시장 (KRW)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarket('foreign')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      market === 'foreign'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 text-xs'
                    }`}
                  >
                    해외 주식 시장 (USD)
                  </button>
                </div>
              </div>

              {/* 티커 & 종목명 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-ticker" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    티커 / 종목코드 *
                  </label>
                  <input
                    id="modal-ticker"
                    type="text"
                    placeholder={market === 'domestic' ? '예: 005930' : '예: AAPL'}
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="modal-name" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    종목 이름 *
                  </label>
                  <input
                    id="modal-name"
                    type="text"
                    placeholder="예: 삼성전자, 애플"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* 매수 단가 & 수량 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-price" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    매수 단가 * {market === 'domestic' ? '(₩)' : '($)'}
                  </label>
                  <input
                    id="modal-price"
                    type="number"
                    step="any"
                    min="0.0001"
                    placeholder="체결가 입력"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="modal-quantity" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    매수 체결 주수 *
                  </label>
                  <input
                    id="modal-quantity"
                    type="number"
                    step="any"
                    min="0.0001"
                    placeholder="수량 입력"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* 매수일 */}
              <div>
                <label htmlFor="modal-date" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  매매 체결 일자 *
                </label>
                <input
                  id="modal-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>

              {/* 메모 */}
              <div>
                <label htmlFor="modal-memo" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  거래 상세 메모
                </label>
                <textarea
                  id="modal-memo"
                  placeholder="예: 수수료 부담, 추매 진행, 목표 매도가 등 기재"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 h-20 resize-none text-slate-900 dark:text-white"
                />
              </div>

              {/* 하단 버튼 */}
              <div className="pt-4 flex items-center justify-end space-x-2.5 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-750 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-750 hover:from-indigo-700 hover:to-indigo-850 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/15"
                >
                  {editingRecord ? '기록 저장하기' : '신규 기록 보존'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
