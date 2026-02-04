import type { MathExpressionLine } from '../types/editor'

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
