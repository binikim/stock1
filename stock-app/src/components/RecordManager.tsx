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
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">매수 거래 이력</h4>
          <p className="text-xs text-zinc-400 dark:text-zinc-550 mt-1">자신의 매매 일지를 기록하고 자유롭게 관리하세요.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg text-xs font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>매수 기록 추가</span>
        </button>
      </div>

      {/* 1. 매수 기록 테이블 */}
      <div className="flat-panel rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/10 text-zinc-450 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider border-b border-zinc-250/60 dark:border-zinc-800">
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
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80 text-xs md:text-sm text-zinc-700 dark:text-zinc-300">
              {records.length > 0 ? (
                records
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => (
                    <tr key={record.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/25 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-zinc-550 dark:text-zinc-400">
                        {record.date}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{record.name}</div>
                        <div className="text-[10px] text-zinc-450 mt-0.5">{record.ticker}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-700">
                          {record.market === 'domestic' ? '국내' : '해외'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-medium text-zinc-550">
                        {formatCurrency(record.price, record.market)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-medium">
                        {record.quantity.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(record.price * record.quantity, record.market)}
                      </td>
                      <td className="py-4 px-6 text-zinc-500 dark:text-zinc-400 max-w-xs truncate text-xs">
                        {record.memo || <span className="text-zinc-300 dark:text-zinc-700">-</span>}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => openEditModal(record)}
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-150 rounded transition-colors"
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
                            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-red-500 rounded transition-colors"
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
                  <td colSpan={8} className="py-12 px-6 text-center text-zinc-400 dark:text-zinc-500">
                    거래 기록이 존재하지 않습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. 종목별 매수 이력 타임라인 */}
      {uniqueTickers.length > 0 && (
        <div className="flat-panel rounded-xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-450 dark:text-zinc-550 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-zinc-455" />
              <span>보유 자산 거래 연대기</span>
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold uppercase">대상 종목:</span>
              <select
                value={selectedTimelineTicker}
                onChange={(e) => setSelectedTimelineTicker(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-450 text-zinc-900 dark:text-white"
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
          <div className="relative pl-6 border-l border-zinc-200 dark:border-zinc-800 space-y-4 ml-2 py-1">
            {timelineRecords.map((r) => (
              <div key={r.id} className="relative">
                {/* 타임라인 도트 */}
                <div className="absolute -left-[29px] top-1.5 w-2.5 h-2.5 bg-zinc-900 dark:bg-zinc-100 rounded-full border-2 border-white dark:border-[#09090b] shadow-sm" />
                
                {/* 타임라인 카드 */}
                <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-150 dark:border-zinc-800 pb-2 mb-2">
                    <span className="font-mono text-xs font-bold text-zinc-650 dark:text-zinc-350 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                      {r.date}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      총 매매금액: <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{formatCurrency(r.price * r.quantity, r.market)}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">매수가</p>
                      <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                        {formatCurrency(r.price, r.market)}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">매수 수량</p>
                      <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                        {r.quantity.toLocaleString()} 주
                      </p>
                    </div>
                  </div>
                  {r.memo && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-150 dark:border-zinc-800 flex items-start space-x-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <FileText className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />
                      <span>{r.memo}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-lg shadow-xl overflow-hidden transform transition-all duration-200">
            {/* 모달 헤더 */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                {editingRecord ? '매수 기록 편집' : '신규 매수 기록 작성'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 모달 폼 */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {validationError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/40 text-red-650 dark:text-red-400 rounded-lg flex items-start space-x-2 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* 시장 구분 */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 mb-1.5">
                  시장 구분 *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMarket('domestic')}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      market === 'domestic'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-500'
                    }`}
                  >
                    국내 주식 시장 (KRW)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarket('foreign')}
                    className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                      market === 'foreign'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-500'
                    }`}
                  >
                    해외 주식 시장 (USD)
                  </button>
                </div>
              </div>

              {/* 티커 & 종목명 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-ticker" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 mb-1.5">
                    티커 / 종목코드 *
                  </label>
                  <input
                    id="modal-ticker"
                    type="text"
                    placeholder={market === 'domestic' ? '예: 005930' : '예: AAPL'}
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="modal-name" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 mb-1.5">
                    종목 이름 *
                  </label>
                  <input
                    id="modal-name"
                    type="text"
                    placeholder="예: 삼성전자, 애플"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 text-zinc-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* 매수 단가 & 수량 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-price" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 mb-1.5">
                    매수 단가 * {market === 'domestic' ? '(₩)' : '($)'}
                  </label>
                  <input
                    id="modal-price"
                    type="number"
                    step="any"
                    min="0.0001"
                    placeholder="체결가"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono text-zinc-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="modal-quantity" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 mb-1.5">
                    체결 주수 *
                  </label>
                  <input
                    id="modal-quantity"
                    type="number"
                    step="any"
                    min="0.0001"
                    placeholder="수량"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono text-zinc-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* 매수일 */}
              <div>
                <label htmlFor="modal-date" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 mb-1.5">
                  매매 체결 일자 *
                </label>
                <input
                  id="modal-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 font-mono text-zinc-900 dark:text-white"
                  required
                />
              </div>

              {/* 메모 */}
              <div>
                <label htmlFor="modal-memo" className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-550 mb-1.5">
                  상세 메모
                </label>
                <textarea
                  id="modal-memo"
                  placeholder="메모 사항 기재 (선택)"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-400 h-16 resize-none text-zinc-900 dark:text-white"
                />
              </div>

              {/* 하단 버튼 */}
              <div className="pt-3.5 flex items-center justify-end space-x-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 border border-zinc-250 dark:border-zinc-700 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg text-xs font-semibold transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg text-xs font-semibold transition-all"
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
