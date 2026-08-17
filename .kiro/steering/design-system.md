# Design System - Antarctic Tech

Every application built in this workspace MUST use the following Antarctic Tech design system tokens. Do not invent or hardcode arbitrary colors — always reference these tokens. This is a **dark-first** design system inspired by the Emperor Penguin and the Antarctic landscape.

## Brand & Style

The design system is a high-contrast, technical framework inspired by the Emperor Penguin — warm rose-pink tones (penguin beak) for primary accents, golden yellow for secondary actions and highlights, cool blue-grey for tertiary elements, and near-black obsidian for surfaces. The light theme inverts to warm parchment surfaces with gold primary actions.

## Color Tokens (Dark Theme - Default)

### Primary (Rose Beak)
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#D8B8B6` | Primary accents, borders, interactive highlights |
| On Primary | `#3B2221` | Text/icons on Primary surfaces |
| Primary Container | `#876765` | Prominent containers, elevated cards |
| On Primary Container | `#FFFFFF` | Text/icons on Primary Container |
| Primary Fixed | `#F2D8D6` | Fixed primary surfaces |
| Primary Fixed Dim | `#D8B8B6` | Dimmed fixed primary |
| On Primary Fixed | `#2A1313` | Text on fixed primary |
| On Primary Fixed Variant | `#573C3B` | Text on fixed primary variant |

### Secondary (Golden Yellow)
| Token | Hex | Usage |
|-------|-----|-------|
| Secondary | `#FFE186` | Key actions, highlights, golden accents |
| On Secondary | `#3C2F00` | Text/icons on Secondary surfaces |
| Secondary Container | `#E8C44A` | Action buttons, prominent CTAs |
| On Secondary Container | `#231B00` | Text/icons on Secondary Container |
| Secondary Fixed | `#FFE082` | Fixed secondary surfaces |
| Secondary Fixed Dim | `#E7C349` | Dimmed fixed secondary |
| On Secondary Fixed | `#231B00` | Text on fixed secondary |
| On Secondary Fixed Variant | `#564500` | Text on fixed secondary variant |

### Tertiary (Cool Blue-Grey)
| Token | Hex | Usage |
|-------|-----|-------|
| Tertiary | `#B8C9D6` | Accent/decorative, icy blue elements |
| On Tertiary | `#23323D` | Text/icons on Tertiary surfaces |
| Tertiary Container | `#394954` | Tertiary container fills |
| On Tertiary Container | `#D4E5F3` | Text/icons on Tertiary Container |
| Tertiary Fixed | `#DDE3ED` | Fixed tertiary surfaces |
| Tertiary Fixed Dim | `#C1C7D1` | Dimmed fixed tertiary |
| On Tertiary Fixed | `#161C23` | Text on fixed tertiary |
| On Tertiary Fixed Variant | `#41474F` | Text on fixed tertiary variant |

### Error
| Token | Hex | Usage |
|-------|-----|-------|
| Error | `#FFB4AB` | Error states, destructive actions |
| On Error | `#690005` | Text/icons on Error surfaces |
| Error Container | `#93000A` | Error container fills |
| On Error Container | `#FFDAD6` | Text/icons on Error Container surfaces |

### Background & Surface
| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#0B0B0D` | App background (deep obsidian) |
| On Background | `#F0ECE0` | Text/icons on Background |
| Surface | `#0B0B0D` | Base surface level |
| Surface Dim | `#0B0B0D` | Dimmed surface |
| Surface Bright | `#2B2B30` | Bright surface variant |
| On Surface | `#F0ECE0` | Text/icons on Surface |
| On Surface Variant | `#C8C2B4` | Secondary text on surfaces |
| Inverse Surface | `#F0ECE0` | Inverse context surface |
| Inverse On Surface | `#19191D` | Text on inverse surface |
| Inverse Primary | `#876765` | Inverse primary accent |
| Surface Tint | `#D8B8B6` | Tint overlay for elevation |

### Surface Containers (Tonal Layering)
| Token | Hex | Usage |
|-------|-----|-------|
| Surface Container Lowest | `#060607` | Lowest elevation container |
| Surface Container Low | `#131316` | Low elevation container |
| Surface Container | `#19191D` | Default container elevation |
| Surface Container High | `#212126` | Higher elevation containers |
| Surface Container Highest | `#2C2C33` | Highest elevation containers |

### Outline
| Token | Hex | Usage |
|-------|-----|-------|
| Outline | `#D8B8B6` | Borders, dividers, medium-emphasis |
| Outline Variant | `#3A3D45` | Low-emphasis outlines, decorative borders |

---

## Color Tokens (Light Theme)

### Primary (Gold)
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#E8C44A` | Primary actions, key highlights |
| On Primary | `#231B00` | Text/icons on Primary surfaces |
| Primary Container | `#FFE082` | Prominent containers |
| On Primary Container | `#564500` | Text/icons on Primary Container |
| Primary Fixed | `#FFE082` | Fixed primary surfaces |
| Primary Fixed Dim | `#E7C349` | Dimmed fixed primary |
| On Primary Fixed | `#231B00` | Text on fixed primary |
| On Primary Fixed Variant | `#564500` | Text on fixed primary variant |

### Secondary (Steel Blue)
| Token | Hex | Usage |
|-------|-----|-------|
| Secondary | `#51606C` | Interactive elements, subtle borders |
| On Secondary | `#FFFFFF` | Text/icons on Secondary surfaces |
| Secondary Container | `#D4E5F3` | Secondary container fills |
| On Secondary Container | `#394954` | Text/icons on Secondary Container |
| Secondary Fixed | `#D4E5F3` | Fixed secondary surfaces |
| Secondary Fixed Dim | `#B8C9D6` | Dimmed fixed secondary |
| On Secondary Fixed | `#0D1D27` | Text on fixed secondary |
| On Secondary Fixed Variant | `#394954` | Text on fixed secondary variant |

### Tertiary (Neutral Blue-Grey)
| Token | Hex | Usage |
|-------|-----|-------|
| Tertiary | `#585F67` | Accent/decorative elements |
| On Tertiary | `#FFFFFF` | Text/icons on Tertiary surfaces |
| Tertiary Container | `#C2C8D2` | Tertiary container fills |
| On Tertiary Container | `#3E454D` | Text/icons on Tertiary Container |
| Tertiary Fixed | `#DDE3ED` | Fixed tertiary surfaces |
| Tertiary Fixed Dim | `#C1C7D1` | Dimmed fixed tertiary |
| On Tertiary Fixed | `#161C23` | Text on fixed tertiary |
| On Tertiary Fixed Variant | `#41474F` | Text on fixed tertiary variant |

### Error (Light)
| Token | Hex | Usage |
|-------|-----|-------|
| Error | `#BA1A1A` | Error states |
| On Error | `#FFFFFF` | Text/icons on Error surfaces |
| Error Container | `#FFDAD6` | Error container fills |
| On Error Container | `#93000A` | Text/icons on Error Container |

### Background & Surface (Light)
| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#FFF8F0` | App background (warm parchment) |
| On Background | `#1E1B13` | Text/icons on Background |
| Surface | `#F0ECE0` | Base surface level |
| On Surface | `#1E1B13` | Text/icons on Surface |
| On Surface Variant | `#4D4635` | Secondary text on surfaces |
| Surface Dim | `#E1D9CC` | Dimmed surface |
| Surface Bright | `#FFF8F0` | Bright surface |
| Inverse Surface | `#343027` | Inverse context surface |
| Inverse On Surface | `#F8F0E2` | Text on inverse surface |
| Inverse Primary | `#E7C349` | Inverse primary accent |
| Surface Tint | `#725C00` | Tint overlay for elevation |
| Surface Variant | `#E9E2D4` | Variant surfaces |

### Surface Containers (Light)
| Token | Hex | Usage |
|-------|-----|-------|
| Surface Container Lowest | `#FFFFFF` | Lowest elevation container |
| Surface Container Low | `#FBF3E5` | Low elevation container |
| Surface Container | `#F5EDDF` | Default container elevation |
| Surface Container High | `#EFE7DA` | Higher elevation containers |
| Surface Container Highest | `#E9E2D4` | Highest elevation containers |

### Outline (Light)
| Token | Hex | Usage |
|-------|-----|-------|
| Outline | `#0B0B0D` | Borders, dividers |
| Outline Variant | `#D0C6AF` | Low-emphasis outlines |

---

## Typography

Uses a **Major Third (1.25)** type scale. **Bricolage Grotesque** is the sole typeface.

| Token | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| Display LG | 48.83px | 800 | 1.1 | -0.02em |
| Headline LG | 39.06px | 700 | 1.2 | -0.01em |
| Headline LG Mobile | 31.25px | 700 | 1.2 | — |
| Headline MD | 31.25px | 600 | 1.3 | — |
| Headline SM | 25.00px | 600 | 1.3 | — |
| Title LG | 20.00px | 600 | 1.4 | — |
| Body LG | 20.00px | 400 | 1.6 | — |
| Body MD | 16.00px | 400 | 1.6 | — |
| Label MD | 12.80px | 600 | 1.2 | 0.05em |
| Label SM | 10.24px | 500 | 1.2 | — |

### Typography Rules
- Headlines use heavy weights (700-800) with tight letter spacing for compact, authoritative presence.
- Body text at 16px (md) or 20px (lg) for readability against the dark background.
- Labels use uppercase styling and increased letter spacing to mimic technical data readouts.

## Layout & Spacing

Spacing rhythm is strictly derived from an **8px base unit**.

| Token | Value |
|-------|-------|
| Base | 8px |
| XS | 4px |
| SM | 8px |
| MD | 16px |
| LG | 24px |
| XL | 32px |
| 2XL | 48px |
| 3XL | 64px |
| Gutter | 24px |
| Margin | 24px |

### Grid
- Desktop: 12-column fluid grid
- Mobile: 4-column grid
- Elements favor strict edge-alignment
- Internal component padding follows the 8px scale

## Border Radius (Shapes)

| Token | Value |
|-------|-------|
| SM | 0.5rem (8px) |
| DEFAULT | 1rem (16px) |
| MD | 1.5rem (24px) |
| LG | 2rem (32px) |
| XL | 3rem (48px) |
| Full | 9999px |

### Shape Rules
- Standard elements: 16px (1rem) radius — pill-shaped aesthetic
- Large containers: 32px (2rem) radius for logical grouping
- Interactive states: Maintain 16px radius with 2px high-contrast borders for focus/active

## Elevation & Depth

Depth is achieved through **Tonal Layering**, NOT traditional shadows.

1. **Level 0 (Base):** `#0B0B0D` — Primary background
2. **Level 1 (Surface):** Use surface container tokens for cards and containers
3. **Level 2 (Interaction):** Borders using Primary or Tertiary colors define boundaries
4. **Highlights:** Inner glows (1px strokes) at 10% opacity for modals (frost/glass edge)

Shadows should be avoided or kept extremely sharp and low-opacity.

## Component Guidelines

- **Buttons:** Primary uses Secondary Container (`#E8C44A`) background with dark text (`#231B00`). Ghost uses 2px stroke of Primary (`#D8B8B6`). Hover: 10% brightness increase.
- **Inputs:** Dark backgrounds with Primary outline borders. Focus state: 2px Secondary (`#FFE186`) border.
- **Chips/Tags:** Pill-shaped. Tertiary Container at 20% opacity for muted backgrounds.
- **Cards:** No shadows. 1px border of Outline Variant (`#3A3D45`).
- **Lists:** Separated by 1px horizontal rules. High-contrast hover states.
- **Status Indicators:** Secondary (`#FFE186`) for "Active" or "Warning" — high-visibility golden yellow.

## Implementation Rules

1. **Always use semantic token names** (e.g., `var(--primary)`, `var(--surface-container-high)`) rather than raw hex values.
2. **Pair "On" colors correctly** — text on a `Primary Container` background must use `On Primary Container`.
3. **Error colors are reserved** for error/destructive states only.
4. **Surface hierarchy**: Use Surface Container Lowest → Low → Default → High → Highest for increasing elevation.
5. **Contrast compliance**: The On/Container pairings are designed for WCAG AA contrast. Do not mix tokens across groups.
6. **No box-shadows**: Use tonal layering for depth.
7. **Bricolage Grotesque only**: Do not introduce other typefaces.
8. **Theme support**: Both dark and light themes must be maintained. Use SCSS theme maps.

## SCSS Theme Maps (source of truth)

```scss
// Dark Theme (Default)
$dark-theme: (
  primary: #D8B8B6,
  on-primary: #3B2221,
  primary-container: #876765,
  on-primary-container: #FFFFFF,
  primary-fixed: #F2D8D6,
  primary-fixed-dim: #D8B8B6,
  on-primary-fixed: #2A1313,
  on-primary-fixed-variant: #573C3B,
  secondary: #FFE186,
  on-secondary: #3C2F00,
  secondary-container: #E8C44A,
  on-secondary-container: #231B00,
  secondary-fixed: #FFE082,
  secondary-fixed-dim: #E7C349,
  on-secondary-fixed: #231B00,
  on-secondary-fixed-variant: #564500,
  tertiary: #B8C9D6,
  on-tertiary: #23323D,
  tertiary-container: #394954,
  on-tertiary-container: #D4E5F3,
  tertiary-fixed: #DDE3ED,
  tertiary-fixed-dim: #C1C7D1,
  on-tertiary-fixed: #161C23,
  on-tertiary-fixed-variant: #41474F,
  error: #FFB4AB,
  on-error: #690005,
  error-container: #93000A,
  on-error-container: #FFDAD6,
  surface: #0B0B0D,
  surface-dim: #0B0B0D,
  surface-bright: #2B2B30,
  surface-container-lowest: #060607,
  surface-container-low: #131316,
  surface-container: #19191D,
  surface-container-high: #212126,
  surface-container-highest: #2C2C33,
  on-surface: #F0ECE0,
  on-surface-variant: #C8C2B4,
  inverse-surface: #F0ECE0,
  inverse-on-surface: #19191D,
  inverse-primary: #876765,
  outline: #D8B8B6,
  outline-variant: #3A3D45,
  background: #0B0B0D,
  on-background: #F0ECE0,
  surface-tint: #D8B8B6
);

// Light Theme
$light-theme: (
  primary: #E8C44A,
  on-primary: #231B00,
  primary-container: #FFE082,
  on-primary-container: #564500,
  primary-fixed: #FFE082,
  primary-fixed-dim: #E7C349,
  on-primary-fixed: #231B00,
  on-primary-fixed-variant: #564500,
  secondary: #51606C,
  on-secondary: #FFFFFF,
  secondary-container: #D4E5F3,
  on-secondary-container: #394954,
  secondary-fixed: #D4E5F3,
  secondary-fixed-dim: #B8C9D6,
  on-secondary-fixed: #0D1D27,
  on-secondary-fixed-variant: #394954,
  tertiary: #585F67,
  on-tertiary: #FFFFFF,
  tertiary-container: #C2C8D2,
  on-tertiary-container: #3E454D,
  tertiary-fixed: #DDE3ED,
  tertiary-fixed-dim: #C1C7D1,
  on-tertiary-fixed: #161C23,
  on-tertiary-fixed-variant: #41474F,
  error: #BA1A1A,
  on-error: #FFFFFF,
  error-container: #FFDAD6,
  on-error-container: #93000A,
  surface: #F0ECE0,
  on-surface: #1E1B13,
  surface-dim: #E1D9CC,
  surface-bright: #FFF8F0,
  inverse-surface: #343027,
  inverse-on-surface: #F8F0E2,
  inverse-primary: #E7C349,
  surface-container-lowest: #FFFFFF,
  surface-container-low: #FBF3E5,
  surface-container: #F5EDDF,
  surface-container-high: #EFE7DA,
  surface-container-highest: #E9E2D4,
  on-surface-variant: #4D4635,
  outline: #0B0B0D,
  outline-variant: #D0C6AF,
  background: #FFF8F0,
  on-background: #1E1B13,
  surface-tint: #725C00,
  surface-variant: #E9E2D4
);
```
