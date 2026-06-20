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
    <div className="space-y-6 animate-fade-in">
      {/* 상단 액션 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-200">매수 거래 이력</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">자신의 매매 일지를 기록하고 자유롭게 관리하세요.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-550 to-pink-550 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all duration-300 btn-trendy"
        >
          <Plus className="w-4 h-4" />
          <span>매수 기록 추가</span>
        </button>
      </div>

      {/* 1. 매수 기록 테이블 */}
      <div className="trendy-card shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/10 text-slate-450 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800/55">
                <th className="py-4 px-6">매수일</th>
                <th className="py-4 px-6">종목명/티커</th>
                <th className="py-4 px-6 text-center">시장</th>
                <th className="py-4 px-6 text-right">매수가</th>
                <th className="py-4 px-6 text-right">수량</th>
                <th className="py-4 px-6 text-right">총 투자금</th>
                <th className="py-4 px-6">메모</th>
                <th className="py-4 px-6 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 text-xs md:text-sm text-slate-700 dark:text-slate-300">
              {records.length > 0 ? (
                records
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/20 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-slate-550 dark:text-slate-400">
                        {record.date}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100">{record.name}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 uppercase">{record.ticker}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black tracking-wide ${
                          record.market === 'domestic'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {record.market === 'domestic' ? '국내' : '해외'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-medium text-slate-500 dark:text-slate-400">
                        {formatCurrency(record.price, record.market)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {record.quantity.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-black text-slate-900 dark:text-white">
                        {formatCurrency(record.price * record.quantity, record.market)}
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 max-w-xs truncate text-xs">
                        {record.memo || <span className="text-slate-300 dark:text-slate-700">-</span>}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => openEditModal(record)}
                            className="p-2 hover:bg-indigo-500/10 hover:text-indigo-550 dark:hover:text-indigo-400 text-slate-400 rounded-lg transition-colors"
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
                            className="p-2 hover:bg-rose-500/10 hover:text-rose-500 text-slate-400 rounded-lg transition-colors"
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
                  <td colSpan={8} className="py-16 px-6 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                        <FileText className="w-5 h-5 text-slate-350" />
                      </div>
                      <span className="font-extrabold text-slate-550 dark:text-slate-450 text-xs">거래 기록이 존재하지 않습니다.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. 종목별 매수 이력 타임라인 */}
      {uniqueTickers.length > 0 && (
        <div className="trendy-card p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-450 dark:text-slate-400 flex items-center space-x-2.5">
              <Calendar className="w-4.5 h-4.5 text-indigo-550 dark:text-indigo-400" />
              <span>종목별 매매 타임라인</span>
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">종목 선택:</span>
              <select
                value={selectedTimelineTicker}
                onChange={(e) => setSelectedTimelineTicker(e.target.value)}
                className="px-3.5 py-2 text-xs font-bold bg-white dark:bg-[#121422] border border-slate-250 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
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
          <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-5 ml-3.5 py-1">
            {timelineRecords.map((r) => (
              <div key={r.id} className="relative group">
                {/* 타임라인 도트 */}
                <div className="absolute -left-[30px] top-2.5 w-3 h-3 bg-indigo-500 dark:bg-indigo-455 rounded-full border-2 border-white dark:border-[#070913] group-hover:scale-125 transition-transform duration-200 shadow-md shadow-indigo-500/20" />
                
                {/* 타임라인 카드 */}
                <div className="bg-slate-55/40 dark:bg-slate-900/10 border border-slate-200/40 dark:border-slate-800/30 rounded-2xl p-4.5 hover:border-indigo-500/10 dark:hover:border-indigo-400/20 transition-all duration-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/40 dark:border-slate-800/50 pb-2.5 mb-3">
                    <span className="font-mono text-[11px] font-black text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/15 px-3 py-1 rounded-md">
                      {r.date}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      총 매입액: <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200">{formatCurrency(r.price * r.quantity, r.market)}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 dark:text-slate-550 font-black uppercase tracking-wider text-[9px]">매수 단가</p>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 text-sm">
                        {formatCurrency(r.price, r.market)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 dark:text-slate-550 font-black uppercase tracking-wider text-[9px]">매수 수량</p>
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-1 text-sm">
                        {r.quantity.toLocaleString()} 주
                      </p>
                    </div>
                  </div>
                  {r.memo && (
                    <div className="mt-3.5 pt-3 border-t border-slate-200/40 dark:border-slate-800/50 flex items-start space-x-2 text-xs text-slate-500 dark:text-slate-400">
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

      {/* 3. 추가/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white/95 dark:bg-[#0f111d]/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/70 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all duration-300">
            {/* 모달 헤더 */}
            <div className="px-6 py-5 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-850 dark:text-slate-250">
                {editingRecord ? '매수 기록 편집' : '신규 매수 기록 작성'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* 모달 폼 */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {validationError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-start space-x-2 text-xs font-semibold">
                  <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* 시장 구분 */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  시장 구분 *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMarket('domestic')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                      market === 'domestic'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-black'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30 text-slate-500'
                    }`}
                  >
                    국내 주식 시장 (KRW)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarket('foreign')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                      market === 'foreign'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-black'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30 text-slate-500'
                    }`}
                  >
                    해외 주식 시장 (USD)
                  </button>
                </div>
              </div>

              {/* 티커 & 종목명 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-ticker" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                    티커 / 종목코드 *
                  </label>
                  <input
                    id="modal-ticker"
                    type="text"
                    placeholder={market === 'domestic' ? '예: 005930' : '예: AAPL'}
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="modal-name" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                    종목명 *
                  </label>
                  <input
                    id="modal-name"
                    type="text"
                    placeholder="예: 삼성전자, 애플"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-855 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* 매수 단가 & 수량 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-price" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                    매수 단가 * {market === 'domestic' ? '(₩)' : '($)'}
                  </label>
                  <input
                    id="modal-price"
                    type="number"
                    step="any"
                    min="0.0001"
                    placeholder="단가"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-850 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="modal-quantity" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                    수량 * (주)
                  </label>
                  <input
                    id="modal-quantity"
                    type="number"
                    step="any"
                    min="0.0001"
                    placeholder="수량"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-850 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* 매수일 */}
              <div>
                <label htmlFor="modal-date" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  매매 체결 일자 *
                </label>
                <input
                  id="modal-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-850 dark:text-white"
                  required
                />
              </div>

              {/* 메모 */}
              <div>
                <label htmlFor="modal-memo" className="block text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  메모
                </label>
                <textarea
                  id="modal-memo"
                  placeholder="추가 기록 사항 기입"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none text-slate-850 dark:text-white leading-relaxed"
                />
              </div>

              {/* 하단 버튼 */}
              <div className="pt-4 flex items-center justify-end space-x-2.5 border-t border-slate-200/50 dark:border-slate-800/55">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4.5 py-2.5 border border-slate-250 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl text-xs font-bold transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-xs font-black transition-all btn-trendy shadow-md shadow-indigo-500/10"
                >
                  {editingRecord ? '저장하기' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
