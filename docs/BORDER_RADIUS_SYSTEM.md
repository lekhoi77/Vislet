# Vislet Border Radius System

This document describes the current border radius scale used by Vislet.
Use it as the source of truth for Figma, redesign prompts, and future UI work.

## Token Scale

| Token | Value | Tailwind / CSS Reference | Intended Use |
| --- | ---: | --- | --- |
| `--radius-micro` | `4px` | `rounded-sm`, inline `borderRadius: 4` | Tiny bars, skeleton lines, keyboard hints, dense micro badges |
| `--radius-compact` | `8px` | `--radius-sm`, `rounded-lg` in this app | Small controls, menu items, compact icon containers, tab triggers |
| `--radius-control` | `12px` | `--radius-md`, shadcn `--radius`, many `rounded-xl` controls | Inputs, primary buttons, form controls, transaction rows |
| `--radius-panel` | `16px` | `--radius-lg`, `rounded-2xl` intent, desktop modal sheet | Cards, dialogs, bottom-sheet desktop modal, larger grouped surfaces |
| `--radius-sheet` | `20px` | `--radius-xl` | Mobile sheets, calculator panel, large floating panels |
| `--radius-shell` | `24px` | `.content-card` | Main app content shell / largest contained surface |
| `--radius-pill` | `9999px` | `--radius-full`, `rounded-full` | Pills, avatars, toggles, dots, progress bars |

## Current CSS Tokens

Defined in `src/app/globals.css`:

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-full: 9999px;
--radius: 0.75rem;

--radius-micro: 4px;
--radius-compact: 8px;
--radius-control: 12px;
--radius-panel: 16px;
--radius-sheet: 20px;
--radius-shell: 24px;
--radius-pill: 9999px;
```

## Practical Rules

- Use `4px` only for very small visual details.
- Use `8px` for compact clickable elements inside dense lists and menus.
- Use `12px` for the default form/control radius.
- Use `16px` for card-level surfaces and desktop modal surfaces.
- Use `20px` for sheet/floating-panel level surfaces.
- Use `24px` for the main app content shell only.
- Use `9999px` for pills, circular avatars, dots, and progress tracks.

## Figma Setup

Create radius variables:

- `Radius/Micro = 4`
- `Radius/Compact = 8`
- `Radius/Control = 12`
- `Radius/Panel = 16`
- `Radius/Sheet = 20`
- `Radius/Shell = 24`
- `Radius/Pill = 9999`

Recommended Figma component mapping:

- Button: `Radius/Control`
- Input: `Radius/Control`
- Chip: `Radius/Pill` or `Radius/Compact`, depending on shape
- Tab trigger: `Radius/Compact`
- Card: `Radius/Panel`
- Modal: `Radius/Panel`
- Mobile bottom sheet: top corners `Radius/Sheet`, bottom corners `0`
- Calculator panel: `Radius/Sheet`
- Main content card: `Radius/Shell`
