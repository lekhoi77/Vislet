# Vislet — Tài liệu Business Analyst (BA)

> **Phiên bản:** 1.0
> **Ngày cập nhật:** 2026-05-22
> **Phạm vi:** Đặc tả nghiệp vụ, yêu cầu chức năng/phi chức năng, use case, data model, business rules, edge cases.
> **Đối tượng đọc:** Developer, QA, Designer, Product Owner, BA mới onboard.

> ⚠️ Tài liệu này là **nguồn sự thật về NGHIỆP VỤ**. Khi code và tài liệu mâu thuẫn, hãy raise issue — KHÔNG tự ý sửa một bên.

---

## 1. Mục lục

1. Tổng quan hệ thống
2. Stakeholders & Actors
3. Yêu cầu chức năng (Functional Requirements)
4. Yêu cầu phi chức năng (Non-Functional Requirements)
5. Use Cases chi tiết
6. Data Model & Entity Relationship
7. Business Rules
8. State Machines
9. User Flows (end-to-end)
10. Validation Rules
11. Edge Cases & Empty States
12. Tích hợp & Phụ thuộc bên ngoài
13. Phân tích bảo mật & quyền truy cập
14. Báo cáo & chỉ số dẫn xuất
15. Phụ lục — Thuật ngữ (Glossary)

---

## 2. Tổng quan hệ thống

### 2.1 Kiến trúc cấp cao
```
┌────────────────────────────────────────┐
│       CLIENT (Next.js 16 — App Router) │
│  ─ React 19 + TypeScript               │
│  ─ Tailwind CSS + shadcn/ui            │
│  ─ Zustand state (app-store, auth-store)│
│  ─ PWA-ready, mobile-first             │
└────────────────────┬───────────────────┘
                     │ HTTPS / supabase-js
                     ▼
┌────────────────────────────────────────┐
│        SUPABASE (BaaS)                 │
│  ─ PostgreSQL (transactions, debts,    │
│    profiles, sources, goals)           │
│  ─ Supabase Auth (email + OAuth-ready) │
│  ─ Row Level Security (RLS)            │
└────────────────────────────────────────┘
```

### 2.2 Domain chính
- **Identity & Profile**: tài khoản (auth user) → có 1..n hồ sơ (UserProfile).
- **Transaction**: bản ghi thu/chi gắn với 1 profile, 1 source, 1 goal.
- **Debt**: bản ghi nợ (tôi nợ / họ nợ tôi), độc lập với Transaction.
- **Catalog**: danh mục nguồn tiền (sources) & mục tiêu (goals) — có default + custom.
- **View / Analytics**: dashboard, calendar, heatmap, summary cards — đều là **derived** từ dữ liệu Transaction & Debt.

### 2.3 Đơn vị tổ chức dữ liệu
- **1 Auth User** = 1 email/account đăng nhập.
- **1 Auth User** sở hữu **1..5 Profile** (multi-profile model).
- **1 Profile** sở hữu danh sách Transaction, Debt, Source, Goal **độc lập** với profile khác — kể cả cùng auth user.

---

## 3. Stakeholders & Actors

### 3.1 Actors hệ thống
| Actor | Vai trò | Quyền |
|---|---|---|
| **Guest** | Người chưa đăng nhập | Xem login screen, đăng ký |
| **Authenticated User** | Đã đăng nhập, chưa có profile | Tạo profile đầu tiên (onboarding) |
| **Profile Owner** | User đang active 1 profile | Toàn quyền CRUD trong scope profile đó |
| **Supabase RLS** | Database-level guard | Enforce: user chỉ thấy data của profile mà mình sở hữu |

### 3.2 Stakeholders nghiệp vụ
- **Người dùng cuối**: persona Linh/Tuấn/Hương (xem `BUSINESS.md`).
- **Product Owner**: định nghĩa scope, ưu tiên backlog.
- **Designer**: giữ trung thành design system (xem `PLAN_FINANCE_APP.md`).
- **Developer/QA**: implement & verify theo tài liệu này.

---

## 4. Yêu cầu chức năng (Functional Requirements)

### FR-1: Xác thực (Authentication)
| ID | Yêu cầu |
|---|---|
| FR-1.1 | User có thể đăng ký tài khoản bằng email + password (Supabase Auth) |
| FR-1.2 | User có thể đăng nhập, đăng xuất |
| FR-1.3 | Khi auth session hết hạn → tự redirect về login |
| FR-1.4 | Khi user đổi sang account khác → state cũ phải bị wipe sạch (chống cross-user bleed) |

### FR-2: Profile Management
| ID | Yêu cầu |
|---|---|
| FR-2.1 | User mới (không có profile nào) → bắt buộc qua màn Onboarding tạo profile đầu |
| FR-2.2 | Mỗi auth user có tối đa **5 profile** (giới hạn nghiệp vụ, không phải kỹ thuật) |
| FR-2.3 | User có thể switch active profile bất kỳ lúc nào qua dropdown header |
| FR-2.4 | Mỗi profile có: `id`, `name`, `avatarColor`, `initial`, `createdAt` |
| FR-2.5 | Khi switch profile → toàn bộ tab/data reload, scroll về top |
| FR-2.6 | User KHÔNG thể xoá profile cuối cùng (luôn ≥ 1) |
| FR-2.7 | `currentProfileId` được persist trong `localStorage` theo key `viapp_current_{userId}` |

### FR-3: Catalog (Sources & Goals)
| ID | Yêu cầu |
|---|---|
| FR-3.1 | Khi tạo profile mới → seed `DEFAULT_SOURCES` (bank, cash, momo) và `DEFAULT_GOALS` (none, saving, travel, soon) |
| FR-3.2 | User có thể thêm Source/Goal tuỳ ý qua AddSourceSheet/AddBudgetSheet |
| FR-3.3 | User có thể sửa label & icon của Source/Goal (kể cả default) |
| FR-3.4 | User có thể xoá Source/Goal — kể cả default — NHƯNG: |
|        | - KHÔNG được xoá Source cuối cùng |
|        | - KHÔNG được xoá Goal `'none'` (PROTECTED_GOAL_ID — "Chưa phân loại") |
| FR-3.5 | Khi xoá 1 Source: tất cả transaction đang dùng source đó phải được **reassign sang Source khác** (theo `pickFallbackSourceId`) — KHÔNG xoá transaction |
| FR-3.6 | Khi xoá 1 Goal: tất cả transaction đang dùng goal đó phải reassign sang `'none'` |
| FR-3.7 | Default IDs khi bị xoá → ghi nhớ trong `removedSourceIds` / `removedGoalIds` (localStorage per profile) để không re-seed lại |

### FR-4: Transaction CRUD
| ID | Yêu cầu |
|---|---|
| FR-4.1 | User có thể thêm transaction kiểu `income` hoặc `expense` qua TransactionForm (bottom sheet) |
| FR-4.2 | Mỗi transaction phải có: `title`, `amount` (>0), `source` (1 trong customSources), `goal` (1 trong customBudgets), `date` (ISO), `note` (optional) |
| FR-4.3 | `amount` input chỉ nhận số nguyên dương VNĐ, có live-preview định dạng `vi-VN` |
| FR-4.4 | User có thể sửa transaction đã tạo (mở lại form với data pre-filled) |
| FR-4.5 | User có thể xoá transaction (kèm AlertDialog confirm) |
| FR-4.6 | Sau khi save thành công → toast "Đã lưu thu nhập"/"Đã lưu chi tiêu" |
| FR-4.7 | Keyboard shortcuts (desktop): `Ctrl+Alt+T` = thêm income, `Ctrl+Alt+E` = thêm expense (toggle nếu đang mở) |

### FR-5: Debt CRUD
| ID | Yêu cầu |
|---|---|
| FR-5.1 | User có thể ghi nợ kiểu `owe` (tôi nợ) hoặc `lend` (họ nợ tôi) |
| FR-5.2 | Mỗi debt phải có: `person`, `amount` (>0), `type`. Tùy chọn: `note`, `dueDate` |
| FR-5.3 | User có thể "Đã trả" (settle) — set `settled=true`, `settledAt=now` |
| FR-5.4 | Debt đã settle có thể được unsettle (mở lại) |
| FR-5.5 | Debt KHÔNG ảnh hưởng đến report thu/chi tháng |
| FR-5.6 | Debt list có filter "Đang mở" vs "Đã xử lý" |

### FR-6: Dashboard (Overview Tab)
| ID | Yêu cầu |
|---|---|
| FR-6.1 | Hiển thị `SummaryCards`: tổng thu, tổng chi, số dư tháng (filter theo month/year đang chọn) |
| FR-6.2 | Hiển thị `SourceBlocks`: số dư tích lũy của từng source (all-time, không filter tháng) |
| FR-6.3 | Hiển thị `GoalBlocks`: số dư tích lũy của từng goal + progress bar |
| FR-6.4 | Hiển thị `CalendarBlock`: lịch tháng có chấm chỉ báo ngày có transaction; click ngày → mở DayDetailSheet |
| FR-6.5 | Hiển thị `ExpenseHeatmap`: heatmap mức chi theo ngày trong tháng |
| FR-6.6 | `MonthSelector`: ◂ ▸ + nút "Hôm nay"; cho phép chọn tháng bất kỳ qua dropdown |
| FR-6.7 | Khi chuyển tháng → content tab fade transition + scroll reset |

### FR-7: Transactions Tab
| ID | Yêu cầu |
|---|---|
| FR-7.1 | Hiển thị danh sách giao dịch của tháng đang chọn, sắp xếp mới nhất trước |
| FR-7.2 | Cho phép tìm kiếm (search) theo title/note |
| FR-7.3 | Mỗi item: icon, title, amount (màu income/expense), date, source tag, goal tag (nếu ≠ none), note (nếu có, truncate 1 dòng) |
| FR-7.4 | Tap/click item → mở edit form |
| FR-7.5 | Empty state khi không có giao dịch trong tháng |

### FR-8: Goals Tab
| ID | Yêu cầu |
|---|---|
| FR-8.1 | Hiển thị tổng quan các goal: tên, số dư, progress bar |
| FR-8.2 | Hiển thị danh sách transaction thuộc goal ≠ none, group theo goal |

### FR-9: Debts Tab
| ID | Yêu cầu |
|---|---|
| FR-9.1 | Hiển thị `DebtStats`: 3 thẻ tổng "Đang nợ", "Cho vay", "Đã xử lý" |
| FR-9.2 | Filter tabs: "Đang mở" / "Đã xử lý" |
| FR-9.3 | Mỗi debt card: tên người, badge loại (Tôi nợ/Họ nợ tôi), amount, due date, note, nút Đã trả |

### FR-10: First-time User Experience
| ID | Yêu cầu |
|---|---|
| FR-10.1 | User chưa có profile → màn `OnboardingScreen` |
| FR-10.2 | User mới (0 transactions) → tự động trigger `WalkthroughTour` sau 600ms |
| FR-10.3 | FAB pulse animation 1 lần (~4s) cho user mới chưa có transaction |
| FR-10.4 | Sau khi xem tour → lưu flag `viapp_tour_seen` trong localStorage |
| FR-10.5 | User có thể mở lại tour bất kỳ lúc nào qua nút Guide ở Header |

---

## 5. Yêu cầu phi chức năng (NFR)

### NFR-1: Performance
- Page load p95 < 2s trên kết nối 3G mobile.
- Tab switch animation < 250ms.
- Transaction list virtual scroll khi > 100 items.

### NFR-2: Usability
- Mobile-first: viewport tối thiểu 375px.
- Touch target ≥ 44×44px.
- Tất cả interactive element có focus ring.
- Bottom sheet trap focus khi mở.

### NFR-3: Accessibility (WCAG AA)
- Contrast ≥ 4.5:1 cho text thường, ≥ 3:1 cho text lớn.
- Form input phải có label (không chỉ placeholder).
- Toast `role="status" aria-live="polite"`.

### NFR-4: Privacy & Security
- Mọi DB query phải qua Supabase Row Level Security.
- User chỉ truy cập được dữ liệu của profile mà mình sở hữu.
- KHÔNG bao giờ log số tiền giao dịch ra console ở production.
- Mật khẩu KHÔNG bao giờ stored client-side.

### NFR-5: Reliability
- Mọi mutation phải có error handling — fail loud (toast lỗi), không silent fail.
- localStorage operation phải wrap try/catch.
- Khi mất kết nối → cho phép thao tác local tối thiểu (nếu PWA caching đầy đủ).

### NFR-6: Internationalization
- Hiện tại: tiếng Việt 100%, format `vi-VN`.
- Toàn bộ string UI phải dễ swap ra i18n file ở giai đoạn 2.

### NFR-7: Browser support
- Chrome / Safari / Edge / Firefox phiên bản 2 năm gần nhất.
- iOS Safari ≥ 15.
- Android WebView Chrome ≥ 100.

---

## 6. Use Cases chi tiết

### UC-01: Đăng nhập lần đầu & tạo profile
- **Actor**: Guest → Authenticated User
- **Pre**: chưa có account hoặc đã có account nhưng chưa có profile.
- **Flow**:
  1. Guest mở app → thấy `LoginScreen`.
  2. Đăng ký với email + password.
  3. Sau khi auth thành công → `initApp` được gọi.
  4. Vì `profiles.length === 0` → hiển thị `OnboardingScreen`.
  5. User nhập tên → click "Bắt đầu".
  6. `createProfile(name)` chạy: insert profile + seed default catalog.
  7. Set `currentProfileId` = new id, lưu localStorage.
  8. Đóng onboarding → vào Dashboard (empty state).
- **Post**: User có 1 profile active với catalog default seed sẵn.
- **Errors**: Email trùng → message lỗi; tên trống → disable submit.

### UC-02: Ghi thu nhập đầu tiên
- **Actor**: Profile Owner (vừa onboard)
- **Pre**: ở Dashboard, transactions trống.
- **Flow**:
  1. FAB pulse → user nhấn "+ Thu nhập".
  2. `TransactionForm` mở bottom sheet với `type='income'`.
  3. User nhập title, amount (live-formatted), chọn source, goal (default none), note.
  4. Submit → validate → `addTransaction` insert vào Supabase.
  5. Toast "Đã lưu thu nhập". Form đóng.
  6. Dashboard rerender: SummaryCards, SourceBlocks, GoalBlocks, Recent reflect đầy đủ.
- **Post**: Transaction được lưu vào DB; analytics tracking event (nếu có).
- **Errors**: amount ≤ 0 → border đỏ; mất mạng → toast lỗi, transaction KHÔNG được đưa vào state.

### UC-03: Xoá source mặc định "MoMo" sau khi đã có giao dịch
- **Actor**: Profile Owner
- **Pre**: Đã có ≥ 1 transaction với `source='momo'`.
- **Flow**:
  1. User mở AddSourceSheet → tìm "MoMo" → tap "Xoá".
  2. Hệ thống tính `fallbackId = pickFallbackSourceId(customSources, 'momo')` (source khác đầu tiên).
  3. Hệ thống chạy `UPDATE transactions SET source=fallbackId WHERE source='momo'` cho profile hiện tại.
  4. Xoá row 'momo' trong `sources` table (vì nó đã được persist do là default seed).
  5. Cập nhật `removedSourceIds` localStorage thêm 'momo' (chống re-seed).
  6. State update: list source hiển thị không còn MoMo; tất cả transaction cũ giờ thuộc fallback source.
- **Post**: Báo cáo source MoMo biến mất; balance fallback source tăng tương ứng.
- **Lỗi**: nếu MoMo là source DUY NHẤT còn lại → throw "Cần giữ ít nhất một nguồn tiền".

### UC-04: Ghi nợ "Tôi nợ Minh 2 triệu, hẹn 25/05"
- **Actor**: Profile Owner
- **Pre**: ở tab Debts.
- **Flow**:
  1. FAB hiển thị 1 nút duy nhất "+ Ghi nợ" (context-aware).
  2. Tap → `DebtForm` mở.
  3. Chọn type `owe`, nhập "Minh", amount 2,000,000, dueDate 2026-05-25, note tuỳ chọn.
  4. Submit → `addDebt` insert vào table `debts`.
  5. Debt card xuất hiện trong tab "Đang mở".
- **Post**: `DebtStats` "Đang nợ" tăng 2,000,000. KHÔNG ảnh hưởng SummaryCards thu chi tháng.

### UC-05: Settle debt
- **Actor**: Profile Owner
- **Flow**:
  1. Trên debt card → tap "Đã trả ✓".
  2. AlertDialog confirm "Xác nhận đã xử lý khoản nợ 2,000,000 ₫ với Minh?".
  3. Confirm → `settleDebt(id)` update DB.
  4. Debt chuyển sang tab "Đã xử lý". `settledAt = now`.
- **Post**: `DebtStats` "Đang nợ" giảm, "Đã xử lý" tăng.

### UC-06: Switch profile
- **Actor**: Profile Owner
- **Flow**:
  1. Tap avatar/dropdown ở Header.
  2. Chọn profile khác trong list.
  3. `switchProfile(id)` → fetch lại tất cả data của profile mới.
  4. Toàn bộ tab reset, scroll top.
- **Post**: `localStorage[viapp_current_{userId}]` cập nhật.

### UC-07: Thêm tài khoản khác (login overlay)
- **Actor**: Profile Owner
- **Flow**:
  1. Trong header dropdown, chọn "Thêm tài khoản" → `showLoginOverlay = true`.
  2. `LoginScreen` overlay hiển thị, có nút "Huỷ".
  3. User login bằng account khác → `auth-store` detect user change.
  4. `app-store` wipe state cũ, gọi `initApp` cho user mới.
  5. Nếu user mới chưa có profile → onboarding.
- **Post**: Đang ở context user mới hoàn toàn.

---

## 7. Data Model & Entity Relationship

### 7.1 Entity Relationship Diagram (logical)
```
auth.users (Supabase)
   │ 1
   │
   │ N
profiles
   │ 1
   │   ┌───────────────────────────┐
   │ N │                           │
   ▼   ▼                           ▼
transactions   debts        sources, goals
   │ N         (independent)       (catalog per profile)
   │
   │ uses
   ▼
sources / goals (by id reference)
```

### 7.2 Entities

**UserProfile** (table: `profiles`)
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK auth.users) | RLS guard |
| name | text | |
| avatar_color | text | hex/hsl string |
| initial | text(1-2) | derive từ name |
| created_at | timestamptz | |

**Transaction** (table: `transactions`)
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| profile_id | uuid (FK profiles) | RLS guard |
| type | enum('income','expense') | |
| title | text | required, 1–100 chars |
| amount | bigint | VNĐ integer, > 0 |
| source | text | FK logical → sources.id |
| goal | text | FK logical → goals.id |
| note | text | optional, ≤ 500 chars |
| date | timestamptz | ISO |
| created_at | timestamptz | |

**Debt** (table: `debts`)
| Field | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| profile_id | uuid (FK profiles) | |
| type | enum('owe','lend') | |
| person | text | required |
| amount | bigint | > 0 |
| note | text | optional |
| due_date | date | nullable |
| settled | boolean | default false |
| settled_at | timestamptz | nullable |
| created_at | timestamptz | |

**Source** (table: `sources`)
| Field | Type | Notes |
|---|---|---|
| id | text (PK) | string id, e.g. 'bank' hoặc uuid |
| profile_id | uuid (FK profiles) | |
| label | text | |
| icon | text | tên Lucide icon |
| is_builtin | boolean | true nếu nằm trong DEFAULT_SOURCES |
| created_at | timestamptz | |

**Goal** (table: `goals`)
| Field | Type | Notes |
|---|---|---|
| id | text (PK) | |
| profile_id | uuid (FK profiles) | |
| label | text | |
| icon | text | |
| is_builtin | boolean | |
| sort_order | int | |
| created_at | timestamptz | |

### 7.3 LocalStorage keys
| Key | Mô đun | Mô tả |
|---|---|---|
| `viapp_current_{userId}` | app-store | Profile đang active (per auth user) |
| `viapp_current` (legacy) | app-store | Fallback cũ |
| `viapp_removed_sources_{profileId}` | storage.ts | Default source IDs đã bị user xoá |
| `viapp_removed_goals_{profileId}` | storage.ts | Default goal IDs đã bị user xoá |
| `viapp_tour_seen` | page.tsx | Flag đã xem walkthrough |

### 7.4 Derived values (KHÔNG persist)
```text
monthlyIncome(m,y)  = Σ tx.amount WHERE type='income'  AND month(tx.date)=m AND year(tx.date)=y
monthlyExpense(m,y) = Σ tx.amount WHERE type='expense' AND month(tx.date)=m AND year(tx.date)=y
monthlyBalance(m,y) = monthlyIncome - monthlyExpense

sourceBalance(s)    = Σ income[source=s] - Σ expense[source=s]    -- all-time, có thể âm → hiển thị 0
goalBalance(g)      = Σ income[goal=g]   - Σ expense[goal=g]      -- all-time

totalOwe       = Σ debt.amount WHERE type='owe'  AND settled=false
totalLend      = Σ debt.amount WHERE type='lend' AND settled=false
totalSettled   = Σ debt.amount WHERE settled=true
```

---

## 8. Business Rules (BR)

| ID | Rule |
|---|---|
| BR-01 | Mỗi auth user có tối đa 5 profile. |
| BR-02 | Profile cuối cùng không thể bị xoá. |
| BR-03 | Goal `'none'` (Chưa phân loại) là PROTECTED — không thể xoá. |
| BR-04 | Khi xoá source/goal có transaction reference → reassign, KHÔNG xoá transaction. |
| BR-05 | Reassign source fallback chọn source khác đầu tiên (theo `pickFallbackSourceId`). Reassign goal → luôn về `'none'`. |
| BR-06 | Debt không cộng vào thu/chi tháng, dù settled hay không. |
| BR-07 | `amount` luôn lưu là số nguyên dương (VNĐ không có hệ thập phân thực tế). |
| BR-08 | Số tiền hiển thị âm → clamp về `0 ₫` (đối với balance hiển thị, KHÔNG cho transaction). |
| BR-09 | Transaction sắp xếp mặc định: `date DESC`. |
| BR-10 | Tất cả mutation phải có optimistic update + rollback nếu DB fail. (Hiện tại: insert-then-set; cần improve về rollback.) |
| BR-11 | Default catalog chỉ seed khi `createProfile`. KHÔNG seed lại khi default IDs đã từng bị xoá. |
| BR-12 | Khi user đổi sang account khác (login overlay) → state cũ phải bị wipe trước khi `initApp` mới. |
| BR-13 | FAB context-aware: tab Debts → 1 nút "Ghi nợ"; các tab khác → 2 nút "Thu nhập" / "Chi tiêu". |
| BR-14 | Walkthrough tour tự động chỉ trigger 1 lần (flag `viapp_tour_seen`). |

---

## 9. State Machines

### 9.1 Debt lifecycle
```
[Created] ──settle()──▶ [Settled]
   ▲                       │
   │                       │ unsettle() (optional, qua update form)
   └───────────────────────┘
                │
                ▼
            [Deleted]  (terminal)
```

### 9.2 Transaction lifecycle
```
[Draft (in form)] ──save──▶ [Persisted]
                                 │
                                 ├──edit──▶ [Persisted]  (update)
                                 │
                                 └──delete──▶ [Deleted]   (terminal)
```

### 9.3 App load sequence
```
mount
  │
  ▼
initAuth()
  │
  ├── no user ──▶ <LoginScreen>
  │
  └── user exists ──▶ initApp()
                          │
                          ├── 0 profiles ──▶ <OnboardingScreen>
                          │
                          └── ≥ 1 profile ──▶ load active profile data ──▶ <Dashboard>
                                                       │
                                                       └── 0 transactions + tour-not-seen
                                                            ──▶ auto-open <WalkthroughTour>
```

---

## 10. Validation Rules

### 10.1 TransactionForm
| Field | Rule | Error message |
|---|---|---|
| title | required, 1–100 chars | "Vui lòng nhập nội dung" |
| amount | required, integer > 0, ≤ 999.999.999.999 | "Số tiền không hợp lệ" |
| source | required (1 trong customSources) | "Chọn nguồn tiền" |
| goal | required (default 'none') | — |
| date | required, valid ISO | "Ngày không hợp lệ" |
| note | optional, ≤ 500 chars | "Ghi chú quá dài" |

### 10.2 DebtForm
| Field | Rule |
|---|---|
| type | required, 'owe' \| 'lend' |
| person | required, ≥ 1 char |
| amount | required, > 0 |
| dueDate | optional, valid ISO date |
| note | optional |

### 10.3 ProfileForm (onboarding & add)
| Field | Rule |
|---|---|
| name | required, ≥ 1 char, ≤ 50 chars, trim |

### 10.4 AddSource / AddBudget
| Field | Rule |
|---|---|
| label | required, ≥ 1 char, ≤ 30 chars; KHÔNG trùng label khác (case-insensitive) |
| icon | required, là tên Lucide icon hợp lệ |

---

## 11. Edge Cases & Empty States

### 11.1 Empty States
| Ngữ cảnh | Icon | Title | Subtitle |
|---|---|---|---|
| Transactions list trống | `Receipt` | "Chưa có giao dịch nào" | "Nhấn + để thêm giao dịch đầu tiên" |
| Goals trống | `Target` | "Chưa có dữ liệu mục tiêu" | "Phân loại giao dịch theo mục tiêu khi thêm mới" |
| Debts trống (open) | `Handshake` | "Chưa có khoản nợ nào" | "Nhấn + Ghi nợ để thêm" |
| Debts trống (settled) | `Handshake` | "Chưa có khoản nợ đã xử lý" | — |
| Dashboard recent trống | `Inbox` | "Không có giao dịch trong tháng này" | — |

### 11.2 Edge cases cần xử lý
1. **Balance âm**: `sourceBalance < 0` hoặc `goalBalance < 0` → hiển thị `0 ₫`.
2. **Title quá dài**: truncate 1 dòng + ellipsis, tooltip nếu desktop.
3. **Note dài**: truncate 1 dòng trong list, full text khi mở edit.
4. **Profile có 0 transaction**: dashboard hiển thị empty states tất cả widget, không crash.
5. **localStorage full**: catch QuotaExceededError → toast warning, app vẫn chạy với in-memory state.
6. **Mất mạng giữa chừng khi save**: thông báo lỗi, KHÔNG đưa optimistic record vào state (hiện tại behavior: throw từ store).
7. **Cross-user state bleed**: khi đổi user qua login overlay → `useAppStore.setState({ profiles:[], currentProfileId:null, transactions:[], debts:[], ... isLoaded:false })` rồi mới `initApp`.
8. **Profile bị xoá trong khi đang active**: switch sang profile đầu tiên còn lại.
9. **Tháng tương lai**: cho phép chọn — vẫn hiển thị 0 (không filter từ tương lai trở về quá khứ).
10. **Lịch âm**: dùng thư viện `lunar-javascript` — fallback gracefully nếu lib fail.
11. **Số tiền cực lớn (~ tỷ tỷ)**: validate max 999,999,999,999 (≈ 1 nghìn tỷ — đủ thực tế).
12. **Duplicate label custom source/goal**: kiểm tra case-insensitive, reject với toast.

---

## 12. Tích hợp & Phụ thuộc bên ngoài

| Service | Mục đích | Critical? |
|---|---|---|
| **Supabase** | DB, Auth, RLS | YES — app không chạy được nếu Supabase down |
| **Google Tag Manager (GTM)** | Analytics container | NO |
| **Microsoft Clarity** | Heatmap & session replay | NO |
| **Google Search Console** | SEO verification | NO |
| **lunar-javascript** | Convert dương → âm cho Calendar | NO (fallback acceptable) |
| **Lucide React** | Icon library | YES (chỉ frontend) |
| **shadcn/ui** | Component library nguồn | YES (build-time only) |

### 12.1 Dependency sống/chết
- Mất Supabase → app báo lỗi auth/data, user thấy spinner mãi mãi (cần improve: timeout + error screen).
- Mất GTM/Clarity → app vẫn chạy bình thường.

---

## 13. Phân tích bảo mật & quyền truy cập

### 13.1 Auth boundary
- Client-side check (`useAuthStore`) **chỉ là UX**.
- Bảo mật thực sự nằm ở **Supabase Row Level Security (RLS)**:
  - `profiles`: chỉ SELECT/UPDATE/DELETE khi `user_id = auth.uid()`.
  - `transactions`, `debts`, `sources`, `goals`: chỉ thao tác khi `profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())`.

### 13.2 Threats & mitigations
| Threat | Mitigation |
|---|---|
| Direct API call bypass UI | RLS database-level |
| XSS qua title/note | React tự escape; KHÔNG dùng `dangerouslySetInnerHTML` |
| Session hijack | Supabase JWT, refresh token rotation |
| Cross-user data bleed sau login mới | Explicit state wipe trước `initApp` |
| LocalStorage tampering | Không tin localStorage cho dữ liệu nhạy cảm; chỉ lưu preference (`currentProfileId`, `tour_seen`) |

### 13.3 Privacy
- KHÔNG bao giờ log số tiền/title transaction ra console ở production.
- Analytics (GTM/Clarity) KHÔNG được track giá trị tiền — chỉ event meta (form opened, tab switched).

---

## 14. Báo cáo & chỉ số dẫn xuất

### 14.1 Báo cáo tự động (in-app)
- **SummaryCards**: per-month income/expense/balance.
- **SourceBlocks**: all-time per-source balance.
- **GoalBlocks**: all-time per-goal balance + % proportion.
- **DebtStats**: open owe / open lend / total settled.
- **ExpenseHeatmap**: daily expense intensity trong tháng.
- **CalendarBlock**: ngày nào có transaction (chấm chỉ báo).

### 14.2 Báo cáo tương lai (Phase 2)
- Spending breakdown by goal/source (donut chart).
- Trend chart 6/12 tháng gần đây.
- Predicted month-end balance (rule-based).
- Export CSV: tất cả transaction + debt của 1 profile.

### 14.3 Analytics events khuyến nghị track
| Event | Mô tả |
|---|---|
| `signup_completed` | User hoàn tất đăng ký |
| `onboarding_completed` | Tạo profile đầu tiên |
| `tx_created` | type, source_kind (default/custom), goal_kind |
| `debt_created` | type |
| `debt_settled` | — |
| `profile_switched` | — |
| `tour_opened`/`tour_completed` | — |
| `month_changed` | direction (prev/next/picker) |

---

## 15. Phụ lục — Glossary

| Thuật ngữ | Định nghĩa |
|---|---|
| **Auth User** | Tài khoản đăng nhập Supabase (1 email = 1 auth user). |
| **Profile** | Hồ sơ ví. 1 auth user có thể có nhiều profile, dữ liệu cách ly. |
| **Source** (Nguồn tiền) | Nơi tiền nằm: Ngân hàng, Tiền mặt, MoMo, custom… |
| **Goal** (Mục tiêu) | Quỹ phân loại: Tiết kiệm, Du lịch, Sắp dùng, Chưa phân loại, custom… |
| **PROTECTED_GOAL_ID** | `'none'` — goal "Chưa phân loại", không xoá được. |
| **Catalog** | Tập hợp Source + Goal đang active của 1 profile. |
| **Default catalog** | `DEFAULT_SOURCES` + `DEFAULT_GOALS` seed khi tạo profile. |
| **Custom Source/Goal** | Do user tự thêm. |
| **Removed defaults** | Default ID đã bị user xoá; lưu localStorage để không re-seed. |
| **Reassign** | Khi xoá Source/Goal có transaction → transactions được update sang fallback. |
| **Debt** | Khoản nợ. `type=owe` = tôi nợ; `type=lend` = họ nợ tôi. |
| **Settle** | Đánh dấu debt đã xử lý xong. |
| **FAB** | Floating Action Button — context-aware ở bottom screen mobile. |
| **Walkthrough tour** | Tour onboard tự động cho user mới. |
| **Page transition** | Fade + slight translateY khi đổi tab/tháng. |
| **Lunar / Âm lịch** | Lịch âm, hiển thị song song trong CalendarBlock. |

---

## 16. Truy vết yêu cầu (Traceability)

| FR | Components / Files chính | Tests gợi ý |
|---|---|---|
| FR-1 Auth | `LoginScreen`, `auth-store.ts`, `app/page.tsx` (init effect) | login OK, login fail, logout, session expire, switch account wipe state |
| FR-2 Profile | `OnboardingScreen`, `ProfileSwitcher`, `AddProfileSheet`, `app-store.createProfile/switchProfile/deleteProfile` | create, switch, delete, last-profile-protect, max-5 |
| FR-3 Catalog | `AddSourceSheet`, `AddBudgetSheet`, `app-store.{add,update,remove}{CustomSource,CustomBudget}`, `catalog.ts`, `catalog-policy.ts` | add, edit, remove with reassign, protected goal, last-source-protect |
| FR-4 Transaction | `TransactionForm`, `TransactionList`, `TransactionItem`, `app-store.{add,update,delete}Transaction` | create, edit, delete, validation, shortcuts |
| FR-5 Debt | `DebtForm`, `DebtCard`, `DebtStats`, `app-store.{add,update,settle,delete}Debt` | create, settle, unsettle, filter open/settled |
| FR-6 Dashboard | `SummaryCards`, `SourceBlocks`, `GoalBlocks`, `CalendarBlock`, `ExpenseHeatmap`, `MonthSelector` | month change, empty states, calculation correctness |
| FR-7 TxTab | `TransactionPane`, `TransactionList` | search, edit click, empty |
| FR-8 GoalsTab | `GoalOverview` | empty, group by goal |
| FR-9 DebtsTab | `DebtStats`, filter tabs | filter switch, empty per state |
| FR-10 FTUE | `WalkthroughTour`, `OnboardingScreen`, FAB pulse logic in `app/page.tsx` | first-open trigger, manual re-open, flag persistence |

---

*Tài liệu BA này được duy trì song song với code. Mọi feature mới phải bổ sung mục FR + BR + Use Case tương ứng trước khi merge.*
