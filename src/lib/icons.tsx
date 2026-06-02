import React from 'react';
import {
  // ── Category icons (curated) ──
  // Food & drink
  Utensils, UtensilsCrossed, Coffee, Beer, Pizza, IceCream, Soup, CakeSlice,
  // Transport
  Car, Bus, Bike, Plane, Fuel, TrainFront, Ship,
  // Home & bills
  Home, BedDouble, Lightbulb, Droplet, Wifi, Flame, Plug,
  // Shopping & clothes
  ShoppingCart, ShoppingBag, Shirt, Footprints,
  // Health
  Stethoscope, Pill, HeartPulse,
  // Education
  GraduationCap, BookOpen, NotebookPen,
  // Entertainment
  Gamepad2, Music, Film, Ticket, PartyPopper, Tv,
  // Personal care
  Scissors, Sparkles, Bath, Smile,
  // Family & pets
  Baby, Heart, PawPrint, Users,
  // Finance
  PiggyBank, TrendingUp, Bitcoin, CreditCard, Coins,
  // Work & travel
  Briefcase, Laptop, Luggage, Hotel, MapPin,
  // Misc
  Gift, Package, Wrench, Dumbbell, Tag,

  // ── Legacy category icons (kept for backward-compat with existing user data) ──
  Camera, Leaf, Star, Zap, Pencil,

  // ── Source icons ──
  Building2, Wallet, Smartphone, Landmark, Banknote,
  QrCode, Globe, CircleDollarSign, BadgeDollarSign,

  // ── Goal extras ──
  Clock,

  // ── Fallback ──
  CircleDot,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  // Food & drink
  Utensils, UtensilsCrossed, Coffee, Beer, Pizza, IceCream, Soup, CakeSlice,
  // Transport
  Car, Bus, Bike, Plane, Fuel, TrainFront, Ship,
  // Home & bills
  Home, BedDouble, Lightbulb, Droplet, Wifi, Flame, Plug,
  // Shopping & clothes
  ShoppingCart, ShoppingBag, Shirt, Footprints,
  // Health
  Stethoscope, Pill, HeartPulse,
  // Education
  GraduationCap, BookOpen, NotebookPen,
  // Entertainment
  Gamepad2, Music, Film, Ticket, PartyPopper, Tv,
  // Personal care
  Scissors, Sparkles, Bath, Smile,
  // Family & pets
  Baby, Heart, PawPrint, Users,
  // Finance
  PiggyBank, TrendingUp, Bitcoin, CreditCard, Coins,
  // Work & travel
  Briefcase, Laptop, Luggage, Hotel, MapPin,
  // Misc
  Gift, Package, Wrench, Dumbbell, Tag,
  // Legacy (still rendered if referenced by old data)
  Camera, Leaf, Star, Zap, Pencil,
  // Source
  Building2, Wallet, Smartphone, Landmark, Banknote,
  QrCode, Globe, CircleDollarSign, BadgeDollarSign,
  Clock,
  CircleDot,
};

type IconProps = { size?: number; className?: string; style?: React.CSSProperties };

export function CategoryIcon({ name, size = 16, className, style }: { name: string } & IconProps) {
  const Icon = ICON_MAP[name] ?? CircleDot;
  return <Icon size={size} className={className} style={style} />;
}

// Alias dùng chung cho cả source lẫn category
export const AppIcon = CategoryIcon;

// Icon hay dùng nhất — hiển thị mặc định trong picker (hàng đầu)
export const CATEGORY_ICON_NAMES_POPULAR = [
  'Utensils','Coffee','ShoppingCart','Car','Home',
  'Stethoscope','GraduationCap','Gamepad2','Music','Plane',
  'PiggyBank','Briefcase','Heart','Baby','Gift',
  'Wifi','Fuel','Scissors',
];

// Danh sách hiển thị trong picker — đã được biên tập theo nhóm chi tiêu thực tế ở VN.
// Thứ tự xếp theo cụm chủ đề để người dùng quét mắt dễ tìm.
export const CATEGORY_ICON_NAMES = [
  // Ăn uống
  'Utensils','UtensilsCrossed','Coffee','Beer','Pizza','IceCream','Soup','CakeSlice',
  // Đi lại
  'Car','Bus','Bike','Plane','Fuel','TrainFront','Ship',
  // Nhà cửa & hoá đơn
  'Home','BedDouble','Lightbulb','Droplet','Wifi','Flame','Plug',
  // Mua sắm & quần áo
  'ShoppingCart','ShoppingBag','Shirt','Footprints',
  // Sức khoẻ
  'Stethoscope','Pill','HeartPulse',
  // Giáo dục
  'GraduationCap','BookOpen','NotebookPen',
  // Giải trí
  'Gamepad2','Music','Film','Ticket','PartyPopper','Tv',
  // Cá nhân
  'Scissors','Sparkles','Bath','Smile',
  // Gia đình & thú cưng
  'Baby','Heart','PawPrint','Users',
  // Tài chính
  'PiggyBank','TrendingUp','Bitcoin','CreditCard','Coins',
  // Công việc & du lịch
  'Briefcase','Laptop','Luggage','Hotel','MapPin',
  // Khác
  'Gift','Package','Wrench','Dumbbell','Tag',
];

export const SOURCE_ICON_NAMES = [
  'Building2','Wallet','Smartphone','Landmark','Banknote',
  'CreditCard','QrCode','Bitcoin','Coins','CircleDollarSign',
  'BadgeDollarSign','Globe','PiggyBank','Briefcase','CircleDot',
];
