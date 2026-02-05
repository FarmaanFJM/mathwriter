import type { MathExpressionLine } from '../types/editor'

const INTERNAL_PLACEHOLDER_PATTERN = /\\?(?:classslot|hitslot|bodyslot|functionslot|placeholders?)\b/gi
const DANGLING_SEPARATOR_PATTERN = /\s*[–—-]\s*/g

/**
 * Removes internal template/debug placeholder tokens from LaTeX before rendering.
 */
export function sanitizeLatex(latex: string): string {
  if (!latex) return ''

  const stripped = latex
    .replace(INTERNAL_PLACEHOLDER_PATTERN, '')
    .replace(/\\text\s*\{\s*\}/g, '')
    .replace(DANGLING_SEPARATOR_PATTERN, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

  // Recover common derivative fallback patterns after placeholder removal.
  return stripped.replace(/\bd\s*\/\s*d\s*([A-Za-z]+)/g, '\\dfrac{d}{d$1}')
}

// Legacy symbol-to-LaTeX mapping (kept for backward compatibility with MathExpressionLine)
export const symbolToLatex: Record<string, string> = {
  sigma: '\\displaystyle \\Sigma',
  sum: '\\displaystyle \\sum',
  integral: '\\displaystyle \\int',
  pi: '\\pi',
  alpha: '\\alpha',
  beta: '\\beta',
  theta: '\\theta',
  lambda: '\\lambda',
  gamma: '\\gamma',
  delta: '\\delta',
  plus: '+',
  minus: '-',
  times: '\\times',
  divide: '\\div',
  equals: '=',
  approx: '\\approx',
  leq: '\\leq',
  geq: '\\geq',
  infinity: '\\infty',
  sqrt: '\\sqrt{}',
  fraction: '\\frac{}{}',
  power: 'x^{}',
  subscript: 'x_{}'
}

export function createMathExpression(
  latex: string,
  id: string,
  displayMode: boolean
): MathExpressionLine {
  return {
    id,
    type: 'math',
    latex,
    displayMode
  }
}
