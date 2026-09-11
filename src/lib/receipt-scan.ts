import { GoogleGenAI, Type } from '@google/genai';

// Model dùng để quét hoá đơn/chuyển khoản — đổi qua biến môi trường
// GEMINI_MODEL nếu cần, không phải sửa code. 'gemini-2.0-flash' là ví dụ
// chính thức trong tài liệu @google/genai tại thời điểm viết.
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

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

const FIELD_ENUM: ReceiptScanField[] = ['title', 'amount', 'date', 'note', 'category', 'source'];

function buildPrompt(input: ReceiptScanInput): string {
  return `Bạn đang xem 1 ảnh chụp màn hình hoá đơn mua hàng hoặc biên lai/thông báo chuyển khoản ngân hàng ở Việt Nam (ví dụ: VCB Digibank, MB, MoMo, ZaloPay...).

Nhiệm vụ: trích xuất thông tin để điền vào 1 giao dịch chi tiêu cá nhân.

QUY TẮC QUAN TRỌNG:
- "amount" là SỐ TIỀN GIAO DỊCH CHÍNH — thường là con số lớn nhất, hiển thị nổi bật, kèm đơn vị VNĐ/₫. TUYỆT ĐỐI KHÔNG lấy: số tài khoản, mã giao dịch, số điện thoại, số dư còn lại, hay bất kỳ dãy số dài nào không đi kèm ý nghĩa "số tiền".
- "type" phải là "expense" nếu đây là khoản tiền người dùng CHI RA/chuyển đi/thanh toán, hoặc "income" nếu đây là khoản tiền người dùng NHẬN VÀO. Người dùng hiện đang mở form nhập khoản "${input.type === 'income' ? 'thu nhập' : 'chi tiêu'}" — nếu ảnh có vẻ ngược lại với ngữ cảnh này, vẫn cứ trả đúng những gì bạn thấy trong ảnh, đừng cố ép cho khớp.
- "date" lấy đúng ngày giao dịch ghi trên ảnh (định dạng YYYY-MM-DD). Nếu ảnh không có ngày rõ ràng, dùng ngày hôm nay: ${input.today}.
- "title" là mô tả ngắn gọn giao dịch (ví dụ tên cửa hàng, hoặc "Chuyển khoản cho <tên người nhận>"), tối đa khoảng 60 ký tự.
- "note" là nội dung/diễn giải đầy đủ hơn nếu có (ví dụ nội dung chuyển khoản), có thể để rỗng nếu không có gì thêm ngoài title.
- "categoryId" PHẢI là 1 trong các id sau (chọn cái khớp nghĩa nhất), hoặc null nếu không chắc: ${input.categories.map(c => `${c.id} (${c.label})`).join(', ')}
- "sourceId" PHẢI là 1 trong các id sau (nguồn tiền/ví, chỉ chọn nếu ảnh có gợi ý rõ ràng, ví dụ tên ngân hàng khớp với 1 nguồn), hoặc null nếu không chắc: ${input.sources.map(s => `${s.id} (${s.label})`).join(', ')}
- "fieldsFilledByAi" liệt kê đúng những field bạn thực sự đọc được từ ảnh với độ tin cậy hợp lý (không liệt kê field bạn phải đoán mò hoặc để giá trị mặc định).

Nếu ảnh không phải hoá đơn/biên lai/chuyển khoản (ảnh không liên quan), vẫn trả về đúng schema nhưng để "fieldsFilledByAi" rỗng và amount = 0.`;
}

// categoryId/sourceId dùng enum động = đúng danh sách id của user, để AI không
// thể "bịa" ra 1 id không tồn tại — an toàn hơn nhiều so với chỉ validate sau.
function buildResponseSchema(input: ReceiptScanInput) {
  const categoryIds = input.categories.map(c => c.id);
  const sourceIds = input.sources.map(s => s.id);
  return {
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
}

export async function scanReceipt(input: ReceiptScanInput): Promise<ReceiptScanResult> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
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
    },
  });

  const text = response.text;
  if (!text) throw new Error('AI không trả về kết quả');

  const raw = JSON.parse(text) as Partial<ReceiptScanResult>;

  const categoryIds = new Set(input.categories.map(c => c.id));
  const sourceIds = new Set(input.sources.map(s => s.id));
  const validFields = new Set(FIELD_ENUM);

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
