import type { MathExpressionLine } from '../types/editor'

// Map symbol IDs to their LaTeX representation
export const symbolToLatex: Record<string, string> = {
  // Greek letters
  'sigma': '\\Sigma',
  'sum': '\\sum',
  'integral': '\\int',
  'pi': '\\pi',
  'alpha': '\\alpha',
  'beta': '\\beta',
  'theta': '\\theta',
  'lambda': '\\lambda',
  'gamma': '\\gamma',
  'delta': '\\delta',

  // Operators
  'plus': '+',
  'minus': '-',
  'times': '\\times',
  'divide': '\\div',
  'equals': '=',
  'approx': '\\approx',
  'leq': '\\leq',
  'geq': '\\geq',
  'infinity': '\\infty',

  // Math structures
  'sqrt': '\\sqrt{\\square}',
  'fraction': '\\frac{\\square}{\\square}',
  'power': '{\\square}^{\\square}',
  'subscript': '{\\square}_{\\square}',
  'sum-full': '\\sum_{i=1}^{n}',
  'integral-full': '\\int_{a}^{b}',
  'limit': '\\lim_{x \\to \\infty}',
}

// Map LaTeX commands to display characters (for fallback)
export const latexToDisplay: Record<string, string> = {
  '\\Sigma': '\u03A3',
  '\\sigma': '\u03C3',
  '\\sum': '\u2211',
  '\\int': '\u222B',
  '\\pi': '\u03C0',
  '\\alpha': '\u03B1',
  '\\beta': '\u03B2',
  '\\theta': '\u03B8',
  '\\lambda': '\u03BB',
  '\\gamma': '\u03B3',
  '\\delta': '\u03B4',
  '\\times': '\u00D7',
  '\\div': '\u00F7',
  '\\approx': '\u2248',
  '\\leq': '\u2264',
  '\\geq': '\u2265',
  '\\infty': '\u221E',
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Create a MathExpressionLine from a symbol ID
export function createMathExpression(symbolId: string, displayMode: boolean = false): MathExpressionLine {
  const latex = symbolToLatex[symbolId] || symbolId
  return {
    id: generateId(),
    type: 'math',
    latex,
    displayMode,
  }
}

// Determine if a symbol should be rendered as a display-mode math expression
export function isDisplayModeSymbol(symbolId: string): boolean {
  const displaySymbols = ['fraction', 'sum-full', 'integral-full', 'limit']
  return displaySymbols.includes(symbolId)
}
