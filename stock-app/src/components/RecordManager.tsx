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
  // 모달 상태 및 편집 대상
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TransactionRecord | null>(null);

  // 폼 입력 상태
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [market, setMarket] = useState<MarketType>('domestic');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [memo, setMemo] = useState('');
  const [validationError, setValidationError] = useState('');

  // 타임라인용 선택 종목
  const uniqueTickers = Array.from(new Set(records.map((r) => r.ticker)));
  const [selectedTimelineTicker, setSelectedTimelineTicker] = useState<string>(uniqueTickers[0] || '');

  // 모달 열기 (추가 모드)
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

  // 모달 열기 (수정 모드)
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

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검증
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
      // 타임라인 선택을 방금 추가한 종목으로 동기화
      setSelectedTimelineTicker(recordData.ticker);
    }

    setIsModalOpen(false);
  };

  // 통화 포맷팅 helper
  const formatCurrency = (val: number, mkt: MarketType) => {
    if (mkt === 'domestic') {
      return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(val);
    } else {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    }
  };

  // 타임라인 정렬 데이터 계산
  const timelineRecords = records
    .filter((r) => r.ticker === selectedTimelineTicker)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // 최신순 정렬

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 기록 추가 버튼 및 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100">매수 기록 리스트</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">매매 일지를 작성하고 수정 또는 삭제하여 자산을 관리하세요.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          <span>매수 기록 추가</span>
        </button>
      </div>

      {/* 1. 매수 기록 테이블 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300">
              {records.length > 0 ? (
                records
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-600 dark:text-slate-400">
                        {record.date}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{record.name}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{record.ticker}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.market === 'domestic'
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                        }`}>
                          {record.market === 'domestic' ? '국내' : '해외'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-medium">
                        {formatCurrency(record.price, record.market)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-medium">
                        {record.quantity.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-semibold text-slate-850 dark:text-slate-100">
                        {formatCurrency(record.price * record.quantity, record.market)}
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {record.memo || <span className="text-slate-350 dark:text-slate-600">-</span>}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openEditModal(record)}
                            className="p-1.5 bg-slate-50 hover:bg-slate-150 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                            title="수정"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`${record.name} 매수 기록을 삭제하시겠습니까?`)) {
                                onDeleteRecord(record.id);
                              }
                            }}
                            className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/30 text-red-650 dark:text-red-400 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 px-6 text-center text-slate-400 dark:text-slate-500">
                    등록된 거래 기록이 없습니다. 우측 상단의 추가 버튼을 이용해 보세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. 종목별 매수 이력 타임라인 */}
      {uniqueTickers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <span>종목별 매수 이력 타임라인</span>
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">종목 선택:</span>
              <select
                value={selectedTimelineTicker}
                onChange={(e) => setSelectedTimelineTicker(e.target.value)}
                className="px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
          <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-6 ml-3 py-2">
            {timelineRecords.map((r) => (
              <div key={r.id} className="relative">
                {/* 타임라인 도트 */}
                <div className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 bg-indigo-600 rounded-full border-4 border-white dark:border-slate-900 shadow" />
                
                {/* 타임라인 카드 */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 rounded-xl p-4 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                      {r.date}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      총 매매금액: {formatCurrency(r.price * r.quantity, r.market)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-slate-450 dark:text-slate-500 text-xs">매수가</p>
                      <p className="font-mono font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                        {formatCurrency(r.price, r.market)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-450 dark:text-slate-500 text-xs">매수 수량</p>
                      <p className="font-mono font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                        {r.quantity.toLocaleString()} 주
                      </p>
                    </div>
                  </div>
                  {r.memo && (
                    <div className="mt-3 pt-3 border-t border-slate-200/40 dark:border-slate-700/30 flex items-start space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transform transition-all duration-300">
            {/* 모달 헤더 */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingRecord ? '매수 기록 수정' : '신규 매수 기록 추가'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모달 폼 */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {validationError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-650 dark:text-red-400 rounded-xl flex items-start space-x-2 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* 시장 구분 */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555 mb-2">
                  시장 구분
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMarket('domestic')}
                    className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                      market === 'domestic'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500'
                    }`}
                  >
                    국내 주식 (₩)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarket('foreign')}
                    className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                      market === 'foreign'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500'
                    }`}
                  >
                    해외 주식 ($)
                  </button>
                </div>
              </div>

              {/* 티커 & 종목명 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-ticker" className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555 mb-1.5">
                    티커 / 종목코드 *
                  </label>
                  <input
                    id="modal-ticker"
                    type="text"
                    placeholder={market === 'domestic' ? '예: 005930' : '예: AAPL'}
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="modal-name" className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555 mb-1.5">
                    종목명 *
                  </label>
                  <input
                    id="modal-name"
                    type="text"
                    placeholder="예: 삼성전자, 애플"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* 매수 단가 & 수량 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="modal-price" className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555 mb-1.5">
                    매수 단가 * {market === 'domestic' ? '(₩)' : '($)'}
                  </label>
                  <input
                    id="modal-price"
                    type="number"
                    step="any"
                    min="0.0001"
                    placeholder="0 이상 입력"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="modal-quantity" className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555 mb-1.5">
                    매수 수량 * (주)
                  </label>
                  <input
                    id="modal-quantity"
                    type="number"
                    step="any"
                    min="0.0001"
                    placeholder="0 이상 입력"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* 매수일 */}
              <div>
                <label htmlFor="modal-date" className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555 mb-1.5">
                  매수일 *
                </label>
                <input
                  id="modal-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              {/* 메모 */}
              <div>
                <label htmlFor="modal-memo" className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555 mb-1.5">
                  메모
                </label>
                <textarea
                  id="modal-memo"
                  placeholder="추가적인 메모 사항 (예: 거래 수수료, 매수 이유)"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full px-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-250 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 h-20 resize-none"
                />
              </div>

              {/* 모달 피터 버튼 */}
              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-sm font-semibold transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {editingRecord ? '저장하기' : '기록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
