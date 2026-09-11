import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { scanReceipt, ReceiptScanOption } from '@/lib/receipt-scan';

export const runtime = 'nodejs';

// Rate limit nhẹ theo IP — đủ để chặn bot/script gọi lặp lại tự động.
// Lưu ý: reset khi server restart và không share giữa nhiều instance
// serverless, nhưng đủ dùng ở quy mô hiện tại (chưa có auth thật trong app).
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

interface ScanRequestBody {
  imageBase64?: string;
  mimeType?: string;
  profileId?: string;
  type?: 'income' | 'expense';
  today?: string;
  categories?: ReceiptScanOption[];
  sources?: ReceiptScanOption[];
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Quá nhiều yêu cầu, thử lại sau ít phút' }, { status: 429 });
  }

  let body: ScanRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload không hợp lệ' }, { status: 400 });
  }

  const { imageBase64, mimeType, profileId, type, today, categories, sources } = body;

  if (!imageBase64 || !mimeType || !profileId || (type !== 'income' && type !== 'expense') || !today) {
    return NextResponse.json({ error: 'Thiếu dữ liệu bắt buộc' }, { status: 400 });
  }

  // Chặn gọi trái phép từ bên ngoài app: profileId phải tồn tại thật trong DB
  // (Vislet chưa có auth thật, đây là rào chắn tối thiểu cho v1).
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .maybeSingle();
  if (profileError || !profile) {
    return NextResponse.json({ error: 'Không xác thực được' }, { status: 401 });
  }

  try {
    const result = await scanReceipt({
      imageBase64,
      mimeType,
      type,
      today,
      categories: Array.isArray(categories) ? categories : [],
      sources: Array.isArray(sources) ? sources : [],
    });
    return NextResponse.json(result);
  } catch (err) {
    // Không log nội dung ảnh hay dữ liệu trích xuất được — chỉ log message lỗi.
    console.error('receipt-scan failed:', (err as Error).message);
    return NextResponse.json({ error: 'Không đọc được ảnh, vui lòng thử lại' }, { status: 500 });
  }
}
