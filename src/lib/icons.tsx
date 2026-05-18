import React from 'react';
import {
  // Budget / Goal icons
  PiggyBank, ShoppingCart, Coffee, Car, Home, Heart,
  Briefcase, GraduationCap, Plane, Music, Dumbbell, Gift,
  Smartphone, Shirt, Baby, Utensils, Zap, Star,
  Gamepad2, BookOpen, Tv, Bus, Camera, Stethoscope,
  Leaf, Package, CreditCard, Scissors, Pencil, Wrench,
  // Source icons
  Building2, Wallet, Landmark, Bitcoin, Banknote,
  QrCode, Globe, Coins, CircleDollarSign, BadgeDollarSign,
  // Fallback
  CircleDot,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  // Budget / Goal
  PiggyBank, ShoppingCart, Coffee, Car, Home, Heart,
  Briefcase, GraduationCap, Plane, Music, Dumbbell, Gift,
  Smartphone, Shirt, Baby, Utensils, Zap, Star,
  Gamepad2, BookOpen, Tv, Bus, Camera, Stethoscope,
  Leaf, Package, CreditCard, Scissors, Pencil, Wrench,
  // Source
  Building2, Wallet, Landmark, Bitcoin, Banknote,
  QrCode, Globe, Coins, CircleDollarSign, BadgeDollarSign,
  // Fallback
  CircleDot,
};

type IconProps = { size?: number; className?: string; style?: React.CSSProperties };

export function BudgetIcon({ name, size = 16, className, style }: { name: string } & IconProps) {
  const Icon = ICON_MAP[name] ?? CircleDot;
  return <Icon size={size} className={className} style={style} />;
}

// Alias dùng chung cho cả source lẫn budget
export const AppIcon = BudgetIcon;

export const BUDGET_ICON_NAMES = [
  'PiggyBank','ShoppingCart','Coffee','Car','Home','Heart',
  'Briefcase','GraduationCap','Plane','Music','Dumbbell','Gift',
  'Smartphone','Shirt','Baby','Utensils','Zap','Star',
  'Gamepad2','BookOpen','Tv','Bus','Camera','Stethoscope',
  'Leaf','Package','CreditCard','Scissors','Pencil','Wrench',
];

export const SOURCE_ICON_NAMES = [
  'Building2','Wallet','Smartphone','Landmark','Banknote',
  'CreditCard','QrCode','Bitcoin','Coins','CircleDollarSign',
  'BadgeDollarSign','Globe','PiggyBank','Briefcase','CircleDot',
];
