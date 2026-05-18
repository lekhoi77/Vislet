import React from 'react';
import {
  PiggyBank, ShoppingCart, Coffee, Car, Home, Heart,
  Briefcase, GraduationCap, Plane, Music, Dumbbell, Gift,
  Smartphone, Shirt, Baby, Utensils, Zap, Star,
  Gamepad2, BookOpen, Tv, Bus, Camera, Stethoscope,
  Leaf, Package, CreditCard, Scissors, Pencil, Wrench,
  CircleDot,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  PiggyBank, ShoppingCart, Coffee, Car, Home, Heart,
  Briefcase, GraduationCap, Plane, Music, Dumbbell, Gift,
  Smartphone, Shirt, Baby, Utensils, Zap, Star,
  Gamepad2, BookOpen, Tv, Bus, Camera, Stethoscope,
  Leaf, Package, CreditCard, Scissors, Pencil, Wrench,
  CircleDot,
};

export function BudgetIcon({ name, size = 16, className, style }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
  const Icon = ICON_MAP[name] ?? CircleDot;
  return <Icon size={size} className={className} style={style} />;
}

export const BUDGET_ICON_NAMES = Object.keys(ICON_MAP).filter(k => k !== 'CircleDot');
