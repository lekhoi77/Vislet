'use client';

import { useCallback, useMemo, useState } from 'react';
import { Transaction } from '@/lib/types';
import { formatVND, formatVNDShort } from '@/lib/format';

interface TrendStatsCardProps {
  transactions: Transaction[];
  month: number;
  year: number;
}

const X_TICKS_DESKTOP = [1, 5, 10, 15, 20, 25, 30];
const X_TICKS_MOBILE = [1, 10, 20, 30];
const WEEKDAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const CHART_W = 560;
const CHART_H = 188;
const PAD_L = 10;
const PAD_R = 10;
const PAD_T = 18;
const PAD_B = 30;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

function buildAreaPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  const baselineY = CHART_H - PAD_B;
  return `${buildSmoothPath(points)} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;
}

export function TrendStatsCard({ transactions, month, year }: TrendStatsCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const {
    dayCount,
    dailyExpense,
    avgPerDay,
    peakAmount,
    topWeekday,
    currentWeekAmount,
    previousWeekAmount,
  } = useMemo(() => {
    const dayCount = new Date(year, month, 0).getDate();
    const dailyExpense = Array.from({ length: dayCount }, () => 0);

    for (const tx of transactions) {
      if (tx.type !== 'expense') continue;
      const d = new Date(tx.date);
      if (d.getFullYear() !== year || d.getMonth() !== month - 1) continue;
      dailyExpense[d.getDate() - 1] += tx.amount;
    }

    const totalExpense = dailyExpense.reduce((sum, amount) => sum + amount, 0);
    const avgPerDay = dayCount > 0 ? totalExpense / dayCount : 0;

    let peakAmount = 0;
    for (let i = 0; i < dailyExpense.length; i += 1) {
      if (dailyExpense[i] > peakAmount) {
        peakAmount = dailyExpense[i];
      }
    }

    const weekdayTotals = Array.from({ length: 7 }, () => 0);
    for (let day = 1; day <= dayCount; day += 1) {
      const weekday = new Date(year, month - 1, day).getDay();
      weekdayTotals[weekday] += dailyExpense[day - 1];
    }
    let topWeekday = 0;
    for (let i = 1; i < weekdayTotals.length; i += 1) {
      if (weekdayTotals[i] > weekdayTotals[topWeekday]) topWeekday = i;
    }

    const startCurrentWeek = Math.max(0, dayCount - 7);
    const startPrevWeek = Math.max(0, dayCount - 14);
    const currentWeekAmount = dailyExpense.slice(startCurrentWeek).reduce((sum, value) => sum + value, 0);
    const previousWeekAmount = dailyExpense.slice(startPrevWeek, startCurrentWeek).reduce((sum, value) => sum + value, 0);

    return {
      dayCount,
      dailyExpense,
      avgPerDay,
      peakAmount,
      topWeekday,
      currentWeekAmount,
      previousWeekAmount,
    };
  }, [transactions, month, year]);

  const { points, path, areaPath, peakIndex } = useMemo(() => {
    const innerW = CHART_W - PAD_L - PAD_R;
    const innerH = CHART_H - PAD_T - PAD_B;
    const maxAmount = Math.max(1, ...dailyExpense);
    const points = dailyExpense.map((amount, idx) => {
      const x = PAD_L + (idx * innerW) / Math.max(1, dayCount - 1);
      const ratio = amount / maxAmount;
      const y = PAD_T + innerH - ratio * innerH;
      return { x, y, amount, day: idx + 1 };
    });

    let peakIndex = 0;
    for (let i = 1; i < points.length; i += 1) {
      if (points[i].amount > points[peakIndex].amount) peakIndex = i;
    }

    return {
      points,
      path: buildSmoothPath(points),
      areaPath: buildAreaPath(points),
      peakIndex,
    };
  }, [dailyExpense, dayCount]);

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;
  const hasExpenseData = peakAmount > 0;
  const tooltipLeftPct = hoveredPoint ? clamp((hoveredPoint.x / CHART_W) * 100, 18, 82) : 50;
  const tooltipTopPct = hoveredPoint ? clamp((hoveredPoint.y / CHART_H) * 100, 16, 86) : 50;
  const showTooltipBelow = hoveredPoint ? hoveredPoint.y < 48 : false;
  const pctDelta = previousWeekAmount <= 0
    ? (currentWeekAmount > 0 ? 100 : 0)
    : ((currentWeekAmount - previousWeekAmount) / previousWeekAmount) * 100;
  const isUp = pctDelta >= 0;

  const handlePointerMove = useCallback((clientX: number, left: number, width: number) => {
    if (points.length === 0) return;
    const ratio = clamp((clientX - left) / Math.max(1, width), 0, 1);
    const idx = Math.round(ratio * (points.length - 1));
    setHoveredIndex(idx);
  }, [points.length]);

  return (
    <section
      className="rounded-2xl border overflow-hidden p-4 md:p-5"
      style={{ background: 'var(--card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-overline mb-3">Xu hướng chi tiêu</p>
          <div className="relative">
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              className="w-full h-[170px] md:h-[220px]"
              role="img"
              aria-label="Biểu đồ xu hướng chi tiêu theo ngày trong tháng"
              onMouseLeave={() => setHoveredIndex(null)}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handlePointerMove(e.clientX, rect.left, rect.width);
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0];
                if (!touch) return;
                const rect = e.currentTarget.getBoundingClientRect();
                handlePointerMove(touch.clientX, rect.left, rect.width);
              }}
            >
              <defs>
                <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--orange)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--orange)" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {hoveredPoint && (
                <line
                  x1={hoveredPoint.x}
                  x2={hoveredPoint.x}
                  y1={PAD_T}
                  y2={CHART_H - PAD_B}
                  stroke="var(--border-strong)"
                  strokeDasharray="4 4"
                />
              )}

              <path d={areaPath} fill="url(#trendArea)" />
              <path d={path} fill="none" stroke="var(--orange)" strokeWidth={3} strokeLinecap="round" />

              {points[peakIndex] && (
                <circle
                  cx={points[peakIndex].x}
                  cy={points[peakIndex].y}
                  r={5.5}
                  fill="var(--card)"
                  stroke="var(--orange)"
                  strokeWidth={3}
                />
              )}

              {hoveredPoint && (
                <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r={4} fill="var(--orange)" />
              )}

              {X_TICKS_DESKTOP.filter((tick) => tick <= dayCount).map((tick) => {
                const x = PAD_L + ((tick - 1) * (CHART_W - PAD_L - PAD_R)) / Math.max(1, dayCount - 1);
                return (
                  <text
                    key={`desktop-${tick}`}
                    x={x}
                    y={CHART_H - 8}
                    textAnchor="middle"
                    className="hidden md:block"
                    style={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 600 }}
                  >
                    {tick}
                  </text>
                );
              })}
              {X_TICKS_MOBILE.filter((tick) => tick <= dayCount).map((tick) => {
                const x = PAD_L + ((tick - 1) * (CHART_W - PAD_L - PAD_R)) / Math.max(1, dayCount - 1);
                return (
                  <text
                    key={`mobile-${tick}`}
                    x={x}
                    y={CHART_H - 8}
                    textAnchor="middle"
                    className="md:hidden"
                    style={{ fontSize: 11, fill: 'var(--muted-foreground)', fontWeight: 600 }}
                  >
                    {tick}
                  </text>
                );
              })}

              {!hasExpenseData && (
                <text
                  x={CHART_W / 2}
                  y={(CHART_H - PAD_B + PAD_T) / 2}
                  textAnchor="middle"
                  style={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 500 }}
                >
                  Chưa có dữ liệu chi tiêu
                </text>
              )}
            </svg>

            {hoveredPoint && (
              <div
                className="absolute px-2.5 py-1.5 rounded-lg text-[12px] font-medium pointer-events-none whitespace-nowrap"
                style={{
                  left: `${tooltipLeftPct}%`,
                  top: `${tooltipTopPct}%`,
                  transform: showTooltipBelow
                    ? 'translate(-50%, 10px)'
                    : 'translate(-50%, calc(-100% - 10px))',
                  background: '#121212',
                  color: '#fff',
                }}
              >
                Ngày {hoveredPoint.day}: {formatVND(hoveredPoint.amount)}
              </div>
            )}
          </div>
        </div>

        <aside
          className="rounded-xl border p-3.5 flex flex-col gap-3.5"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-soft)' }}
        >
          <div>
            <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
              Trung bình/ngày
            </p>
            <p className="text-[23px] font-semibold leading-tight mt-1">{formatVND(Math.round(avgPerDay))}</p>
          </div>

          <div>
            <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
              Ngày tiêu nhiều nhất
            </p>
            <p className="text-[15px] font-semibold leading-tight mt-1">
              {WEEKDAY_NAMES[topWeekday]} - {formatVNDShort(peakAmount)}
            </p>
          </div>

          <div>
            <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
              So với tuần trước
            </p>
            <p
              className="text-[16px] font-semibold leading-tight mt-1"
              style={{ color: isUp ? 'var(--orange)' : 'var(--income)' }}
            >
              {isUp ? '▲' : '▼'} {Math.abs(pctDelta).toFixed(0)}%
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
