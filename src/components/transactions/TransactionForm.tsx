'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDraggableSheet } from '@/lib/use-draggable-sheet';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AmountInput } from '@/components/shared/AmountInput';
import { useAppStore } from '@/store/app-store';
import { Transaction, TransactionSource, TransactionCategory, TransactionType } from '@/lib/types';
import { TrendingUp, TrendingDown, ArrowRight, Loader2, EyeOff, Camera, Images, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatVND } from '@/lib/format';
import { CategoryIcon, AppIcon } from '@/lib/icons';
import { isReportableTransaction } from '@/lib/transaction-reporting';
import { resizeImageToBase64 } from '@/lib/client-image';
import { supabase } from '@/lib/supabase';
import { ReceiptScanReviewSheet, DraftTransaction } from '@/components/transactions/ReceiptScanReviewSheet';
import type { ReceiptScanResult } from '@/lib/receipt-scan';

// Quá trình quét thực tế có thể mất đến ~1 phút (AI xử lý ảnh phức tạp) — đổi
// thông báo theo thời gian chờ để người dùng thấy app vẫn đang xử lý, không bị
// đứng. Chỉ mô tả tiến trình theo góc nhìn người dùng (đọc ảnh/giao dịch của họ),
// không lộ chi tiết kỹ thuật bên trong (model AI, retry, fallback...).
const SCAN_STAGE_MESSAGES = [
  'Đang đọc ảnh...',
  'Đang nhận diện thông tin giao dịch...',
  'Ảnh có thể chứa nhiều giao dịch, đang trích xuất từng dòng...',
  'Sắp xong, đang tổng hợp kết quả...',
] as const;
const SCAN_STAGE_INTERVAL_MS = 7000;

function AiBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full normal-case tracking-normal"
      style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
    >
      <Sparkles size={9} /> AI gợi ý
    </span>
  );
}

interface TransactionFormProps {
  open: boolean;
  type: TransactionType;
  editingTx?: Transaction | null;
  onClose: () => void;
  /** Khi set: form khởi động với dữ liệu gợi ý từ AI (chưa lưu DB) — dùng khi sửa 1 giao dịch trong màn review quét nhiều giao dịch. */
  draftInitial?: Omit<Transaction, 'id' | 'createdAt'> | null;
  /** true nếu draftInitial là dòng trống mới tạo (bấm "+"), không phải dòng AI gợi ý sẵn — chỉ ảnh hưởng chữ tiêu đề "Thêm" vs "Sửa". */
  isNewEntry?: boolean;
  /** Khi set: sau khi lưu THẬT vào DB (như flow bình thường), gọi callback này để báo cho màn review biết dòng này đã xong, không cần chờ bấm "Xác nhận" nữa. */
  onSaveDraft?: () => void;
}

function SelectGroup<T extends string>({
  options,
  value,
  onChange,
  accent = 'primary',
  disabled = false,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  accent?: 'primary' | 'orange';
  disabled?: boolean;
}) {
  const selectedBorder = accent === 'orange' ? 'var(--orange-muted)' : 'var(--primary-muted)';
  const selectedBg    = accent === 'orange' ? 'var(--orange-soft)'  : 'var(--primary-soft)';
  const selectedColor = accent === 'orange' ? 'var(--orange)'       : 'var(--foreground)';

  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-45',
          )}
          style={{
            border: value === o.value ? `1px solid ${selectedBorder}` : '1px solid var(--border)',
            background: value === o.value ? selectedBg : 'transparent',
            color: value === o.value ? selectedColor : 'var(--muted-foreground)',
          }}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

import { UserSearchPicker, PickedParticipant } from '@/components/shared/UserSearchPicker';
import { Users } from 'lucide-react';

export function TransactionForm({ open, type, editingTx, onClose, draftInitial, isNewEntry, onSaveDraft }: TransactionFormProps) {
  const { addTransaction, updateTransaction, createSharedExpense, transactions, customSources, customCategories, currentProfileId } = useAppStore();
  const isDraftMode = !!onSaveDraft;

  // customSources/customCategories đã chứa cả defaults (bank/cash/momo, saving/...)
  // được seed trong fetchProfileData — không prepend BUILT_IN nữa, sẽ duplicate.
  const SOURCES = customSources.map(s => ({
    value: s.id,
    label: s.label,
    icon: <AppIcon name={s.icon} size={15} />,
  }));

  // 'none' (Chưa phân loại) không còn cho chọn mới — thay bằng "Không tính vào báo cáo".
  // Giao dịch cũ đã gắn 'none' vẫn giữ nguyên, chỉ ẩn khỏi danh sách lựa chọn.
  const CATEGORIES = customCategories
    .filter(c => c.id !== 'none')
    .map(c => ({
      value: c.id,
      label: c.label,
      icon: <CategoryIcon name={c.icon} size={14} />,
    }));

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(0);
  const [source, setSource] = useState<TransactionSource>('bank');
  const [category, setCategory] = useState<TransactionCategory>('saving');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [excludedFromReports, setExcludedFromReports] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Split cost (only for expense)
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitParticipant, setSplitParticipant] = useState<PickedParticipant | null>(null);
  const [splitAmount, setSplitAmount] = useState<number>(0);
  const [splitLockHint, setSplitLockHint] = useState(false);
  const isSplitLocked = amount <= 0;
  const [splitDueDate, setSplitDueDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanStageText, setScanStageText] = useState<string>(SCAN_STAGE_MESSAGES[0]);
  const [aiFields, setAiFields] = useState<Set<string>>(new Set());
  const [multiScanItems, setMultiScanItems] = useState<DraftTransaction[] | null>(null);
  const [scanBatchId, setScanBatchId] = useState(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const isIncome = type === 'income';

  const clearAiField = (field: string) => {
    setAiFields(prev => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };

  const handleCameraClick = () => {
    if (scanning) return;
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    if (scanning) return;
    galleryInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại cùng 1 file lần sau
    if (!file || !currentProfileId) return;
    setScanning(true);
    setScanStageText(SCAN_STAGE_MESSAGES[0]);
    const stageTimers = SCAN_STAGE_MESSAGES.slice(1).map((msg, i) =>
      setTimeout(() => setScanStageText(msg), (i + 1) * SCAN_STAGE_INTERVAL_MS)
    );
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Cần đăng nhập để dùng tính năng này');
        return;
      }
      const { base64, mimeType } = await resizeImageToBase64(file);
      const res = await fetch('/api/receipts/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          profileId: currentProfileId,
          type,
          today: new Date().toISOString().slice(0, 10),
          categories: customCategories.map(c => ({ id: c.id, label: c.label })),
          sources: customSources.map(s => ({ id: s.id, label: s.label })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Không đọc được ảnh');
      }
      const body = await res.json();
      const items: ReceiptScanResult[] = Array.isArray(body.transactions) ? body.transactions : [];

      if (items.length === 0) {
        toast.error('Không nhận diện được thông tin từ ảnh này, vui lòng nhập tay');
        return;
      }

      if (items.length > 1) {
        // Ảnh có nhiều giao dịch (vd lịch sử ngân hàng) — chuyển qua màn review
        // để chọn/sửa từng dòng rồi tạo hàng loạt, thay vì điền vào form hiện tại.
        const defaultSourceId = customSources.find(s => s.id === 'bank')?.id ?? customSources[0]?.id ?? 'bank';
        const defaultCategoryId = customCategories.find(c => c.id !== 'none')?.id ?? 'saving';
        setMultiScanItems(items.map((item): DraftTransaction => ({
          type: item.type,
          title: item.title || (item.type === 'income' ? 'Thu nhập' : 'Chi tiêu'),
          amount: item.amount,
          source: item.sourceId ?? defaultSourceId,
          category: item.categoryId ?? defaultCategoryId,
          note: item.note,
          date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
        })));
        setScanBatchId(id => id + 1);
        toast.success(`Đã nhận diện ${items.length} giao dịch, kiểm tra lại trước khi lưu`);
        onClose();
        return;
      }

      const result = items[0];
      const filled = new Set<string>(result.fieldsFilledByAi ?? []);

      if (filled.has('title')) setTitle(result.title);
      if (filled.has('amount') && result.amount > 0) setAmount(result.amount);
      if (filled.has('date')) setDate(result.date);
      if (filled.has('note')) setNote(result.note);
      if (filled.has('category') && result.categoryId) { setCategory(result.categoryId); } else { filled.delete('category'); }
      if (filled.has('source') && result.sourceId) { setSource(result.sourceId); } else { filled.delete('source'); }
      setAiFields(filled);

      // Reset lỗi validate cũ, chỉ giữ lại lỗi cho field thực sự còn thiếu sau khi scan
      const effTitle = filled.has('title') ? result.title : title;
      const effAmount = (filled.has('amount') && result.amount > 0) ? result.amount : amount;
      const newErrors: Record<string, string> = {};
      if (!effTitle.trim()) newErrors.title = 'Vui lòng nhập nội dung';
      if (effAmount <= 0) newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
      setErrors(newErrors);

      if (result.type && result.type !== type) {
        toast(`Ảnh này có vẻ là khoản ${result.type === 'income' ? 'thu' : 'chi'}, bạn đang nhập khoản ${isIncome ? 'thu' : 'chi'} — kiểm tra lại trước khi lưu nhé.`);
      } else if (filled.size === 0) {
        toast.error('Không nhận diện được thông tin từ ảnh này, vui lòng nhập tay');
      } else {
        toast.success('Đã điền thông tin từ ảnh, kiểm tra lại trước khi lưu');
      }
    } catch (err) {
      toast.error((err as Error).message || 'Không quét được ảnh này');
    } finally {
      stageTimers.forEach(clearTimeout);
      setScanning(false);
    }
  };

  useEffect(() => {
    if (open) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const seed = editingTx ?? draftInitial;
      if (seed) {
        setTitle(seed.title);
        setAmount(seed.amount);
        setSource(seed.source);
        setCategory(seed.category);
        setNote(seed.note);
        setDate(new Date(seed.date).toISOString().slice(0, 10));
        setExcludedFromReports(seed.excludedFromReports ?? false);
      } else {
        setTitle('');
        setAmount(0);
        // Fallback nếu user đã xoá default 'bank'/'none' — pick first available
        setSource((customSources.find(s => s.id === 'bank')?.id ?? customSources[0]?.id ?? 'bank') as TransactionSource);
        setCategory((CATEGORIES[0]?.value ?? 'saving') as TransactionCategory);
        setNote('');
        setDate(todayStr);
        setExcludedFromReports(false);
      }
      setSplitEnabled(false);
      setSplitParticipant(null);
      setSplitAmount(0);
      setSplitDueDate('');
      setErrors({});
      setIsSubmitting(false);
      setAiFields(new Set());
      setScanning(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingTx, draftInitial]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Vui lòng nhập nội dung';
    if (title.trim().length > 100) e.title = 'Tối đa 100 ký tự';
    if (amount <= 0) e.amount = 'Vui lòng nhập số tiền hợp lệ';
    if (amount > 999_999_999_999) e.amount = 'Số tiền vượt quá giới hạn';
    if (note.length > 500) e.note = 'Ghi chú tối đa 500 ký tự';
    if (splitEnabled) {
      if (splitAmount > 0 && !splitParticipant) e.split = 'Chọn người cùng chia';
      if (splitAmount < 0) e.splitAmount = 'Nhập số tiền hợp lệ';
      if (splitAmount > amount) e.splitAmount = 'Không thể lớn hơn tổng chi tiêu';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleToggleExcludedFromReports = () => {
    const next = !excludedFromReports;
    setExcludedFromReports(next);
    if (next) {
      setSplitEnabled(false);
      setSplitParticipant(null);
      setSplitAmount(0);
      setSplitDueDate('');
    }
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    if (!validate()) return;
    const txData = {
      type,
      title: title.trim(),
      amount,
      source,
      category,
      note: note.trim(),
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      ...((excludedFromReports || editingTx?.excludedFromReports)
        ? { excludedFromReports }
        : {}),
    };

    setIsSubmitting(true);
    try {
      let sourceTransactionId: string;
      if (editingTx) {
        await updateTransaction(editingTx.id, txData);
        sourceTransactionId = editingTx.id;
      } else {
        sourceTransactionId = (await addTransaction(txData)).id;
      }

      // Nếu bật chia chi phí (khi tạo mới hoặc khi sửa lại): tạo SharedExpense liên kết
      if (splitEnabled && splitParticipant && splitAmount > 0) {
        await createSharedExpense({
          sourceTransactionId,
          totalExpense: amount,
          splitAmount,
          participantType: splitParticipant.type,
          participantUserId: splitParticipant.userId,
          participantProfileId: splitParticipant.profileId,
          participantName: splitParticipant.name,
          participantEmail: splitParticipant.email,
          direction: 'forward',
          note: title.trim() || note.trim(),
          category,
          dueDate: splitDueDate ? new Date(splitDueDate).toISOString() : null,
        });
        toast.success(splitParticipant.type === 'linked'
          ? (editingTx ? 'Đã cập nhật, đã gửi yêu cầu chi chung' : 'Đã lưu chi tiêu, đã gửi yêu cầu chi chung')
          : (editingTx ? 'Đã cập nhật kèm khoản chi chung' : 'Đã lưu chi tiêu kèm khoản chi chung'));
      } else if (editingTx) {
        toast.success('Đã cập nhật giao dịch');
      } else {
        toast.success(type === 'income' ? 'Đã lưu thu nhập' : 'Đã lưu chi tiêu');
      }
      onSaveDraft?.();
      onClose();
    } catch (err) {
      toast.error(`Lỗi: ${(err as Error).message ?? 'Không thể lưu giao dịch'}`);
      setIsSubmitting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, title, amount, source, category, note, date, editingTx, onClose, splitEnabled, splitParticipant, splitAmount, splitDueDate, isSubmitting, isIncome, excludedFromReports, onSaveDraft]);

  // Enter = submit (trừ khi đang gõ trong textarea)
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'TEXTAREA') return; // Enter trong textarea = xuống dòng bình thường
      e.preventDefault();
      handleSubmitRef.current();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const titleStr = (editingTx || (draftInitial && !isNewEntry))
    ? (isIncome ? 'Sửa thu nhập' : 'Sửa chi tiêu')
    : (isIncome ? 'Thêm thu nhập' : 'Thêm chi tiêu');
  const exclusionColor = isIncome ? 'var(--primary)' : 'var(--orange)';
  const exclusionSoft = isIncome ? 'var(--primary-soft)' : 'var(--orange-soft)';
  const exclusionMuted = isIncome ? 'var(--primary-muted)' : 'var(--orange-muted)';

  // Source balance preview
  const getSourcePreview = () => {
    if (amount <= 0) return null;
    const base = transactions
      .filter(t => isReportableTransaction(t) && t.source === source && (!editingTx || t.id !== editingTx.id))
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
    const next = excludedFromReports ? base : (isIncome ? base + amount : base - amount);
    return { current: Math.max(0, base), next };
  };
  const sourcePreview = getSourcePreview();

  // Drag-to-expand sheet height (mặc định: full vì form có nhiều field)
  const { expanded, sheetStyle, handleProps } = useDraggableSheet('tx-form-expanded', true);

  return (
    <>
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
       
        side="bottom"
        className="rounded-t-2xl gap-0 flex flex-col"
        style={{ padding: 0, background: 'var(--background)', ...sheetStyle }}
      >
        {/* Fixed header */}
        <div className="shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          {/* Drag handle */}
          <div
            {...handleProps}
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
            role="button"
            aria-label={expanded ? 'Thu nhỏ' : 'Mở rộng'}
          >
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
          </div>
          <div className="px-5 pb-3">
            <SheetHeader className="p-0">
              <SheetTitle className="text-base font-semibold text-left flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                {isIncome
                  ? <TrendingUp size={18} style={{ color: 'var(--income)' }} />
                  : <TrendingDown size={18} style={{ color: 'var(--expense)' }} />
                }
                {titleStr}
              </SheetTitle>
            </SheetHeader>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 overflow-y-auto px-5 py-4"
          style={!isIncome ? { '--ring': 'hsl(24, 90%, 58%)', '--ring-opacity': '0.4' } as React.CSSProperties : undefined}
        >
          <div className="flex flex-col gap-5">
            {scanning && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
              >
                <Loader2 size={14} className="animate-spin" />
                {scanStageText}
              </div>
            )}
            {/* Title */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium tracking-wide uppercase flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Nội dung * {aiFields.has('title') && <AiBadge />}
              </Label>
              <Input
                id="tx-title"
                value={title}
                onChange={e => { setTitle(e.target.value); clearAiField('title'); }}
                placeholder={isIncome ? 'VD: Lương tháng 5...' : 'VD: Cà phê Highlands...'}
                maxLength={100}
                className={errors.title ? 'border-[var(--destructive)]' : ''}
              />
              {errors.title && (
                <p className="text-sm" style={{ color: 'var(--destructive)' }}>{errors.title}</p>
              )}
            </div>

            {/* Amount */}
            <AmountInput
              value={amount}
              onChange={v => { setAmount(v); clearAiField('amount'); }}
              type={type}
              error={errors.amount}
              label={<span className="flex items-center gap-1.5">Số tiền * {aiFields.has('amount') && <AiBadge />}</span>}
            />

            {/* Date */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="tx-date" className="text-sm font-medium tracking-wide uppercase flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Ngày {aiFields.has('date') && <AiBadge />}
              </Label>
              <Input
                id="tx-date"
                type="date"
                value={date}
                onChange={e => { setDate(e.target.value); clearAiField('date'); }}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>

            {/* Source */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium tracking-wide uppercase flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Nguồn tiền * {aiFields.has('source') && <AiBadge />}
              </Label>
              <SelectGroup options={SOURCES} value={source} onChange={v => { setSource(v); clearAiField('source'); }} accent={isIncome ? 'primary' : 'orange'} />
              {sourcePreview && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                >
                  <span>{SOURCES.find(s => s.value === source)?.label ?? source}</span>
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{formatVND(sourcePreview.current)}</span>
                  <ArrowRight size={12} />
                  <span className="font-semibold" style={{ color: sourcePreview.next >= 0 ? 'var(--foreground)' : 'var(--down)' }}>
                    {formatVND(Math.abs(sourcePreview.next))}{sourcePreview.next < 0 ? ' (âm)' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Category - expense only */}
            {!isIncome && (
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium tracking-wide uppercase flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  Danh mục {aiFields.has('category') && <AiBadge />}
                </Label>
                <SelectGroup
                  options={CATEGORIES}
                  value={category}
                  onChange={v => { setCategory(v); clearAiField('category'); }}
                  accent="orange"
                  disabled={excludedFromReports}
                />
              </div>
            )}

            <div
              className="flex flex-col gap-2 p-3 rounded-xl"
              style={{
                background: excludedFromReports ? exclusionSoft : 'var(--muted)',
                border: `1px solid ${excludedFromReports ? exclusionMuted : 'transparent'}`,
              }}
            >
              <label className="flex items-center justify-between gap-3 cursor-pointer" onClick={handleToggleExcludedFromReports}>
                <div className="flex items-start gap-2">
                  <EyeOff
                    size={15}
                    className="mt-0.5 shrink-0"
                    style={{ color: excludedFromReports ? exclusionColor : 'var(--muted-foreground)' }}
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      Không tính vào báo cáo
                    </span>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                      Vẫn lưu trong lịch sử, nhưng không tính vào tổng quan, biểu đồ, lịch và số dư nguồn tiền.
                    </p>
                  </div>
                </div>
                <span
                  role="switch"
                  aria-checked={excludedFromReports}
                  className="relative inline-flex shrink-0 rounded-full transition-colors"
                  style={{
                    width: 36,
                    height: 20,
                    background: excludedFromReports ? exclusionColor : 'var(--border)',
                  }}
                >
                  <span
                    className="inline-block rounded-full bg-white shadow transition-transform"
                    style={{
                      width: 16,
                      height: 16,
                      marginTop: 2,
                      marginLeft: 2,
                      transform: excludedFromReports ? 'translateX(16px)' : 'translateX(0)',
                    }}
                  />
                </span>
              </label>
            </div>

            {/* Note */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium tracking-wide uppercase flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Ghi chú (tuỳ chọn) {aiFields.has('note') && <AiBadge />}
              </Label>
              <Textarea
                id="tx-note"
                value={note}
                onChange={e => { setNote(e.target.value); clearAiField('note'); }}
                placeholder="Thêm ghi chú..."
                maxLength={500}
                rows={2}
                className={errors.note ? 'border-[var(--destructive)]' : ''}
              />
              {errors.note && (
                <p className="text-sm" style={{ color: 'var(--destructive)' }}>{errors.note}</p>
              )}
            </div>

            {/* Split cost — only for expense (new or existing) */}
            {!isIncome && !excludedFromReports && (
              <div className="flex flex-col gap-3 p-3 rounded-xl" style={{ background: 'var(--muted)' }}>
                <label
                  className="flex items-center justify-between gap-3"
                  style={{ cursor: isSplitLocked ? 'not-allowed' : 'pointer' }}
                  onClick={() => {
                    if (isSplitLocked) {
                      setSplitLockHint(true);
                      return;
                    }
                    setSplitEnabled(v => !v);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Users size={15} style={{ color: 'var(--foreground)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                      Chia chi phí với người khác
                    </span>
                  </div>
                  <span
                    role="switch"
                    aria-checked={splitEnabled}
                    aria-disabled={isSplitLocked}
                    className="relative inline-flex shrink-0 rounded-full transition-colors"
                    style={{
                      width: 36, height: 20,
                      background: splitEnabled ? 'var(--primary)' : 'var(--border)',
                      opacity: isSplitLocked ? 0.4 : 1,
                    }}
                  >
                    <span
                      className="inline-block rounded-full bg-white shadow transition-transform"
                      style={{ width: 16, height: 16, marginTop: 2, marginLeft: 2, transform: splitEnabled ? 'translateX(16px)' : 'translateX(0)' }}
                    />
                  </span>
                </label>

                {isSplitLocked && splitLockHint && (
                  <p className="text-sm" style={{ color: 'var(--destructive)' }}>
                    Vui lòng điền số tiền chi tiêu trước khi chia chi phí
                  </p>
                )}

                {splitEnabled && !isSplitLocked && (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                        Người cùng chia chi phí {splitAmount > 0 ? '*' : '(tuỳ chọn)'}
                      </Label>
                      <UserSearchPicker value={splitParticipant} onChange={setSplitParticipant} />
                      {errors.split && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{errors.split}</p>}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                        Phần họ phải trả *
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={splitAmount === 0 ? '' : new Intl.NumberFormat('vi-VN').format(splitAmount)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setSplitAmount(parseInt(raw || '0', 10));
                          }}
                          placeholder="0"
                          className={`pr-16 text-base font-semibold ${errors.splitAmount ? 'border-[var(--destructive)]' : ''}`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>VNĐ</span>
                      </div>
                      {/* Gợi ý chia */}
                      {amount > 0 && (() => {
                        const presets = [
                          { label: 'Chia đôi', value: Math.floor(amount / 2) },
                          { label: 'Họ trả hết', value: amount },
                        ];
                        return (
                          <div className="flex gap-2 flex-wrap">
                            {presets.map(p => {
                              const isActive = splitAmount === p.value;
                              return (
                                <button
                                  key={p.label}
                                  type="button"
                                  onClick={() => setSplitAmount(p.value)}
                                  className="text-[12px] px-2 py-1 rounded-md font-medium transition-colors"
                                  style={{
                                    background: isActive ? 'var(--primary-soft)' : 'var(--background)',
                                    color: isActive ? 'var(--primary)' : 'var(--foreground)',
                                    border: `1px solid ${isActive ? 'var(--primary-muted)' : 'var(--border)'}`,
                                  }}
                                >
                                  {p.label}: {p.value.toLocaleString('vi-VN')}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                      {errors.splitAmount && <p className="text-sm" style={{ color: 'var(--destructive)' }}>{errors.splitAmount}</p>}
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-medium tracking-wide uppercase" style={{ color: 'var(--muted-foreground)' }}>
                        Hạn trả (tuỳ chọn)
                      </Label>
                      <Input type="date" value={splitDueDate} onChange={e => setSplitDueDate(e.target.value)} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fixed footer */}
        <div className="shrink-0 px-5 pt-3 pb-8 flex items-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
          {!isDraftMode && (
            <>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={handleFileSelected}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileSelected}
              />
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={scanning || isSubmitting}
                  aria-label="Quét hoá đơn bằng AI"
                  className="shrink-0 h-12 w-12 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  {scanning ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start">
                  <DropdownMenuItem onClick={handleCameraClick}>
                    <Camera size={16} /> Chụp ảnh
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGalleryClick}>
                    <Images size={16} /> Chọn từ thư viện
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Button
            id="tx-submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 h-12 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: isIncome ? 'var(--primary)' : 'var(--orange)',
              color: isIncome ? 'var(--primary-foreground)' : 'var(--orange-foreground)',
            }}
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting
              ? 'ĐANG LƯU...'
              : editingTx
                ? (isIncome ? 'CẬP NHẬT THU NHẬP' : 'CẬP NHẬT CHI TIÊU')
                : (isIncome ? 'LƯU THU NHẬP' : 'LƯU CHI TIÊU')
            }
          </Button>
        </div>
      </SheetContent>
    </Sheet>

    {!isDraftMode && (
      <ReceiptScanReviewSheet
        key={scanBatchId}
        open={multiScanItems !== null}
        items={multiScanItems ?? []}
        defaultType={type}
        onClose={() => setMultiScanItems(null)}
      />
    )}
    </>
  );
}
