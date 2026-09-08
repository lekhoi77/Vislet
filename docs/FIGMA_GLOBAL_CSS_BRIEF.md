# Vislet Global CSS Brief For Figma

Use this brief to recreate the current Vislet visual system from `src/app/globals.css`.
The goal is to produce a Figma design board and a few realistic responsive screens that match the current app feeling.

## Figma Agent Prompt

Recreate the current Vislet app visual system from the CSS tokens and behavior below.
Build a Figma board with:

- A design token page for color, typography, radius, spacing, shadows, motion, and surface styles.
- A mobile frame around 390 x 844.
- A desktop frame around 1440 x 900.
- Reusable component examples: primary button, secondary/outline/ghost button, input, card, bottom sheet/modal, tabs, badge/chip, floating action button, transaction item, dashboard stat card, calculator panel.
- A visual sample of the current page background with the soft green ambient glow.
- A finance dashboard screen that feels calm, soft, personal, mobile-first, and practical.

Keep the design close to the source:

- Soft pastel green primary brand color.
- Pastel orange as the expense/accent color.
- Light warm-gray page surfaces.
- Rounded UI with 8/12/16/20/24 px radii depending on scale.
- Lexend as the main font.
- Gentle shadows, low contrast borders, and small spring-like interaction states.
- Mobile-first layout: max 480 px app container on mobile; full width desktop layout.
- Bottom sheets on mobile become centered modal dialogs on desktop.

## Source Context

- Framework: Next.js 16, React 19.
- Styling: Tailwind CSS v4, shadcn/base-ui local components.
- UI source folder: `src/components/ui`.
- Global CSS source: `src/app/globals.css`.
- Border radius system: `docs/BORDER_RADIUS_SYSTEM.md`.
- Ambient image asset: `public/green-gradient.svg`.
- Logo asset: `public/logo.svg`.

## Typography

Main font:

```css
font-family: 'Lexend', sans-serif;
font-weights: 300, 400, 500, 600, 700;
```

Handwritten accent font:

```css
font-family: 'Caveat', cursive;
font-weights: 600, 700;
```

Base body:

```css
body {
  font-family: 'Lexend', sans-serif;
  color: var(--foreground);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Special display text:

```css
.user-name-hand {
  font-family: 'Caveat', cursive;
  font-weight: 700;
  letter-spacing: 0.01em;
  background: linear-gradient(92deg, var(--primary) 0%, #22c55e 38%, var(--orange) 100%);
  color: transparent;
}
```

Overline label:

```css
.text-overline {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted-foreground);
}
```

Amount / money text should use tabular numerals:

```css
.amount {
  font-variant-numeric: tabular-nums;
}
```

## Color Tokens

Use CSS values as source of truth. Figma may store these as named styles.

### Brand

```css
--primary: hsl(145, 45%, 42%);
--primary-foreground: hsl(0, 0%, 100%);
--primary-soft: hsl(145, 40%, 95%);
--primary-muted: hsl(145, 30%, 85%);
```

### Accent / Expense

```css
--orange: hsl(24, 90%, 58%);
--orange-foreground: hsl(0, 0%, 100%);
--orange-soft: hsl(28, 95%, 94%);
--orange-muted: hsl(26, 75%, 82%);
```

### Debt

```css
--debt: hsl(262, 60%, 55%);
--debt-soft: hsl(262, 60%, 95%);
```

### Background And Surfaces

```css
--background: #F9F9F9;
--background-subtle: #F9F9F9;
--page-bg: transparent;
--card: #F9F9F9;
--card-foreground: hsl(220, 15%, 15%);
--popover: hsl(0, 0%, 100%);
--popover-foreground: hsl(220, 15%, 12%);
```

Page background:

```css
background: linear-gradient(182deg, #FBFBFB 5.89%, #CAE4D1 98.53%);
```

### Neutral

```css
--foreground: hsl(220, 15%, 12%);
--muted-foreground: hsl(220, 8%, 46%);
--muted: hsl(220, 10%, 96%);
--border: hsl(220, 10%, 90%);
--border-subtle: hsl(220, 10%, 94%);
--input: hsl(220, 10%, 90%);
--ring: hsl(145, 45%, 42%);
```

### Secondary And Accent

```css
--secondary: hsl(220, 10%, 96%);
--secondary-foreground: hsl(220, 15%, 12%);
--accent: hsl(145, 40%, 95%);
--accent-foreground: hsl(145, 45%, 30%);
```

### Semantic

```css
--income: hsl(145, 55%, 38%);
--expense: hsl(24, 90%, 50%);
--up: hsl(145, 55%, 38%);
--down: hsl(0, 70%, 50%);
--destructive: hsl(0, 70%, 50%);
--destructive-foreground: hsl(0, 0%, 100%);
```

### Chart Colors

```css
--chart-1: hsl(145, 45%, 42%);
--chart-2: hsl(145, 55%, 38%);
--chart-3: hsl(0, 70%, 50%);
--chart-4: hsl(220, 10%, 60%);
--chart-5: hsl(220, 15%, 30%);
```

### Category Palette

From `src/lib/constants.ts`:

```css
blue: #3b82f6;
amber: #f59e0b;
emerald: #10b981;
rose: #f43f5e;
violet: #8b5cf6;
cyan: #06b6d4;
orange: #f97316;
lime: #84cc16;
pink: #ec4899;
teal: #14b8a6;
```

## Radius

Global Tailwind theme radius:

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-full: 9999px;
--radius: 0.75rem;
```

Usage guidance:

- Small buttons/chips: 8 to 12 px.
- Cards and sheets: 16 to 24 px.
- Pills and avatar/status chips: 9999 px.
- Main content card: 24 px.
- Desktop modal sheet: 16 px.

## Spacing

The app follows an 8 px grid with smaller 4 px steps:

```css
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
```

## Shadows

```css
--shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.04);
--shadow-md: 0 4px 12px rgba(16, 24, 40, 0.06);
--shadow-lg: 0 8px 24px rgba(16, 24, 40, 0.08);
--shadow-card: 0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 12px rgba(16, 24, 40, 0.05);
--shadow-float: 0 2px 6px rgba(16, 24, 40, 0.05), 0 12px 28px rgba(16, 24, 40, 0.08);
```

Content card surface:

```css
.content-card {
  background: rgba(251, 251, 251, 0.92);
  border: 1px solid rgba(16, 24, 40, 0.08);
  border-radius: 24px;
  box-shadow:
    0 1px 2px rgba(16, 24, 40, 0.04),
    0 12px 28px rgba(16, 24, 40, 0.08),
    0 0 0 1px rgba(16, 24, 40, 0.04);
}
```

## Layout

Mobile app container:

```css
.app-container {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100dvh;
  background: var(--page-bg);
  position: relative;
}
```

Desktop app container:

```css
@media (min-width: 768px) {
  .app-container {
    max-width: 100%;
    box-shadow: none;
    background: var(--page-bg);
  }
}
```

## Ambient Background

The whole app sits on a very light off-white to pastel-green vertical gradient:

```css
linear-gradient(182deg, #FBFBFB 5.89%, #CAE4D1 98.53%);
```

There are two fixed, non-interactive green glow assets behind the app, using `public/green-gradient.svg`.

SVG gradient source:

```css
green-gradient.svg:
top color #5ACE68;
bottom color #C6E8CA;
fill opacity 0.44;
gaussian blur stdDeviation 78.8;
```

Placement:

```css
.app-backdrop::before {
  left: -300px;
  bottom: -360px;
  width: 700px;
  height: 760px;
  opacity: 0.9;
}

.app-backdrop::after {
  right: -220px;
  bottom: -380px;
  width: 760px;
  height: 820px;
  opacity: 1;
}
```

In Figma, approximate this with two large blurred organic green gradients bleeding from bottom left and bottom right.

## Motion And Interaction

Timing tokens:

```css
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;
--ease-default: cubic-bezier(0.25, 0.1, 0.25, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
```

Global button/tab transitions:

```css
button,
[role="button"],
[role="tab"] {
  cursor: pointer;
  transition: background 150ms, color 150ms, opacity 150ms, transform 150ms, box-shadow 150ms;
}

button:active:not(:disabled),
[role="button"]:active:not(:disabled) {
  transform: scale(0.96);
}
```

Page entrance:

```css
.page-appear {
  animation: fadeInUp 250ms cubic-bezier(0.25, 0.1, 0.25, 1) both;
}
```

First-time FAB hint:

```css
.fab-hint {
  animation: fab-pulse 1.2s ease-in-out 3;
}
```

## Key Components To Draw

### Buttons

Base style from `src/components/ui/button.tsx`:

```css
display: inline-flex;
align-items: center;
justify-content: center;
border-radius: 8px;
font-size: 14px;
font-weight: 500;
transition: all;
focus ring: 3px using --ring at 50% alpha;
disabled opacity: 0.5;
```

Variants:

- Default: primary background, white text.
- Outline: border using `--border`, background using `--background`, hover muted.
- Secondary: `--secondary` background, `--secondary-foreground` text.
- Ghost: transparent, hover muted.
- Destructive: red at low opacity, destructive text.
- Link: primary text with underline on hover.

Sizes:

- default: 32 px high mobile, 40 px desktop.
- xs: 28 px high.
- sm: 32 px mobile, 36 px desktop.
- lg: 36 px mobile, 44 px desktop.
- icon: 32 x 32 mobile, 40 x 40 desktop.

### Expanding Add Button

```css
height: 26px mobile;
height: 30px desktop;
collapsed width: 26 to 30 px;
hover width: 160 px mobile, 200 px desktop;
border-radius: 9999px;
background: var(--primary-soft);
color: var(--primary);
hover background: var(--primary);
hover text: white;
font-size: 14px;
font-weight: 600;
```

### Tabs

- Tabs use muted background containers.
- Active tab should read like a selected soft pill.
- Inactive tab hover: `--muted` background and foreground text.

### Sidebar Nav Item

```css
hover background: var(--primary-soft);
hover text: var(--accent-foreground);
hover transform: translateX(2px);
hover icon color: var(--primary);
```

### Bottom Sheet And Desktop Modal

Mobile:

- Bottom sheet opens from bottom.
- Rounded top corners around 16 to 20 px.
- Full width.

Desktop behavior for `data-side="bottom"`:

```css
top: 50%;
left: 50%;
translate: -50% -50%;
width: 480px;
max-width: 92vw;
max-height: 85dvh;
border-radius: 16px;
border: 1px solid var(--border);
```

### Calculator Panel

Mobile:

```css
position: fixed;
z-index: 160;
left: 0;
right: 0;
bottom: 0;
border-radius: 20px 20px 0 0;
background: var(--card);
box-shadow: var(--shadow-float);
max-height: 92dvh;
closed transform: translateY(102%);
open transform: translateY(0);
```

Desktop:

```css
width: 284px;
right: 22px;
bottom: 28px;
border-radius: 20px;
border: 1px solid var(--border-subtle);
closed transform: scale(0.94) translateY(12px);
open transform: scale(1) translateY(0);
```

Calculator keypad:

```css
grid-template-columns: repeat(4, 1fr);
gap: 8px desktop, 9px mobile;
button height: 52px desktop, 58px mobile;
button radius: 12px desktop, 14px mobile;
font-weight: 600;
```

Calculator button styles:

- Number: `--muted` background, foreground text.
- Function: `hsl(220, 10%, 91%)` background, muted text, 14 px.
- Operator: `--primary-soft` background, `--primary` text, 1.5 px `--primary-muted` border, 20 px.
- Operator active: `--primary` background, white text.
- Equals: `--primary` background, white text.
- Backspace: `--muted` background, orange text.

### Calendar Activity Dots

Desktop:

```css
.cal-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
```

Mobile:

```css
max-width 767px: dot 5px;
max-width 380px: dot 4px;
crowded mobile: 4px;
crowded under 380px: 3px;
```

### Walkthrough Tour

- Overlay z-index: 200.
- Mask color: rgba(15, 23, 42, 0.55).
- Highlight ring: 3 px primary plus 8 px translucent green glow.
- Tooltip: max 340 px wide, card background, 16 px radius, border, heavy shadow.

## Figma Output Suggestions

Create these frames:

- `Tokens`: color swatches, type styles, radius samples, shadow samples.
- `Mobile Dashboard`: 390 x 844 with ambient background, header, tabs/nav, summary cards, transaction list, and FAB.
- `Desktop Dashboard`: 1440 x 900 with full-width app layout and centered content card feel.
- `Bottom Sheet`: mobile bottom sheet and desktop centered modal variant.
- `Calculator`: mobile bottom sheet and desktop floating panel variant.

## Notes

- The current app is not a generic marketing page. It should feel like a personal finance tool: scan-friendly, quiet, practical, and soft.
- Keep contrast accessible, but preserve the gentle pastel look.
- Avoid turning the whole UI into one flat green theme. Orange, neutral gray, red, blue, amber, violet, cyan, and teal are used for semantic/category contrast.
- The current CSS comments in source have some mojibake/encoding artifacts, but the actual CSS values are readable and represented above.
