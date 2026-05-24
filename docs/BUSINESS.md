# Vislet — Tài liệu Kinh doanh (Business Document)

> **Phiên bản:** 1.0
> **Ngày cập nhật:** 2026-05-22
> **Phạm vi:** Tài liệu kinh doanh tổng thể cho sản phẩm Vislet (tiền thân: ví.app) — ứng dụng quản lý tài chính cá nhân mobile-first.
> **Đối tượng đọc:** Founders, investors, product leaders, marketing, partners, stakeholders.

---

## 1. Tóm tắt điều hành (Executive Summary)

**Vislet** là một ứng dụng web (PWA-ready) quản lý tài chính cá nhân được thiết kế **mobile-first**, tối ưu cho người dùng Việt Nam. Sản phẩm giúp người dùng theo dõi thu nhập, chi tiêu, phân bổ mục tiêu tài chính (tiết kiệm/du lịch/sắp dùng), quản lý các khoản nợ/cho vay cá nhân, và quan sát dòng tiền theo lịch (calendar) lẫn theo tháng.

Điểm khác biệt cốt lõi:

- **Mobile-first thực sự**: thiết kế cho viewport 375px trước, scale lên tablet/desktop. Không phải web desktop "thu nhỏ".
- **Đa hồ sơ (multi-profile)** trong cùng một tài khoản: cho phép một người dùng quản lý nhiều "ví" (cá nhân, gia đình, dự án) — hoặc nhiều thành viên trong gia đình dùng chung 1 tài khoản với dashboard riêng biệt.
- **Tách bạch "Nợ" và "Thu chi"**: hai dòng dữ liệu hoàn toàn độc lập, tránh làm nhiễu báo cáo dòng tiền tháng.
- **Trải nghiệm gọn — không quảng cáo — không gamification rẻ tiền**: thiết kế tối giản, light-mode-only, palette xanh lá pastel, font Be Vietnam Pro, định dạng tiền VNĐ chuẩn `vi-VN`.
- **Định hướng Việt Nam**: ngôn ngữ tiếng Việt 100%, hiểu nguồn tiền địa phương (MoMo, Ngân hàng, Tiền mặt), lịch âm/dương song hành trong Calendar.

---

## 2. Tầm nhìn & Sứ mệnh

### 2.1 Tầm nhìn (Vision)
Trở thành **trợ lý tài chính cá nhân hàng ngày** mặc định của người dùng Việt Nam trong 5 năm — một nơi ai cũng mở ra vài lần mỗi ngày để ghi và đọc dòng tiền của chính mình.

### 2.2 Sứ mệnh (Mission)
Giúp người Việt **chủ động** với tiền của mình bằng một công cụ:
- Đủ nhanh để ghi giao dịch trong 5 giây.
- Đủ rõ để nhìn dòng tiền tháng trong 1 cái liếc.
- Đủ riêng tư để không bao giờ cần kết nối ngân hàng.

### 2.3 Giá trị cốt lõi (Core Values)
1. **Privacy-first** — dữ liệu thuộc về người dùng. Không scraping ngân hàng, không bán dữ liệu.
2. **Simplicity** — mỗi tính năng phải có lý do tồn tại; cắt bỏ thay vì cộng dồn.
3. **Vietnamese-native** — không phải bản dịch từ app nước ngoài.
4. **Calm UI** — không thông báo đỏ chói, không "bạn đã tiêu nhiều quá!". App là công cụ, không phải huấn luyện viên.

---

## 3. Vấn đề & Cơ hội thị trường

### 3.1 Bối cảnh
Người Việt Nam đang trải qua giai đoạn chuyển dịch mạnh sang **cashless** (MoMo, ZaloPay, ViettelPay, ngân hàng số), nhưng:
- Phần lớn dân số **không có thói quen ghi chép chi tiêu** chính thức.
- Các app ngân hàng chỉ cho thấy giao dịch của **một** tài khoản — không cộng hợp được tiền mặt + ví điện tử + tài khoản nhiều ngân hàng.
- Các app quốc tế (Mint, YNAB, Wallet by BudgetBakers...) không hiểu ngữ cảnh Việt: không có MoMo, không có "lì xì", không có "tiền mừng cưới", không định dạng VNĐ chuẩn, UI dày đặc tính năng pro.

### 3.2 Vấn đề người dùng (Pain Points)
| # | Pain point | Hệ quả |
|---|---|---|
| P1 | Không biết tháng này tiêu hết bao nhiêu | Mất kiểm soát ngân sách |
| P2 | Tiền mặt + MoMo + ngân hàng tách rời, không biết tổng số dư | Khó ra quyết định chi tiêu lớn |
| P3 | Cho bạn mượn tiền nhưng quên không thu lại | Mất tiền + mất quan hệ |
| P4 | Muốn tiết kiệm nhưng không biết đang tiết kiệm được bao nhiêu | Mục tiêu không rõ ràng |
| P5 | Vợ chồng/người yêu muốn dùng chung dashboard mà vẫn riêng dữ liệu | Phải dùng 2 app khác nhau |
| P6 | App nước ngoài đẹp nhưng không có MoMo, không hiểu tiếng Việt | Bỏ dùng sau vài ngày |

### 3.3 Cơ hội thị trường (TAM/SAM/SOM)
- **TAM (Total Addressable Market):** ~70 triệu người Việt Nam trên 16 tuổi có smartphone (~2026).
- **SAM (Serviceable Available Market):** ~25–30 triệu người thuộc tầng lớp đô thị, có thu nhập, đã quen với app fintech (MoMo, ngân hàng số).
- **SOM (Serviceable Obtainable Market) — 3 năm:** Mục tiêu 500.000 – 1.000.000 MAU, ưu tiên Gen Z + Millennials đô thị.

---

## 4. Người dùng mục tiêu (Target Persona)

### 4.1 Persona chính: "Linh — 26 tuổi, nhân viên văn phòng Hà Nội"
- **Thu nhập:** 18–25 triệu/tháng, lương qua ngân hàng + freelance qua MoMo.
- **Hành vi:** Trả tiền cà phê qua MoMo, đi chợ trả tiền mặt, mua online trả qua ngân hàng. Có ~3 thẻ ATM.
- **Mục tiêu cá nhân:** Tiết kiệm để mua xe máy mới (~50 triệu trong 12 tháng).
- **Pain chính:** Không biết tháng này còn dư bao nhiêu để rút ra tiết kiệm.
- **Why Vislet:** Ghi nhanh, không cần linking ngân hàng, có quỹ "Tiết kiệm" tách bạch.

### 4.2 Persona phụ 1: "Anh Tuấn — 35 tuổi, freelance designer"
- Thu nhập không đều, nhiều khoản nhỏ qua nhiều nguồn.
- Cần phân biệt rõ "tiền của tôi" vs "tiền khách ứng trước".
- Dùng Vislet với 2 profile: "Cá nhân" và "Công việc".

### 4.3 Persona phụ 2: "Chị Hương — 31 tuổi, đã có gia đình"
- Quản lý chi tiêu gia đình: con + chợ + tiền nhà + tiết kiệm dài hạn.
- Cho mượn tiền họ hàng thường xuyên → cần track debt.
- Cần dashboard chung để chia sẻ với chồng (qua profile switch trong 1 account chung).

### 4.4 Anti-persona (KHÔNG phải target)
- **Investor/Trader chuyên nghiệp**: cần app theo dõi danh mục đầu tư — không phải Vislet.
- **SME/Business**: cần kế toán doanh nghiệp, hoá đơn VAT — không phải Vislet.
- **Power user budgeting**: thích YNAB-style zero-based budgeting với envelope chi tiết — Vislet cố tình đơn giản hơn.

---

## 5. Đề xuất giá trị (Value Proposition)

### 5.1 Tuyên ngôn giá trị
> **Vislet — ghi giao dịch trong 5 giây, hiểu dòng tiền trong 1 cái liếc.**

### 5.2 Bảng giá trị cho từng phân khúc
| Người dùng | Giá trị nhận được |
|---|---|
| Gen Z mới đi làm | Tracking đơn giản, không choáng ngợp, học cách quản lý tiền |
| Nhân viên văn phòng | Tổng hợp tiền mặt + MoMo + ngân hàng trong 1 view |
| Freelancer | Multi-profile để tách "cá nhân" vs "công việc" |
| Gia đình trẻ | Chia sẻ tài khoản, theo dõi quỹ tiết kiệm chung |
| Người hay cho mượn tiền | Sổ nợ độc lập với reminder ngày hẹn trả |

### 5.3 Tại sao chọn Vislet thay vì giải pháp khác?
| Lựa chọn thay thế | Hạn chế | Vislet giải quyết |
|---|---|---|
| Excel / Google Sheets | Phải tự build, không mobile-friendly | Form 5 giây, mobile-first |
| App ngân hàng | Chỉ thấy 1 tài khoản | Tổng hợp đa nguồn |
| MoMo Sổ chi tiêu | Bị giới hạn trong hệ MoMo | Độc lập, đa nguồn |
| Money Lover / Misa | UI dày đặc, ads, paywall sớm | Tối giản, free core |
| Notion/Apple Notes | Không có report tự động | Auto calc, charts |

---

## 6. Mô hình sản phẩm (Product Model)

### 6.1 Phạm vi MVP
Tính năng đã/đang triển khai:
- ✅ Auth (Supabase Auth — email/password, có thể mở rộng OAuth)
- ✅ Multi-profile per account (max 5 profile, dữ liệu cách ly hoàn toàn)
- ✅ Transactions: thu nhập / chi tiêu, gán **nguồn tiền** + **mục tiêu**
- ✅ Custom catalog: người dùng tự thêm/sửa/xóa **nguồn tiền** & **mục tiêu** (không bị giới hạn 3 default)
- ✅ Debts: ghi nợ "tôi nợ" / "họ nợ tôi" với due date, settle/unsettle
- ✅ Dashboard: SummaryCards, SourceBlocks, GoalBlocks, Calendar (lịch âm), Expense Heatmap
- ✅ Month filter & navigation
- ✅ Walkthrough tour cho user mới
- ✅ Light mode, palette pastel xanh lá, font Be Vietnam Pro
- ✅ Empty states, skeleton loading, page transition
- ✅ GTM, Microsoft Clarity, Google Search Console verification (analytics)

### 6.2 Roadmap (tham khảo, không cam kết)
**Quý gần (Q2–Q3 2026):**
- Recurring transactions (lương hàng tháng, thuê nhà…)
- Export CSV / Excel
- Cải thiện onboarding (sample data, video tutorial)
- PWA install prompt + offline-first cache

**Trung hạn (Q4 2026 – Q1 2027):**
- Budget alerts (cảnh báo gần chạm ngân sách tháng)
- Goal tracking nâng cao (target amount + deadline + auto-suggestion)
- Shared profile (cùng 1 profile, nhiều tài khoản truy cập)
- iOS/Android native wrapper (Capacitor)

**Dài hạn:**
- Mở API cho 3rd-party (sao kê ngân hàng → import)
- Bảng phân tích AI (insight tự nhiên: "Tháng này bạn tiêu cà phê 800k, +25% so với tháng trước")
- Premium tier

---

## 7. Mô hình kinh doanh (Business Model)

### 7.1 Mô hình doanh thu (đề xuất)
**Freemium two-tier:**

| Tier | Đặc điểm | Giá |
|---|---|---|
| **Free** (Core) | Tracking không giới hạn, 1 profile, đầy đủ chức năng cơ bản | Miễn phí |
| **Vislet Plus** | Multi-profile (tới 5), Recurring, Export, Goal nâng cao, Insights AI | ~29.000 – 49.000 VNĐ/tháng (≈ giá 1 ly cà phê) |

### 7.2 Nguyên tắc kiếm tiền
- **Không** chèn ads vào UI (giết trải nghiệm của persona target).
- **Không** bán dữ liệu (tuyên ngôn cốt lõi, là moat về niềm tin).
- **Không** paywall các tính năng tracking cơ bản — phải free vì đó là "essential utility".
- **Có** charge cho convenience & power features (multi-profile, automation, insights).

### 7.3 Đơn vị kinh tế (giả định, cần validate)
- ARPU mục tiêu năm 2: ~5.000 VNĐ/MAU (mix Free + Plus).
- CAC mục tiêu: < 20.000 VNĐ qua organic + referral.
- LTV/CAC ratio mục tiêu: ≥ 3.

---

## 8. Chiến lược Go-to-Market

### 8.1 Giai đoạn 1 — Beta đóng (0 → 1.000 users)
- Mời qua mạng cá nhân, Facebook group Gen Z, các cộng đồng tiết kiệm.
- Mục tiêu: feedback chất lượng, tỉ lệ retention D7 ≥ 25%.
- KPI chính: NPS, weekly active.

### 8.2 Giai đoạn 2 — Public beta (1k → 50k)
- Content marketing: blog tài chính cá nhân tiếng Việt SEO.
- Referral: "Mời 1 người bạn → unlock Plus 1 tháng".
- TikTok/Reels short-form: "5 cách dùng Vislet trong 30 giây".

### 8.3 Giai đoạn 3 — Tăng trưởng (50k → 500k+)
- Influencer fintech & lifestyle.
- Partnership với MoMo/ZaloPay (nếu có API import).
- ASO (App Store Optimization) khi có app native.

### 8.4 Kênh ưu tiên
1. **SEO** (đã có Google Search Console) — content "cách quản lý chi tiêu", "app ghi chép thu chi"…
2. **Word-of-mouth** — multi-profile khuyến khích chia sẻ trong gia đình.
3. **TikTok / Threads / Instagram** — short demo, không phải quảng cáo lộ liễu.

---

## 9. Đối thủ cạnh tranh

### 9.1 Bản đồ cạnh tranh
| Đối thủ | Mạnh | Yếu (so với Vislet) |
|---|---|---|
| **Money Lover** (VN) | Brand mạnh, đa nền tảng | UI nặng, nhiều ads ở free tier, không có multi-profile tự nhiên |
| **Misa Money Keeper** | Có sao kê SMS | UI cũ, hơi business-y |
| **MoMo Sổ chi tiêu** | Tích hợp MoMo native | Chỉ trong hệ MoMo, không tracking ngân hàng/tiền mặt |
| **Spendee / Wallet (BudgetBakers)** | Pro, đa quốc gia | Không hiểu VN, paywall sớm |
| **Notion templates** | Custom hoàn toàn | Không phải app, mobile experience tệ |

### 9.2 Lợi thế cạnh tranh bền vững (Moat)
1. **Trải nghiệm Việt** — ngôn ngữ, văn hoá, nguồn tiền địa phương.
2. **Multi-profile model** — đặc biệt hữu ích cho gia đình & freelancer, đối thủ chính chưa làm tốt.
3. **Design discipline** — light-mode, palette nhất quán, không ads — khó nhái vì cần kỷ luật.
4. **Privacy stance** — không bán data, không scraping → người dùng tin tưởng nhập đầy đủ.

---

## 10. Rủi ro & Phương án giảm thiểu

| Rủi ro | Mức độ | Mitigation |
|---|---|---|
| Người dùng quên ghi → bỏ app | Cao | Recurring tx, widget, notification nhẹ nhàng |
| Đối thủ lớn copy multi-profile | TB | Tốc độ + cộng đồng + brand quality |
| Chi phí Supabase tăng nhanh | TB | Tối ưu queries, RLS, eventual cache layer |
| Khó monetize do market price-sensitive | Cao | Bám free-core, charge convenience không cảm thấy "bắt buộc" |
| Vấn đề lòng tin về dữ liệu tài chính | Cao | Privacy policy rõ ràng, không bán dữ liệu, mở mã/audit nếu cần |
| Sự cố mất dữ liệu Supabase | Cao | Backup định kỳ, export CSV cho user, RPO ≤ 24h |

---

## 11. Chỉ số đo lường thành công (Key Metrics)

### 11.1 North Star Metric
**Số giao dịch được ghi mỗi tuần trên mỗi user hoạt động** (Weekly Transactions per WAU). Đây là metric phản ánh thực sự **app đang là một phần của thói quen hàng ngày** của user — không thể fake bằng acquisition.

Mục tiêu: ≥ 7 giao dịch/WAU (tức trung bình 1 giao dịch/ngày).

### 11.2 Metrics phụ
- **Acquisition:** New signups/tuần, organic %, channel mix.
- **Activation:** % user thêm giao dịch đầu tiên trong 24h (mục tiêu ≥ 60%).
- **Retention:** D1, D7, D30 retention. Mục tiêu D30 ≥ 35%.
- **Engagement:** sessions/week, avg session duration, tabs visited.
- **Revenue (khi launched Plus):** Free → Plus conversion %, MRR, churn.
- **Quality:** crash-free rate ≥ 99.5%, p95 page load < 2s trên 3G.

---

## 12. Đội ngũ & Phân vai (tham khảo)

- **Product / Design / Frontend:** 1–2 người (hiện tại owner-operator).
- **Backend / DevOps:** Supabase managed → ít cần.
- **Content / Marketing:** 1 người part-time cho SEO + social.
- **Customer Support:** community-led ban đầu (Facebook group, Discord/Zalo).

---

## 13. Định nghĩa thương hiệu (Brand)

- **Tên:** Vislet (tiền thân: ví.app — đã rebrand).
- **Nguồn gốc tên:** "Vis" gợi "vision/visible" (nhìn thấy) + "let" (gợi "wallet", nhỏ gọn).
- **Tagline đề xuất:** *"Ghi nhanh. Hiểu nhanh."* / *"Tài chính cá nhân, gọn như nó nên có."*
- **Tone of voice:**
  - Bình tĩnh, không hối thúc.
  - Thân thiện nhưng không suồng sã.
  - Tiếng Việt chuẩn, không lạm dụng từ Anh.
- **Visual identity:**
  - Primary color: pastel green `#3D9A6E`.
  - Font: Be Vietnam Pro (weights 300–700).
  - Logo: text-based, lowercase, hiền hoà.
  - Không dùng emoji trong UI chính.

---

## 14. Pháp lý & Tuân thủ (Compliance)

- **Dữ liệu cá nhân:** tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân (Việt Nam).
- **Không tự xưng là tổ chức tài chính** — Vislet là công cụ ghi chép, không phải đơn vị giữ tiền.
- **Không kết nối ngân hàng** ở MVP → giảm vùng pháp lý nhạy cảm.
- **Privacy Policy & Terms** phải có trước khi mở public.
- **Backup data ownership** — user có quyền export & xoá toàn bộ dữ liệu của mình.

---

## 15. Kết luận

Vislet đặt cược vào ba luận điểm:
1. Thị trường VN cần một app quản lý tài chính cá nhân **thực sự được làm cho VN**, không phải bản dịch.
2. **Multi-profile** là tính năng mà các app tracker hiện tại làm chưa tới — đó là wedge để thâm nhập gia đình & freelancer.
3. **Kỷ luật thiết kế** (calm UI, no ads, privacy) là moat về niềm tin — khó copy bằng cách tung tiền.

Nếu ba luận điểm này đúng, Vislet có cơ hội trở thành "app mở mỗi ngày" của một bộ phận đáng kể người Việt đô thị trong 3–5 năm tới.

---

*Tài liệu này được duy trì bởi đội ngũ Vislet. Mọi sửa đổi cần review và version bump.*
