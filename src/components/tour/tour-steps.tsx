import React from 'react';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Wallet,
  Target,
  Plus,
  ArrowLeftRight,
  Handshake,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

export interface TourStep {
  id: string;
  selector: string | null;
  title: string;
  body: React.ReactNode;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  tab?: 'overview' | 'transactions' | 'goals' | 'debts';
  placement?: 'auto' | 'bottom' | 'top' | 'center';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    selector: null,
    title: 'Chào mừng tới Vislet 👋',
    icon: BookOpen,
    placement: 'center',
    body: (
      <>
        Vislet giúp bạn ghi lại thu chi, theo dõi mục tiêu và quản lý nợ một cách nhẹ nhàng.
        Mình sẽ dắt bạn đi 1 vòng (~30 giây) để làm quen các khu vực chính. Bạn có thể bỏ qua bất cứ lúc nào.
      </>
    ),
  },
  {
    id: 'summary',
    selector: '[data-tour="summary"]',
    title: 'Tổng quan tháng',
    icon: TrendingUp,
    tab: 'overview',
    body: (
      <>
        Ba thẻ này hiển thị <b>Thu</b>, <b>Chi</b> và <b>Số dư</b> của tháng đang chọn.
        Nhấn vào tên tháng ở trên để chuyển nhanh sang tháng khác.
      </>
    ),
  },
  {
    id: 'sources',
    selector: '[data-tour="sources"]',
    title: 'Nguồn tiền',
    icon: Wallet,
    tab: 'overview',
    body: (
      <>
        Mỗi nguồn (ví, ngân hàng, tiền mặt…) là nơi tiền chảy ra/vào.
        Nhấn <b>+ Thêm nguồn</b> để tạo nguồn riêng theo cách bạn quản lý tiền.
      </>
    ),
  },
  {
    id: 'goals',
    selector: '[data-tour="goals"]',
    title: 'Mục tiêu chi tiêu',
    icon: Target,
    tab: 'overview',
    body: (
      <>
        Phân loại chi tiêu theo mục tiêu (ăn uống, đi lại, tiết kiệm…).
        Mỗi giao dịch sẽ được gắn vào một mục tiêu để bạn biết tiền đi đâu.
      </>
    ),
  },
  {
    id: 'calendar',
    selector: '[data-tour="calendar"]',
    title: 'Lịch hoạt động',
    icon: CalendarIcon,
    tab: 'overview',
    body: (
      <>
        Mỗi ngày trong tháng. Chấm <span style={{ color: 'var(--income)' }}>●</span> là Thu,
        <span style={{ color: 'var(--orange)' }}> ●</span> là Chi,
        <span style={{ color: 'var(--expense)' }}> ●</span> là Nợ tới hạn.
        Mỗi giao dịch là 1 chấm — nhấn vào ngày để xem chi tiết.
      </>
    ),
  },
  {
    id: 'fab',
    selector: '[data-tour="fab"]',
    title: 'Thêm giao dịch nhanh',
    icon: Plus,
    tab: 'overview',
    placement: 'top',
    body: (
      <>
        Nhấn nút <b>+</b> tròn để ghi nhanh Thu hoặc Chi. Trên máy tính bạn có thể dùng
        <b> Ctrl+Alt+T</b> (thu) hoặc <b>Ctrl+Alt+E</b> (chi).
      </>
    ),
  },
  {
    id: 'tab-transactions',
    selector: '[data-tour="tab-transactions"]',
    title: 'Tab Giao dịch',
    icon: ArrowLeftRight,
    body: (
      <>
        Xem lại toàn bộ giao dịch theo tháng, sửa, xoá hoặc lọc theo loại. Mở tab này khi muốn rà soát chi tiết.
      </>
    ),
  },
  {
    id: 'tab-goals',
    selector: '[data-tour="tab-goals"]',
    title: 'Tab Mục tiêu',
    icon: Target,
    body: (
      <>
        Theo dõi mức chi theo từng mục tiêu, so với ngân sách bạn đặt. Giúp biết mục nào đang “vượt”.
      </>
    ),
  },
  {
    id: 'tab-debts',
    selector: '[data-tour="tab-debts"]',
    title: 'Tab Nợ',
    icon: Handshake,
    body: (
      <>
        Ghi các khoản cho vay / đi vay, gắn ngày đến hạn. Đến ngày, dấu chấm <span style={{ color: 'var(--expense)' }}>●</span> sẽ xuất hiện trên lịch.
      </>
    ),
  },
  {
    id: 'profile',
    selector: '[data-tour="profile"]',
    title: 'Hồ sơ & nhiều tài khoản',
    icon: LayoutDashboard,
    body: (
      <>
        Bạn có thể tạo nhiều hồ sơ (cá nhân, gia đình, kinh doanh…) — dữ liệu mỗi hồ sơ là riêng biệt. Đổi qua lại từ menu góc phải.
      </>
    ),
  },
  {
    id: 'guide',
    selector: '[data-tour="guide"]',
    title: 'Mở lại hướng dẫn',
    icon: BookOpen,
    body: (
      <>
        Bất cứ lúc nào cần xem lại, nhấn nút <b>sổ tay xanh</b> này trên thanh đầu. Chúc bạn dùng Vislet vui vẻ! 🎉
      </>
    ),
  },
];
