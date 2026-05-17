# VÍ.APP — Personal Finance Management Web App
## Tài liệu kỹ thuật & thiết kế chi tiết (Production-Ready Spec)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Mục tiêu
Xây dựng một ứng dụng quản lý tài chính cá nhân dạng web, tối ưu cho mobile (Mobile-First Responsive), cho phép người dùng theo dõi thu nhập, chi tiêu, mục tiêu tài chính, và quản lý nợ. Hỗ trợ nhiều người dùng (multi-profile) để chia sẻ/xem dashboard của nhau.

### 1.2 Tech Stack
- **Framework:** React (Vite hoặc Next.js)
- **UI Library:** shadcn/ui (sử dụng Radix UI primitives + Tailwind CSS)
- **Font:** Be Vietnam Pro (Google Fonts)
- **State Management:** Zustand hoặc React Context
- **Storage:** localStorage (MVP) → có thể migrate sang Supabase/Firebase sau
- **Animation:** Framer Motion (hoặc CSS transitions cho micro-interactions đơn giản)
- **Formatting:** Intl.NumberFormat('vi-VN') cho định dạng tiền VNĐ

### 1.3 Responsive Strategy
- **Mobile-first**: thiết kế cho viewport 375px trước, scale up
- **Breakpoints:**
  - `sm`: 375px — 479px (mobile)
  - `md`: 480px — 767px (large mobile / small tablet)
  - `lg`: 768px — 1023px (tablet)
  - `xl`: 1024px+ (desktop — max-width container 480px, centered)

---

## 2. DESIGN SYSTEM

### 2.1 Nguyên tắc thiết kế cốt lõi
1. **Light mode only** — nền sáng, clean, không dark mode
2. **Breathing spacing** — mọi thành phần phải có khoảng cách thở, không dính nhau
3. **Minimal color usage** — chủ yếu dùng neutral, chỉ dùng màu trạng thái khi CẦN THIẾT
4. **Consistent hierarchy** — mọi text phải nằm trong hệ thống phân cấp rõ ràng
5. **Skeleton & loading states** — bắt buộc cho mọi data-driven component
6. **Consistent transitions** — tất cả page transitions cùng một hướng, cùng timing

### 2.2 Color Palette

Hệ thống màu dựa trên shadcn/ui convention, custom theme xanh lá pastel.

```css
:root {
  /* ─── BRAND / PRIMARY (Pastel Green) ─── */
  --primary:           hsl(145, 45%, 42%);    /* #3D9A6E — primary actions, active states */
  --primary-foreground: hsl(0, 0%, 100%);     /* #FFFFFF — text trên primary */
  --primary-soft:      hsl(145, 40%, 95%);    /* #E8F5EE — subtle bg khi cần highlight nhẹ */
  --primary-muted:     hsl(145, 30%, 85%);    /* #C5E4D2 — border, divider có brand color */
  
  /* ─── BACKGROUND ─── */
  --background:        hsl(0, 0%, 100%);      /* #FFFFFF — nền chính */
  --background-subtle: hsl(150, 10%, 97.5%);  /* #F7FAF8 — nền page, nền section */
  
  /* ─── SURFACE (Cards, Panels) ─── */
  --card:              hsl(0, 0%, 100%);      /* #FFFFFF — card bg */
  --card-foreground:   hsl(220, 15%, 15%);    /* #212832 — text chính trên card */
  
  /* ─── NEUTRAL (Text & Borders — HỆ THỐNG CHÍNH) ─── */
  --foreground:        hsl(220, 15%, 12%);    /* #1D2330 — body text, giá trị quan trọng */
  --muted-foreground:  hsl(220, 8%, 46%);     /* #6B7280 — labels, placeholder, meta text */
  --muted:             hsl(220, 10%, 96%);    /* #F3F4F6 — muted backgrounds */
  --border:            hsl(220, 10%, 90%);    /* #E2E5EB — border mặc định */
  --border-subtle:     hsl(220, 10%, 94%);    /* #EDEFF3 — border rất nhẹ */
  --ring:              hsl(145, 45%, 42%);    /* focus ring = primary */
  
  /* ─── SEMANTIC (CHỈ dùng cho trạng thái cụ thể) ─── */
  --income:            hsl(145, 55%, 38%);    /* #2E8B57 — CHỈ cho số tiền thu nhập */
  --expense:           hsl(0, 65%, 55%);      /* #D94F4F — CHỉ cho số tiền chi tiêu */
  --destructive:       hsl(0, 65%, 55%);      /* = expense, dùng cho delete/danger */
  
  /* ─── SPACING SCALE (8px grid) ─── */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 48px;
  --space-10: 64px;
  
  /* ─── RADIUS ─── */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  
  /* ─── SHADOW ─── */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02);
}
```

#### QUY TẮC MÀU SẮC NGHIÊM NGẶT:
| Ngữ cảnh | Màu sử dụng | GHI CHÚ |
|-----------|-------------|---------|
| Body text, tiêu đề, giá trị | `--foreground` | Neutral dark |
| Labels, meta, ngày tháng | `--muted-foreground` | Gray |
| Placeholder | `--muted-foreground` (50% opacity) | — |
| Card background | `--card` | White |
| Page background | `--background-subtle` | Off-white nhẹ xanh |
| Primary button, active tab, focus ring | `--primary` | Green |
| Số tiền THU NHẬP (chỉ số tiền) | `--income` | Green đậm hơn primary |
| Số tiền CHI TIÊU (chỉ số tiền) | `--expense` | Red |
| Tất cả border | `--border` hoặc `--border-subtle` | **KHÔNG dùng màu khác** |
| Tags nguồn tiền | `--foreground` text + `--muted` bg | **KHÔNG dùng màu riêng cho mỗi tag** |
| Tags mục tiêu | `--foreground` text + `--muted` bg | **KHÔNG dùng màu riêng cho mỗi tag** |

**KHÔNG ĐƯỢC:**
- Dùng nhiều màu khác nhau cho tags (Ngân hàng xanh, MoMo tím, Tiền mặt xanh lá...)
- Dùng màu khác nhau cho mỗi mục tiêu (Tiết kiệm vàng, Du lịch xanh dương...)
- Dùng gradient
- Dùng accent color ngoài primary green

### 2.3 Typography System

Font: **Be Vietnam Pro** (Google Fonts) — tất cả weights: 300, 400, 500, 600, 700

```
Google Fonts import:
https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap
```

| Token | Size | Weight | Line Height | Letter Spacing | Color | Sử dụng cho |
|-------|------|--------|-------------|----------------|-------|-------------|
| `heading-xl` | 28px | 700 | 1.2 | -0.02em | `--foreground` | Số dư tổng, hero number |
| `heading-lg` | 22px | 700 | 1.25 | -0.015em | `--foreground` | Page title |
| `heading-md` | 18px | 600 | 1.3 | -0.01em | `--foreground` | Section title, card value lớn |
| `heading-sm` | 15px | 600 | 1.35 | -0.005em | `--foreground` | Card title, list item title |
| `body` | 14px | 400 | 1.5 | 0 | `--foreground` | Body text mặc định |
| `body-medium` | 14px | 500 | 1.5 | 0 | `--foreground` | Body text cần nhấn |
| `caption` | 13px | 400 | 1.4 | 0 | `--muted-foreground` | Notes, secondary info |
| `label` | 12px | 500 | 1.3 | 0.03em | `--muted-foreground` | Form labels, section labels |
| `overline` | 11px | 600 | 1.2 | 0.06em | `--muted-foreground` | Overline text, uppercase labels |
| `amount-lg` | 24px | 700 | 1.2 | -0.01em | context-dependent | Số tiền lớn (dùng tabular-nums) |
| `amount-md` | 16px | 600 | 1.3 | 0 | context-dependent | Số tiền vừa |
| `amount-sm` | 14px | 600 | 1.3 | 0 | context-dependent | Số tiền nhỏ |

**QUY TẮC:**
1. Số tiền LUÔN dùng `font-variant-numeric: tabular-nums` để các số thẳng hàng
2. Số tiền thu nhập: `color: var(--income)` — Số tiền chi tiêu: `color: var(--expense)`
3. Labels/captions LUÔN dùng `--muted-foreground`, KHÔNG BAO GIỜ dùng `--foreground`
4. Chỉ heading và body text chính dùng `--foreground`
5. **KHÔNG** dùng font-size ngoài hệ thống trên

### 2.4 Spacing Rules (Breathing Layout)

Hệ thống 8px grid. Tất cả spacing phải là bội số của 4px hoặc 8px.

| Ngữ cảnh | Spacing | Giá trị |
|-----------|---------|---------|
| Padding bên trong card | `--space-5` | 20px |
| Gap giữa các cards | `--space-4` | 16px |
| Gap giữa items trong list | `--space-3` | 12px |
| Section title → content bên dưới | `--space-4` | 16px |
| Giữa hai sections | `--space-7` | 32px |
| Page padding (horizontal) | `--space-5` | 20px |
| Page padding (top) | `--space-5` | 20px |
| Page padding (bottom) | `120px` | Dành chỗ cho FAB |
| Form group gap | `--space-5` | 20px |
| Tag buttons gap | `--space-2` | 8px |
| Inline text gap (icon + text) | `--space-2` | 8px |
| Card → card trong summary grid | `--space-3` | 12px |

**QUY TẮC BREATHING:**
1. **Không bao giờ** để hai card sát nhau mà không có gap ≥ 12px
2. **Section title** phải có khoảng cách phía trên ≥ 32px so với section trước
3. **Card content** phải có padding ≥ 16px mọi phía
4. **Bottom sheet / Modal** phải có padding-bottom ≥ 40px (safe area)
5. **Between related items** (ví dụ giao dịch trong list): 8-12px
6. **Between unrelated sections**: 24-32px

### 2.5 Component Library (dựa trên shadcn/ui)

Tất cả component sử dụng shadcn/ui, customize qua Tailwind theme. Danh sách components cần dùng:

| Component | Nguồn | Dùng cho |
|-----------|-------|---------|
| `Button` | shadcn/ui | CTA, submit, FAB |
| `Card` | shadcn/ui | Summary cards, transaction items, debt cards |
| `Input` | shadcn/ui | Form inputs |
| `Textarea` | shadcn/ui | Note fields |
| `Label` | shadcn/ui | Form labels |
| `Badge` | shadcn/ui | Tags nguồn tiền, tags mục tiêu |
| `Sheet` (Bottom Sheet) | shadcn/ui | Modal thêm giao dịch, thêm nợ |
| `Tabs` | shadcn/ui | Navigation chính (Tổng quan / Giao dịch / Mục tiêu / Nợ) |
| `Select` | shadcn/ui | Chọn tháng, chọn loại nợ |
| `ToggleGroup` | shadcn/ui | Chọn nguồn tiền, chọn mục tiêu |
| `Skeleton` | shadcn/ui | Loading states |
| `Separator` | shadcn/ui | Dividers |
| `Avatar` | shadcn/ui | Profile switcher |
| `DropdownMenu` | shadcn/ui | Profile dropdown |
| `Progress` | shadcn/ui | Goal progress bars |
| `Toast` | shadcn/ui (sonner) | Notifications |
| `AlertDialog` | shadcn/ui | Confirm dialogs (xoá, xử lý nợ) |
| `ScrollArea` | shadcn/ui | Scrollable lists |

### 2.6 Icon System
Sử dụng **Lucide React** (đi kèm shadcn/ui). Không dùng emoji cho UI elements.

| Ngữ cảnh | Icon | Lucide name |
|-----------|------|-------------|
| Thu nhập | ↓ mũi tên | `ArrowDownLeft` |
| Chi tiêu | ↑ mũi tên | `ArrowUpRight` |
| Ngân hàng | Tòa nhà | `Building2` |
| Tiền mặt | Ví | `Wallet` |
| MoMo | Smartphone | `Smartphone` |
| Tiết kiệm | Heo đất | `PiggyBank` |
| Du lịch | Máy bay | `Plane` |
| Sắp dùng | Đồng hồ | `Clock` |
| Nợ | Bắt tay | `Handshake` |
| Ghi chú | File text | `FileText` |
| Thêm | Cộng | `Plus` |
| Chỉnh sửa | Bút | `Pencil` |
| Xoá | Thùng rác | `Trash2` |
| Profile | User circle | `UserCircle` |
| Switch user | Mũi tên | `ChevronDown` |
| Lịch | Calendar | `Calendar` |
| Filter | Filter | `Filter` |

### 2.7 Animation & Transition Rules

```css
/* ─── TIMING ─── */
--duration-fast:   150ms;   /* hover, focus, micro-interactions */
--duration-normal: 250ms;   /* page transitions, card appear */
--duration-slow:   400ms;   /* bottom sheet, modal */

/* ─── EASING ─── */
--ease-default:    cubic-bezier(0.25, 0.1, 0.25, 1);     /* general transitions */
--ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);    /* bottom sheet enter */
--ease-out:        cubic-bezier(0, 0, 0.2, 1);            /* element exit */
```

| Interaction | Duration | Easing | Thuộc tính |
|-------------|----------|--------|-----------|
| Button hover/press | `--duration-fast` | `--ease-default` | `opacity`, `transform` |
| Tab switch | `--duration-normal` | `--ease-default` | `opacity` |
| Page content appear | `--duration-normal` | `--ease-default` | `opacity`, `translateY(8px → 0)` |
| Bottom sheet open | `--duration-slow` | `--ease-spring` | `translateY(100% → 0)` |
| Bottom sheet close | `--duration-normal` | `--ease-out` | `translateY(0 → 100%)` |
| Card skeleton → content | `--duration-normal` | `--ease-default` | `opacity` |
| Toast notification | `--duration-normal` | `--ease-spring` | `translateY`, `opacity` |
| Dropdown open | `--duration-fast` | `--ease-default` | `opacity`, `scale(0.95 → 1)` |

**QUY TẮC TRANSITION:**
1. **Page transitions luôn cùng hướng**: content fade-in + translateY(8px → 0), KHÔNG slide left/right
2. **Skeleton → Content**: skeleton giữ đúng vị trí, chỉ fade content vào. KHÔNG thay đổi kích thước
3. **Bottom sheet**: LUÔN từ dưới lên, overlay fade in đồng thời
4. **No layout shift**: khi content load, kích thước placeholder phải match content thật

### 2.8 Skeleton Loading States

Mọi component hiển thị data đều PHẢI có skeleton state:

```
SummarySkeleton:
┌─────────────┐ ┌─────────────┐
│ ████ label  │ │ ████ label  │
│ ██████████  │ │ ██████████  │
│ ████ sub    │ │ ████ sub    │
└─────────────┘ └─────────────┘
┌─────────────────────────────┐
│ ████ label                  │
│ ██████████████████          │
│ ████████ sub                │
└─────────────────────────────┘

TransactionSkeleton (3 items):
┌──────────────────────────────┐
│ [○]  ████████████   ██████  │
│      ████  ████             │
└──────────────────────────────┘
(repeat 3x)

GoalSkeleton:
┌──────────────────────────────┐
│ [○]  ████████   ██████████  │
│      ███████████████▓░░░░░  │
└──────────────────────────────┘
(repeat 3x)
```

**Skeleton rules:**
- Skeleton dùng `--muted` background với animation pulse (opacity 0.4 ↔ 1)
- Skeleton rectangle height phải match text line-height thực tế
- Skeleton width phải gần đúng content width trung bình
- Khi data sẵn sàng: skeleton fade-out → content fade-in (cross-fade, 250ms)
- **KHÔNG có layout shift** — skeleton layout phải identical với content layout

---

## 3. CHỨC NĂNG CHI TIẾT

### 3.1 Multi-Profile System (Switch User)

#### 3.1.1 Data Structure
```typescript
interface UserProfile {
  id: string;               // UUID
  name: string;             // Tên hiển thị
  avatarColor: string;      // Color cho avatar placeholder
  initial: string;          // 1-2 ký tự đầu tên
  createdAt: string;        // ISO timestamp
}
```

#### 3.1.2 Hành vi
- Khi mở app lần đầu → tạo profile mặc định, hỏi tên người dùng
- **Profile switcher** nằm ở top-right header
- Click → mở dropdown (shadcn DropdownMenu) hiện danh sách profiles
- Chọn profile khác → switch toàn bộ data sang profile đó
- Nút "Thêm người dùng" ở cuối dropdown
- Profile hiện tại có checkmark ✓
- **Data isolation**: mỗi profile có transactions, debts riêng biệt
- **Storage key**: `viapp_profiles`, `viapp_data_{profileId}`
- Giới hạn tối đa 5 profiles

#### 3.1.3 UI
- Header: `[Logo: ví.app]     [Avatar ○ Tên ▾]`
- Avatar: hình tròn 32px, background = avatarColor, text = initial, font-weight 600
- Dropdown: max-height 300px, scroll nếu cần, border-radius: 12px, shadow-lg

### 3.2 Thu nhập & Chi tiêu (Transactions)

#### 3.2.1 Data Structure
```typescript
interface Transaction {
  id: string;                // UUID
  type: 'income' | 'expense';
  title: string;             // Nội dung (bắt buộc)
  amount: number;            // Số nguyên VNĐ (bắt buộc)
  source: 'bank' | 'cash' | 'momo';  // Nguồn tiền (bắt buộc)
  goal: 'none' | 'saving' | 'travel' | 'soon';  // Mục tiêu (bắt buộc, default: 'none')
  note: string;              // Ghi chú (tuỳ chọn)
  date: string;              // ISO timestamp
  createdAt: string;         // ISO timestamp
}
```

#### 3.2.2 Nhập giao dịch (Bottom Sheet / Modal)
Trigger: 2 FAB buttons ở bottom screen — "Thu nhập" và "Chi tiêu"

**FAB Design:**
- Fixed ở bottom center, trên safe area
- 2 button cạnh nhau, gap 12px
- Thu nhập: outline style (border: 1.5px solid --primary, text: --primary, bg: white)
- Chi tiêu: outline style (border: 1.5px solid --border, text: --foreground, bg: white)
- Border-radius: 9999px (pill)
- Height: 48px
- Icon + Text: `<Plus size={16} /> Thu nhập` | `<Plus size={16} /> Chi tiêu`
- Shadow-md

**Bottom Sheet:**
Mở từ dưới lên (shadcn Sheet side="bottom"), chứa form:

```
──────────────── Handle bar ────────────────
 
💰 Thêm thu nhập          (hoặc 💸 Thêm chi tiêu)
 
Nội dung *
┌──────────────────────────────────────────┐
│ VD: Lương tháng 5...                     │
└──────────────────────────────────────────┘
 
Số tiền *
┌──────────────────────────────────────────┐
│ 0                                    VNĐ │
└──────────────────────────────────────────┘
→ 0 ₫                      (live preview formatted)
 
Nguồn tiền *
 ┌──────────┐ ┌──────────┐ ┌──────────┐
 │ 🏦 Ngân  │ │ 💵 Tiền  │ │ 📱 MoMo │
 │   hàng   │ │   mặt    │ │          │
 └──────────┘ └──────────┘ └──────────┘
   (toggle group, single select, default: bank)
 
Mục tiêu
 ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
 │ Không phân   │ │ 🏦 Tiết  │ │ ✈️ Du    │ │ ⏳ Sắp  │
 │ loại         │ │   kiệm   │ │   lịch   │ │   dùng   │
 └──────────────┘ └──────────┘ └──────────┘ └──────────┘
   (toggle group, single select, default: none)
 
Ghi chú (tuỳ chọn)
┌──────────────────────────────────────────┐
│ Thêm ghi chú...                         │
│                                          │
└──────────────────────────────────────────┘
 
┌──────────────────────────────────────────┐
│             LƯU THU NHẬP                │
└──────────────────────────────────────────┘
   (primary button, full-width, height 48px)
```

#### 3.2.3 Số tiền — Auto Format
- Input type: `text` (KHÔNG dùng type="number" vì cần format)
- Khi user gõ: chỉ cho phép nhập số (filter non-numeric characters)
- **Live preview**: hiển thị số đã format bên dưới input
  - Ví dụ: gõ `20000` → preview: `20,000 ₫`
  - Ví dụ: gõ `1500000` → preview: `1,500,000 ₫`
- Sử dụng `Intl.NumberFormat('vi-VN')` + append ` ₫`
- Preview text: `label` size (12px), color: `--income` cho thu nhập, `--expense` cho chi tiêu
- Khi input trống hoặc 0: không hiện preview

#### 3.2.4 Nguồn tiền Tags
Sử dụng shadcn **ToggleGroup** variant="single":
- 3 options: Ngân hàng, Tiền mặt, MoMo
- Default selection: Ngân hàng
- Style khi inactive: bg transparent, border --border, text --muted-foreground
- Style khi active: bg --primary-soft, border --primary-muted, text --foreground
- Border-radius: 8px
- Padding: 10px 16px
- Icon + Text

#### 3.2.5 Mục tiêu Tags
Tương tự ToggleGroup, 4 options:
- **Không phân loại** (default): giao dịch bình thường
- **Tiết kiệm**: tiền này được gom vào quỹ tiết kiệm
- **Du lịch**: tiền này được gom vào quỹ du lịch
- **Sắp dùng**: tiền này sẽ sớm được chi tiêu

#### 3.2.6 Validation
- Nội dung: required, min 1 ký tự, max 100 ký tự
- Số tiền: required, > 0, max 999,999,999,999
- Nguồn tiền: required (có default)
- Mục tiêu: required (có default)
- Ghi chú: optional, max 500 ký tự
- Khi submit thất bại: highlight fields lỗi bằng border --expense, hiện message lỗi bên dưới
- Khi submit thành công: đóng bottom sheet, hiện toast "Đã lưu thu nhập" / "Đã lưu chi tiêu"

### 3.3 Dashboard (Tổng quan)

#### 3.3.1 Layout tổng quát
```
┌─────────────────────────────────────────┐
│  [Logo]                  [○ Profile ▾]  │  Header (sticky)
├─────────────────────────────────────────┤
│  [Tổng quan] [Giao dịch] [Mục tiêu] [Nợ]  │  Tab navigation
├─────────────────────────────────────────┤
│                                         │
│  ◂ Tháng 5, 2026 ▸                     │  Month selector
│                                         │
│  ┌───────────┐  ┌───────────┐           │  Summary cards
│  │ Thu nhập  │  │ Chi tiêu  │           │  (2-column grid)
│  │ +15,000k  │  │ -8,500k   │           │
│  │ 5 giao dịch│  │ 12 gd    │           │
│  └───────────┘  └───────────┘           │
│  ┌───────────────────────────┐           │
│  │ Số dư hiện tại           │           │  Full-width card
│  │ 6,500,000 ₫              │           │
│  │ Trong đó 2,000k tiết kiệm│           │
│  └───────────────────────────┘           │
│                                         │
│  NGUỒN TIỀN                             │  Section: Sources
│  ┌─────────┐┌─────────┐┌─────────┐     │
│  │ Ngân    ││ Tiền    ││  MoMo   │     │  3-column grid
│  │ hàng    ││ mặt     ││         │     │
│  │ 3,500k  ││ 2,000k  ││ 1,000k  │     │
│  └─────────┘└─────────┘└─────────┘     │
│                                         │
│  QUỸ MỤC TIÊU                          │  Section: Goals
│  ┌───────────────────────────┐           │
│  │ 🏦 Tiết kiệm    2,000k ₫│           │
│  │ ████████████▓░░░░░░░░░░  │           │
│  ├───────────────────────────┤           │
│  │ ✈️ Du lịch       500k ₫ │           │
│  │ ████▓░░░░░░░░░░░░░░░░░░  │           │
│  ├───────────────────────────┤           │
│  │ ⏳ Sắp dùng     300k ₫  │           │
│  │ ███▓░░░░░░░░░░░░░░░░░░░  │           │
│  └───────────────────────────┘           │
│                                         │
│  GIAO DỊCH GẦN ĐÂY                     │  Last 5 transactions
│  ┌───────────────────────────┐           │
│  │ ○ Lương T5    +15,000k ₫│           │
│  │   17/05 · Ngân hàng     │           │
│  ├───────────────────────────┤           │
│  │ ...                      │           │
│  └───────────────────────────┘           │
│  [Xem tất cả →]                        │  Link to transactions tab
│                                         │
│                                         │
│         [+ Thu nhập] [+ Chi tiêu]       │  FAB (fixed bottom)
└─────────────────────────────────────────┘
```

#### 3.3.2 Month Selector
- Hiện tại mặc định: tháng hiện tại
- Nút ◂ ▸ để chuyển tháng
- Format: "Tháng {M}, {YYYY}"
- Khi chuyển tháng: tất cả summary cards filter theo tháng đó
- Animation: content fade out → skeleton → fade in (nhanh, ≈200ms)

#### 3.3.3 Summary Cards
3 cards: Thu nhập, Chi tiêu (grid 2 cột), Số dư (full-width)

**Card structure:**
```
┌────────────────────────────┐
│ ● {label}                  │   overline, muted-foreground
│ {amount}                   │   amount-lg, income/expense/foreground
│ {subtitle}                 │   caption, muted-foreground
└────────────────────────────┘
```

- Card: bg --card, border: 1px solid --border, radius: --radius-lg (16px), padding: 20px
- Dot indicator: 6px circle, color: --income / --expense / --primary
- Label: overline style
- Amount: amount-lg (24px, 700), color: --income cho thu nhập, --expense cho chi tiêu, --foreground cho số dư
- Subtitle: caption

**Số dư = Tổng thu nhập - Tổng chi tiêu** (theo tháng đang chọn)
Subtitle số dư: "Trong đó {amount} đang tiết kiệm" (nếu có tiết kiệm)

#### 3.3.4 Nguồn tiền Blocks
3 cards ngang nhau (grid 3 cột):

**Cách tính số dư từng nguồn:**
```
balance[source] = SUM(income where source=X) - SUM(expense where source=X)
```
- Tính từ TẤT CẢ transactions (không filter theo tháng) → vì số dư nguồn là tích lũy
- Nếu balance < 0: hiện 0 ₫

**Card structure:**
```
┌──────────────┐
│     icon     │   Lucide icon, 24px, color: --muted-foreground
│   {name}     │   label size, muted-foreground
│   {amount}   │   amount-sm, foreground
└──────────────┘
```

- Card: bg --card, border, radius-md, padding: 16px, text-align center

#### 3.3.5 Quỹ Mục tiêu
3 mục: Tiết kiệm, Du lịch, Sắp dùng. Hiện trong 1 card chung, ngăn cách bằng Separator.

**Mỗi item:**
```
┌──────────────────────────────────────────┐
│ [icon]  {name}                 {amount}  │
│         {description}                    │
│         ████████▓░░░░░░░░░░░░░           │  Progress bar
└──────────────────────────────────────────┘
```

**Cách tính:**
```
goalBalance[goal] = SUM(income where goal=X) - SUM(expense where goal=X)
```
- Tích lũy toàn bộ thời gian, không filter tháng
- Progress bar: proportion so với tổng 3 mục tiêu cộng lại
- Progress bar: height 4px, bg --muted, fill --primary, border-radius full

#### 3.3.6 Giao dịch gần đây
- Hiện TỐI ĐA 5 giao dịch mới nhất (theo tháng đang chọn)
- Link "Xem tất cả →" chuyển sang tab Giao dịch
- Nếu không có giao dịch: hiện empty state

### 3.4 Trang Giao dịch (Transactions Tab)

#### 3.4.1 Layout
```
LỊCH SỬ GIAO DỊCH

[Filter: Tất cả ▾]  [Sắp xếp: Mới nhất ▾]     (optional filters)

┌──────────────────────────────────────────┐
│ [↓] Lương tháng 5              +15,000k │
│     17/05/2026 · Ngân hàng · Tiết kiệm  │
│     📝 Lương chính thức...               │
├──────────────────────────────────────────┤
│ [↑] Cà phê Highlands            -85,000 │
│     17/05/2026 · MoMo                    │
├──────────────────────────────────────────┤
│ ...                                      │
└──────────────────────────────────────────┘
```

#### 3.4.2 Transaction Item
```
┌──────────────────────────────────────────┐
│ [icon]  {title}                {amount}  │
│         {date} · {source} · {goal?}      │
│         📝 {note}  (nếu có)             │
└──────────────────────────────────────────┘
```

- Icon container: 40px × 40px, radius 10px
  - Thu nhập: bg --primary-soft, icon ArrowDownLeft color --primary
  - Chi tiêu: bg hsl(0, 65%, 96%), icon ArrowUpRight color --expense
- Title: heading-sm (15px, 600)
- Amount: amount-md, color: --income với "+" prefix / --expense với "-" prefix
- Date: caption, muted-foreground. Format: "DD/MM/YYYY"
- Tags (source, goal): Badge variant="secondary" từ shadcn, text 11px
  - Background: --muted
  - Text: --muted-foreground
  - Border: none
  - Chỉ hiện goal tag nếu goal ≠ 'none'
- Note: caption style, muted-foreground, icon FileText trước text, 1 dòng truncate

#### 3.4.3 Actions trên từng giao dịch
- Swipe left (mobile) hoặc hover → hiện nút Sửa/Xoá
- Hoặc: tap/click → mở bottom sheet chi tiết với nút Sửa/Xoá
- Xoá: hiện AlertDialog confirm trước khi xoá
- Sửa: mở lại bottom sheet form với data đã fill sẵn

#### 3.4.4 Empty State
```
┌──────────────────────────────────────────┐
│                                          │
│            [illustration icon]           │
│                                          │
│        Chưa có giao dịch nào             │  heading-sm
│     Nhấn nút + để thêm giao dịch đầu tiên│  caption
│                                          │
└──────────────────────────────────────────┘
```
- Icon: Lucide `Receipt` hoặc `Coins`, size 48px, color --muted-foreground (30% opacity)
- Centered, padding 64px top/bottom

### 3.5 Trang Mục tiêu (Goals Tab)

#### 3.5.1 Layout
```
PHÂN BỔ MỤC TIÊU

┌──────────────────────────────────────────┐
│ [🏦] Tiết kiệm                 2,000k ₫│
│      Không rút — chỉ tích lũy           │
│      ████████████▓░░░░░░░░░░░░           │
├──────────────────────────────────────────┤
│ [✈️] Du lịch                     500k ₫│
│      Dành cho chuyến đi                  │
│      ████▓░░░░░░░░░░░░░░░░░░░           │
├──────────────────────────────────────────┤
│ [⏳] Sắp dùng                   300k ₫ │
│      Tiền chờ chi tiêu                   │
│      ███▓░░░░░░░░░░░░░░░░░░░░           │
└──────────────────────────────────────────┘

GIAO DỊCH THEO MỤC TIÊU

(list tất cả giao dịch có goal ≠ 'none', grouped hoặc flat)
```

#### 3.5.2 Logic mục tiêu

**Tiết kiệm:**
- Thu nhập đánh tag "Tiết kiệm" → cộng vào quỹ
- Chi tiêu đánh tag "Tiết kiệm" → trừ khỏi quỹ (rút tiết kiệm)
- Về nguyên tắc: nên hạn chế rút, UI có thể hiện cảnh báo khi user tạo expense với goal=saving

**Du lịch:**
- Tương tự, nhưng không có cảnh báo khi chi tiêu
- Thu nhập tag "Du lịch" → nạp quỹ
- Chi tiêu tag "Du lịch" → dùng quỹ

**Sắp dùng:**
- Tiền tạm giữ, sẽ chi tiêu sớm
- Thu nhập tag "Sắp dùng" → nạp
- Chi tiêu tag "Sắp dùng" → dùng

### 3.6 Trang Nợ (Debts Tab) — SHEET RIÊNG

#### 3.6.1 Lý do tách riêng
Nợ có logic khác biệt hoàn toàn với thu chi thường:
- Không ảnh hưởng cash flow hiện tại
- Có thông tin người vay/cho vay
- Có trạng thái (đang nợ / đã trả)
- Có ngày hẹn trả
- Không tính vào báo cáo thu chi tháng

#### 3.6.2 Data Structure
```typescript
interface Debt {
  id: string;                    // UUID
  type: 'owe' | 'lend';         // 'owe' = tôi nợ người khác, 'lend' = người khác nợ tôi
  person: string;                // Tên người liên quan (bắt buộc)
  amount: number;                // Số tiền VNĐ (bắt buộc)
  note: string;                  // Ghi chú (tuỳ chọn)
  dueDate: string | null;        // Ngày hẹn trả (tuỳ chọn), ISO date
  settled: boolean;              // Đã xử lý chưa
  settledAt: string | null;      // Thời điểm xử lý
  createdAt: string;             // ISO timestamp
}
```

#### 3.6.3 Layout
```
QUẢN LÝ NỢ

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Đang nợ     │ │  Cho vay     │ │  Đã xử lý   │
│  2,000k ₫    │ │  500k ₫      │ │  1,500k ₫    │
└──────────────┘ └──────────────┘ └──────────────┘
  (3-column stat cards)

[Tab: Đang mở | Đã xử lý]

┌──────────────────────────────────────────┐
│  👤 Minh                    [Tôi nợ]    │  Badge "Tôi nợ" (subtle red bg)
│  2,000,000 ₫                            │  amount-lg, expense color
│  📝 Nợ tiền ăn tối hôm qua             │  caption
│  📅 Hạn: 25/05/2026     [Đã trả ✓]     │  Due date + settle button
├──────────────────────────────────────────┤
│  👤 Lan                   [Họ nợ tôi]   │  Badge "Họ nợ tôi" (subtle green bg)
│  500,000 ₫                              │  amount-lg, income color
│  📅 Chưa có hạn          [Đã trả ✓]     │
└──────────────────────────────────────────┘
```

#### 3.6.4 Thêm nợ (Bottom Sheet)
Khi ở tab Nợ, FAB buttons thay đổi thành 1 nút: "Ghi nợ"

```
──────────────── Handle bar ────────────────
 
🤝 Ghi nợ mới
 
Loại *
 ┌──────────────┐ ┌──────────────┐
 │ Tôi nợ       │ │ Họ nợ tôi    │
 └──────────────┘ └──────────────┘
   (toggle group)
 
Tên người *
┌──────────────────────────────────────────┐
│ VD: Minh, Lan...                         │
└──────────────────────────────────────────┘
 
Số tiền *
┌──────────────────────────────────────────┐
│ 0                                    VNĐ │
└──────────────────────────────────────────┘
→ 0 ₫
 
Ngày hẹn trả (tuỳ chọn)
┌──────────────────────────────────────────┐
│ Chọn ngày...                             │
└──────────────────────────────────────────┘
 
Ghi chú (tuỳ chọn)
┌──────────────────────────────────────────┐
│ Thêm ghi chú...                         │
└──────────────────────────────────────────┘
 
┌──────────────────────────────────────────┐
│              LƯU KHOẢN NỢ              │
└──────────────────────────────────────────┘
```

#### 3.6.5 Settle (Xử lý nợ)
- Nút "Đã trả ✓" trên mỗi debt card
- Click → AlertDialog: "Xác nhận đã xử lý khoản nợ {amount} với {person}?"
- Confirm → debt.settled = true, debt.settledAt = now
- Debt chuyển sang tab "Đã xử lý"
- Toast: "Đã xử lý khoản nợ"

### 3.7 FAB (Floating Action Buttons) Context-Aware

FAB thay đổi tuỳ theo tab đang active:

| Tab hiện tại | FAB hiển thị |
|-------------|-------------|
| Tổng quan | `[+ Thu nhập]` `[+ Chi tiêu]` |
| Giao dịch | `[+ Thu nhập]` `[+ Chi tiêu]` |
| Mục tiêu | `[+ Thu nhập]` `[+ Chi tiêu]` |
| Nợ | `[+ Ghi nợ]` (1 nút duy nhất) |

---

## 4. NAVIGATION

### 4.1 Tab Navigation
Sử dụng shadcn **Tabs** component, variant ngang, vị trí dưới header.

```
[Tổng quan] [Giao dịch] [Mục tiêu] [Nợ]
```

- Style: text tabs, không có background
- Active tab: text --foreground, font-weight 600, border-bottom 2px --primary
- Inactive tab: text --muted-foreground, font-weight 400
- Tab bar: sticky dưới header, bg --background (match page bg), border-bottom: 1px --border
- Horizontal scroll trên mobile nếu cần (nhưng 4 tabs nên vừa)

### 4.2 Header
- Sticky top, z-index 50
- Background: --background
- Border-bottom: 1px solid --border
- Height: 56px
- Padding: 0 20px
- Content: `[Logo text "ví.app"]  ←spacer→  [Profile Switcher]`
- Logo: heading-md, font-weight 700, color --primary

### 4.3 Page Transition
- Khi switch tab: content area fade (opacity 0 → 1, 200ms)
- **KHÔNG** slide left/right
- **KHÔNG** thay đổi scroll position (reset to top khi switch tab)
- Skeleton hiện ngay, content fade in khi data ready

---

## 5. DATA MANAGEMENT

### 5.1 Storage Schema (localStorage)
```
viapp_profiles       → UserProfile[]
viapp_current        → string (profileId)
viapp_tx_{profileId} → Transaction[]
viapp_debt_{profileId} → Debt[]
```

### 5.2 Calculated Values (derived, không lưu)
```typescript
// Tính theo tháng (month-filtered)
monthlyIncome(month, year) = SUM(tx.amount WHERE tx.type='income' AND tx.month=month AND tx.year=year)
monthlyExpense(month, year) = SUM(tx.amount WHERE tx.type='expense' AND tx.month=month AND tx.year=year)
monthlyBalance(month, year) = monthlyIncome - monthlyExpense

// Tính tích lũy (all-time)
sourceBalance(source) = SUM(income WHERE source=X) - SUM(expense WHERE source=X)
goalBalance(goal) = SUM(income WHERE goal=X) - SUM(expense WHERE goal=X)

// Nợ
totalOwe = SUM(debt.amount WHERE type='owe' AND settled=false)
totalLend = SUM(debt.amount WHERE type='lend' AND settled=false)
totalSettled = SUM(debt.amount WHERE settled=true)
```

### 5.3 Format tiền VNĐ
```typescript
function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

// Ví dụ:
// 20000 → "20.000 ₫"
// 1500000 → "1.500.000 ₫"  
// 15000000 → "15.000.000 ₫"
```

Lưu ý: Intl vi-VN dùng dấu chấm (.) làm separator, KHÔNG dùng dấu phẩy.

---

## 6. EDGE CASES & EMPTY STATES

### 6.1 Empty States cho từng section

| Section | Icon (Lucide) | Title | Subtitle |
|---------|--------------|-------|----------|
| Giao dịch (list trống) | `Receipt` | "Chưa có giao dịch nào" | "Nhấn + để thêm giao dịch đầu tiên" |
| Mục tiêu (chưa có TX với goal) | `Target` | "Chưa có dữ liệu mục tiêu" | "Phân loại giao dịch theo mục tiêu khi thêm mới" |
| Nợ (list trống) | `Handshake` | "Chưa có khoản nợ nào" | "Nhấn + Ghi nợ để thêm" |
| Dashboard giao dịch gần đây | `Inbox` | "Không có giao dịch trong tháng này" | "" |
| Nguồn tiền (tất cả = 0) | — | Vẫn hiện cards, amount = "0 ₫" | — |
| Quỹ mục tiêu (tất cả = 0) | — | Vẫn hiện cards, amount = "0 ₫", bar = 0% | — |

### 6.2 Edge Cases
- Số tiền = 0 hoặc negative balance: hiện "0 ₫", KHÔNG hiện số âm
- Giao dịch rất dài title: truncate 1 line với ellipsis
- Note rất dài: truncate 1 line trong list, full text khi mở detail
- Rất nhiều giao dịch (>100): virtualized list hoặc pagination (20 items/page)
- Profile không có data: hiện empty state cho dashboard, KHÔNG crash
- localStorage full: catch error, hiện toast warning

---

## 7. ACCESSIBILITY & CONTRAST

### 7.1 Contrast Requirements (WCAG AA)
Tất cả text phải đạt contrast ratio tối thiểu:
- Normal text (< 18px): ratio ≥ 4.5:1
- Large text (≥ 18px bold hoặc ≥ 24px regular): ratio ≥ 3:1

**Kiểm tra contrast của color palette:**

| Text Color | Background | Ratio | Pass? |
|-----------|-----------|-------|-------|
| --foreground (#1D2330) | --background (#FFFFFF) | ~15:1 | ✅ |
| --foreground (#1D2330) | --card (#FFFFFF) | ~15:1 | ✅ |
| --muted-foreground (#6B7280) | --background (#FFFFFF) | ~5.5:1 | ✅ |
| --income (#2E8B57) | --background (#FFFFFF) | ~4.8:1 | ✅ |
| --expense (#D94F4F) | --background (#FFFFFF) | ~4.2:1 | ✅ (large text) |
| --primary (#3D9A6E) | --background (#FFFFFF) | ~4.6:1 | ✅ |
| --primary-foreground (#FFF) | --primary (#3D9A6E) | ~4.6:1 | ✅ |

*Nếu contrast của --expense trên white không đạt 4.5, có thể tăng saturation hoặc giảm lightness: thử hsl(0, 70%, 50%) = #D93636 cho ratio ~5:1*

### 7.2 Other Accessibility
- Tất cả interactive elements phải có focus ring (--ring color, 2px offset)
- Form inputs phải có associated labels (không chỉ placeholder)
- Buttons phải có đủ touch target: tối thiểu 44px × 44px
- Icons phải có sr-only text hoặc aria-label
- Bottom sheet phải trap focus khi mở
- Toast phải có role="status" aria-live="polite"

---

## 8. FIRST-TIME USER EXPERIENCE

### 8.1 Onboarding Flow
Khi mở app lần đầu (không có data trong localStorage):

1. **Welcome screen**: 
   - "Chào mừng đến với ví.app"
   - "Quản lý tài chính cá nhân đơn giản"
   - Input: "Tên của bạn là gì?"
   - Button: "Bắt đầu"

2. Tạo profile mặc định với tên user nhập
3. Chuyển thẳng vào Dashboard (trống, empty states)
4. FABs sáng lên nhẹ (pulse animation 1 lần) để gợi ý user thêm giao dịch đầu tiên

---

## 9. FILE STRUCTURE ĐỀ XUẤT

```
src/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                     ← shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── sheet.tsx
│   │   ├── tabs.tsx
│   │   ├── toggle-group.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   ├── separator.tsx
│   │   ├── avatar.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── progress.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── scroll-area.tsx
│   │   └── toast/ (sonner)
│   ├── layout/
│   │   ├── Header.tsx           ← Logo + Profile Switcher
│   │   ├── TabNav.tsx           ← Tab navigation
│   │   └── FAB.tsx              ← Floating action buttons (context-aware)
│   ├── dashboard/
│   │   ├── SummaryCards.tsx      ← Income/Expense/Balance cards
│   │   ├── SummaryCardSkeleton.tsx
│   │   ├── SourceBlocks.tsx     ← 3 source cards
│   │   ├── GoalBlocks.tsx       ← 3 goal items with progress
│   │   ├── RecentTransactions.tsx
│   │   └── MonthSelector.tsx
│   ├── transactions/
│   │   ├── TransactionList.tsx
│   │   ├── TransactionItem.tsx
│   │   ├── TransactionItemSkeleton.tsx
│   │   ├── TransactionForm.tsx  ← Bottom sheet form (income & expense)
│   │   └── EmptyTransactions.tsx
│   ├── goals/
│   │   ├── GoalOverview.tsx
│   │   ├── GoalTransactions.tsx
│   │   └── GoalSkeleton.tsx
│   ├── debts/
│   │   ├── DebtStats.tsx        ← 3 stat cards
│   │   ├── DebtList.tsx
│   │   ├── DebtCard.tsx
│   │   ├── DebtForm.tsx         ← Bottom sheet form
│   │   └── EmptyDebts.tsx
│   ├── profile/
│   │   ├── ProfileSwitcher.tsx
│   │   ├── ProfileDropdown.tsx
│   │   └── OnboardingScreen.tsx
│   └── shared/
│       ├── EmptyState.tsx       ← Reusable empty state component
│       ├── AmountInput.tsx      ← Number input with VNĐ formatting
│       ├── SourceToggle.tsx     ← Source tag toggle group
│       └── GoalToggle.tsx       ← Goal tag toggle group
├── hooks/
│   ├── useProfiles.ts           ← Profile CRUD & switching
│   ├── useTransactions.ts       ← Transaction CRUD & queries
│   ├── useDebts.ts              ← Debt CRUD & queries
│   ├── useMonthFilter.ts        ← Month navigation state
│   └── useSummary.ts            ← Calculated derived values
├── lib/
│   ├── storage.ts               ← localStorage wrapper with error handling
│   ├── format.ts                ← formatVND, formatDate utilities
│   ├── types.ts                 ← TypeScript interfaces
│   └── constants.ts             ← Source/Goal enums, default values
├── styles/
│   └── globals.css              ← CSS variables, tailwind config
└── store/
    └── app-store.ts             ← Zustand store (or Context)
```

---

## 10. CHECKLIST TRƯỚC KHI CODE

- [ ] Setup Vite/Next.js + Tailwind CSS
- [ ] Install & configure shadcn/ui (neutral theme, customized)
- [ ] Add Be Vietnam Pro font via Google Fonts
- [ ] Define CSS variables (colors, spacing, shadows, radius)
- [ ] Define Tailwind theme extension matching design tokens
- [ ] Build all shadcn/ui components needed
- [ ] Implement localStorage wrapper with error handling
- [ ] Build TypeScript types/interfaces
- [ ] Build Profile system (CRUD, switch, onboarding)
- [ ] Build Transaction system (CRUD, format, filter by month)
- [ ] Build Debt system (CRUD, settle)
- [ ] Build Dashboard page with all sections
- [ ] Build Transactions page
- [ ] Build Goals page
- [ ] Build Debts page
- [ ] Build all skeleton states
- [ ] Build all empty states
- [ ] Build FAB (context-aware)
- [ ] Build Bottom Sheet forms (transaction, debt)
- [ ] Implement page transitions (fade, consistent)
- [ ] Test contrast ratios
- [ ] Test on mobile viewport (375px)
- [ ] Test empty states
- [ ] Test with large data sets
- [ ] Test profile switching
