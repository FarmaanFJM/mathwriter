# UX Fix Summary: Math Typography, Layout, and Spacing

## Spacing and Typography Changes
- Introduced a unified math typography token set in `:root` to keep inline math, display math, symbols, line numbers, and matrix spacing consistent.
- Normalized KaTeX sizing so inline and template math share the same base scale and display math is intentionally larger than inline math.
- Added baseline alignment refinements for inline KaTeX to reduce visual drift relative to surrounding text.

## Matrix Padding and Layout Changes
- Kept matrices inline and baseline-aligned to preserve natural sentence flow.
- Reduced matrix horizontal footprint using compact, scalable spacing tokens:
  - `--math-matrix-gap-inline: 0.12em`
  - `--math-matrix-padding-inline: 0.14em`
- Converted matrix cell metrics from fixed px values to scalable `em` units for better zoom behavior.
- Ensured matrix cell KaTeX rendering inherits surrounding math font sizing.

## Line Number Alignment and Row Height
- Updated editor line layout to a consistent text row rhythm with:
  - `line-height: var(--math-row-line-height)`
  - `min-height: 1.75em`
- Vertically centered line numbers per row using `top: 50%` + `transform: translateY(-50%)`.
- Right-aligned line numbers in a fixed column with tabular numerals for visual consistency.

## Font Size Scale and Hierarchy (Display > Inline)
- Inline math base: `--math-font-size-inline: 1em`
- Display math scale: `--math-font-size-display: 1.12em`
- Symbol/Greek optical adjustment: `--math-font-size-symbol: 1.02em`
- Line number scale: `--math-font-size-line-number: 0.75rem`

## CSS Rules Added or Modified
- `src/style.css`
  - Added math scale variables.
  - Updated `.katex`, `.katex-display`, `.katex-html`, and `.math-expression` typography/alignment.
  - Added Greek/symbol normalization rule and matrix inheritance rules for KaTeX arrays.
- `src/components/MathExpression.vue`
  - Normalized expression and render block sizing/alignment.
  - Added deep selectors to ensure KaTeX and array internals inherit font/size.
- `src/components/MathWriter.vue`
  - Updated editor content spacing to scalable units.
  - Corrected line number vertical alignment and fixed-column formatting.
  - Tightened inline symbol and matrix spacing and unified matrix cell typography.

## Before/After Visual Comparison Notes
- Before: matrices felt detached from sentence flow and consumed too much horizontal space.
- After: matrices now read as inline math fragments with compact spacing and baseline-consistent positioning.
- Before: line numbers appeared offset and inconsistent between rows.
- After: line numbers are centered against row content and remain visually stable.
- Before: Greek letters appeared smaller than surrounding math.
- After: Greek/symbol glyphs now match surrounding inline math scale more closely.

## Zoom Level and Responsive Behavior Verification
- Replaced most size-critical pixel values with `em`/`rem` in edited rules to improve scaling behavior under browser and OS zoom.
- Matrix spacing, line numbering, and row rhythm now scale proportionally with base font size.

## Remaining Visual Inconsistencies
- KaTeX font metrics can still vary slightly across platforms due to font fallback availability.
- Extremely dense formulas may still need content-specific tuning (outside this targeted CSS fix scope).
