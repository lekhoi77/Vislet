import { GoogleGenAI, Type, ApiError } from '@google/genai';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Model chính dùng để quét hoá đơn/chuyển khoản — đổi qua biến môi trường
// GEMINI_MODEL nếu cần, không phải sửa code.
// Lưu ý: alias 'gemini-flash-latest' từng bị 503 "high demand" khi test
// (có thể do nó trỏ tới 1 endpoint đang quá tải), trong khi ghim đúng
// 'gemini-3.6-flash' (model Google khuyến nghị khi gemini-2.0/2.5-flash
// bị khai tử) chạy ổn định với structured output — dùng model cụ thể này
// làm mặc định thay vì alias.
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// Free tier của Gemini giới hạn request/ngày rất thấp cho từng model riêng
// biệt (ví dụ gemini-3.6-flash chỉ 20 request/ngày) — khi model chính hết
// quota (lỗi 429 RESOURCE_EXHAUSTED), tự động rớt xuống model dự phòng kế
// tiếp thay vì để tính năng ngưng hoạt động cả ngày. Vì mỗi model có quota
// riêng, tổng dung lượng dùng được trong ngày sẽ cộng dồn theo số model
// trong danh sách này. Đổi qua GEMINI_FALLBACK_MODELS (phân cách bởi dấu
// phẩy) nếu cần tuỳ chỉnh, để trống để tắt hẳn fallback.
// Lưu ý: đã verify trực tiếp bằng API key thật (09/2026) — KHÔNG dùng
// gemini-2.5-flash/gemini-2.5-flash-lite làm fallback dù models.list vẫn
// liệt kê chúng, vì gọi thực tế bị 404 "no longer available to new users"
// (Google đã khai tử cho project mới, dù project cũ có thể vẫn gọi được).
const FALLBACK_MODELS = (
  process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-3.7-flash,gemini-3.5-flash,gemini-3.5-flash-lite'
)
  .split(',')
  .map(m => m.trim())
  .filter(Boolean);

const MODELS = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter(m => m !== PRIMARY_MODEL)];

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY chưa được cấu hình');
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export interface ReceiptScanOption {
  id: string;
  label: string;
}

export interface ReceiptScanInput {
  imageBase64: string;
  mimeType: string;
  type: 'income' | 'expense';
  today: string; // YYYY-MM-DD
  categories: ReceiptScanOption[];
  sources: ReceiptScanOption[];
}

export type ReceiptScanField = 'title' | 'amount' | 'date' | 'note' | 'category' | 'source';

export interface ReceiptScanResult {
  type: 'income' | 'expense';
  amount: number;
  title: string;
  note: string;
  date: string; // YYYY-MM-DD
  categoryId: string | null;
  sourceId: string | null;
  fieldsFilledByAi: ReceiptScanField[];
}

// Giới hạn số giao dịch trích xuất được từ 1 ảnh (vd ảnh chụp cả trang lịch sử
// giao dịch ngân hàng) — tránh model trả về quá nhiều dòng linh tinh.
const MAX_TRANSACTIONS = 30;

const FIELD_ENUM: ReceiptScanField[] = ['title', 'amount', 'date', 'note', 'category', 'source'];

function buildPrompt(input: ReceiptScanInput): string {
  return `Bạn đang xem 1 ảnh chụp màn hình hoá đơn mua hàng, biên lai/thông báo chuyển khoản, hoặc DANH SÁCH LỊCH SỬ GIAO DỊCH (nhiều dòng) từ app ngân hàng/ví điện tử ở Việt Nam (ví dụ: VCB Digibank, MB, MoMo, ZaloPay...).

Nhiệm vụ: trích xuất TẤT CẢ giao dịch nhìn thấy được trong ảnh, mỗi giao dịch là 1 phần tử trong mảng kết quả. Nếu ảnh chỉ có 1 giao dịch (1 hoá đơn/1 biên lai), trả về mảng có đúng 1 phần tử. Nếu ảnh là danh sách nhiều dòng giao dịch, trả về đủ mỗi dòng 1 phần tử, đúng thứ tự xuất hiện trong ảnh.

QUY TẮC QUAN TRỌNG (áp dụng cho MỖI giao dịch):
- "amount" là SỐ TIỀN GIAO DỊCH CHÍNH của dòng đó — thường là con số lớn nhất, hiển thị nổi bật, kèm đơn vị VNĐ/₫. TUYỆT ĐỐI KHÔNG lấy: số tài khoản, mã giao dịch, số điện thoại, số dư còn lại, hay bất kỳ dãy số dài nào không đi kèm ý nghĩa "số tiền".
- "type" phải là "expense" nếu đây là khoản tiền người dùng CHI RA/chuyển đi/thanh toán, hoặc "income" nếu đây là khoản tiền người dùng NHẬN VÀO — đọc đúng theo dấu +/- hoặc màu sắc/nhãn trên từng dòng, KHÔNG suy ra từ ngữ cảnh. Người dùng hiện đang mở form nhập khoản "${input.type === 'income' ? 'thu nhập' : 'chi tiêu'}" — nếu ảnh có vẻ ngược lại, vẫn cứ trả đúng những gì bạn thấy, đừng cố ép cho khớp.
- "date" lấy đúng ngày giao dịch ghi trên ảnh (định dạng YYYY-MM-DD) cho từng dòng — các dòng khác nhau có thể có ngày khác nhau. Nếu ảnh không có ngày rõ ràng cho 1 dòng, dùng ngày hôm nay: ${input.today}.
- "title" là mô tả ngắn gọn giao dịch (ví dụ tên cửa hàng, hoặc "Chuyển khoản cho <tên người nhận>"), tối đa khoảng 60 ký tự.
- "note" là nội dung/diễn giải đầy đủ hơn nếu có (ví dụ nội dung chuyển khoản), có thể để rỗng nếu không có gì thêm ngoài title.
- "categoryId" PHẢI là 1 trong các id sau (chọn cái khớp nghĩa nhất), hoặc null nếu không chắc: ${input.categories.map(c => `${c.id} (${c.label})`).join(', ')}
- "sourceId" PHẢI là 1 trong các id sau (nguồn tiền/ví, chỉ chọn nếu ảnh có gợi ý rõ ràng, ví dụ tên ngân hàng khớp với 1 nguồn), hoặc null nếu không chắc: ${input.sources.map(s => `${s.id} (${s.label})`).join(', ')}
- "fieldsFilledByAi" liệt kê đúng những field bạn thực sự đọc được từ ảnh với độ tin cậy hợp lý (không liệt kê field bạn phải đoán mò hoặc để giá trị mặc định).

Nếu ảnh không phải hoá đơn/biên lai/chuyển khoản/lịch sử giao dịch (ảnh không liên quan), trả về mảng RỖNG.
Tối đa ${MAX_TRANSACTIONS} giao dịch — nếu ảnh có nhiều hơn, chỉ lấy ${MAX_TRANSACTIONS} dòng đầu tiên.`;
}

// categoryId/sourceId dùng enum động = đúng danh sách id của user, để AI không
// thể "bịa" ra 1 id không tồn tại — an toàn hơn nhiều so với chỉ validate sau.
function buildResponseSchema(input: ReceiptScanInput) {
  const categoryIds = input.categories.map(c => c.id);
  const sourceIds = input.sources.map(s => s.id);
  const itemSchema = {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['income', 'expense'] },
      amount: { type: Type.NUMBER, description: 'Số tiền giao dịch chính, không kèm ký tự, chỉ số' },
      title: { type: Type.STRING },
      note: { type: Type.STRING },
      date: { type: Type.STRING, description: 'YYYY-MM-DD' },
      categoryId: categoryIds.length
        ? { type: Type.STRING, enum: categoryIds, nullable: true }
        : { type: Type.STRING, nullable: true },
      sourceId: sourceIds.length
        ? { type: Type.STRING, enum: sourceIds, nullable: true }
        : { type: Type.STRING, nullable: true },
      fieldsFilledByAi: {
        type: Type.ARRAY,
        items: { type: Type.STRING, enum: FIELD_ENUM },
      },
    },
    required: ['type', 'amount', 'title', 'note', 'date', 'fieldsFilledByAi'],
  };
  return { type: Type.ARRAY, items: itemSchema };
}

// Lỗi khiến model hiện tại KHÔNG dùng được nhưng model khác trong danh sách
// vẫn có thể ổn — nên rớt xuống fallback thay vì bỏ cuộc luôn:
// 429 = hết quota free tier riêng của model đó, 503 = model đang quá tải,
// 404 = model đã bị Google khai tử cho project này (đã gặp thực tế với
// gemini-2.5-flash dù model đó vẫn nằm trong models.list).
//
// Lỗi KHÔNG fallback (chắc chắn fail giống nhau ở mọi model, thử tiếp chỉ tốn
// thời gian): 400 = request sai (prompt/schema lỗi), 401/403 = API key sai/hết quyền.
// TẤT CẢ lỗi khác — kể cả lỗi network/timeout không có status (vd "fetch failed"
// khi 1 model bị treo/chặn) — đều fallback qua model kế tiếp, vì đã gặp thực tế
// 1 model bị timeout ~60s trong khi model kế tiếp trả lời bình thường trong vài giây.
const NON_FALLBACK_STATUSES = new Set([400, 401, 403]);

// Timeout riêng cho mỗi lần gọi — không dùng default (có thể treo rất lâu, quan
// sát thực tế ~60s) để model bị treo không kéo dài toàn bộ chuỗi fallback.
const REQUEST_TIMEOUT_MS = 20_000;

async function generateContentWithFallback(
  ai: GoogleGenAI,
  buildParams: (model: string) => Parameters<GoogleGenAI['models']['generateContent']>[0],
): Promise<{ response: Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>; model: string }> {
  let lastErr: unknown;
  for (const model of MODELS) {
    const params = buildParams(model);
    try {
      return { response: await ai.models.generateContent(params), model };
    } catch (err) {
      lastErr = err;
      const status = err instanceof ApiError ? err.status : undefined;
      if (status === 503) {
        try {
          await sleep(1500);
          return { response: await ai.models.generateContent(params), model };
        } catch (retryErr) {
          lastErr = retryErr;
        }
      }
      if (status !== undefined && NON_FALLBACK_STATUSES.has(status)) {
        throw err;
      }
    }
  }
  throw lastErr;
}

function normalizeResultItem(
  raw: Partial<ReceiptScanResult>,
  input: ReceiptScanInput,
  categoryIds: Set<string>,
  sourceIds: Set<string>,
  validFields: Set<ReceiptScanField>,
): ReceiptScanResult {
  return {
    type: raw.type === 'income' || raw.type === 'expense' ? raw.type : input.type,
    amount: typeof raw.amount === 'number' && raw.amount > 0 ? raw.amount : 0,
    title: typeof raw.title === 'string' ? raw.title.slice(0, 100) : '',
    note: typeof raw.note === 'string' ? raw.note.slice(0, 500) : '',
    date: typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : input.today,
    categoryId: raw.categoryId && categoryIds.has(raw.categoryId) ? raw.categoryId : null,
    sourceId: raw.sourceId && sourceIds.has(raw.sourceId) ? raw.sourceId : null,
    fieldsFilledByAi: Array.isArray(raw.fieldsFilledByAi)
      ? raw.fieldsFilledByAi.filter((f): f is ReceiptScanField => validFields.has(f as ReceiptScanField))
      : [],
  };
}

// Trả về 1 giao dịch/dòng nhận diện được trong ảnh — 1 phần tử nếu ảnh là
// hoá đơn/biên lai đơn, nhiều phần tử nếu ảnh là danh sách lịch sử giao dịch.
export async function scanReceipt(input: ReceiptScanInput): Promise<ReceiptScanResult[]> {
  const ai = getClient();
  const { response, model } = await generateContentWithFallback(ai, model => ({
    model,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: input.imageBase64, mimeType: input.mimeType } },
          { text: buildPrompt(input) },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: buildResponseSchema(input),
      httpOptions: { timeout: REQUEST_TIMEOUT_MS },
    },
  }));

  const usage = response.usageMetadata;
  if (usage) {
    console.log(
      `receipt-scan tokens: model=${model} prompt=${usage.promptTokenCount} output=${usage.candidatesTokenCount} total=${usage.totalTokenCount}`,
    );
  }

  const text = response.text;
  if (!text) throw new Error('AI không trả về kết quả');

  const rawList = JSON.parse(text) as Partial<ReceiptScanResult>[];
  if (!Array.isArray(rawList)) throw new Error('AI trả về sai định dạng');

  const categoryIds = new Set(input.categories.map(c => c.id));
  const sourceIds = new Set(input.sources.map(s => s.id));
  const validFields = new Set(FIELD_ENUM);

  return rawList
    .slice(0, MAX_TRANSACTIONS)
    .map(raw => normalizeResultItem(raw, input, categoryIds, sourceIds, validFields))
    .filter(item => item.amount > 0 || item.fieldsFilledByAi.length > 0);
}
