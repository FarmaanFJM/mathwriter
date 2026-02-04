// Math template system: defines equation templates with named editable slots
// Each template compiles slot values into LaTeX for KaTeX rendering

export interface SlotDefinition {
  name: string
  placeholder: string   // shown when empty (e.g., "n", "i=1", "expr")
  defaultValue: string   // initial value
}

export interface MathTemplate {
  id: string
  name: string
  category: 'operator' | 'structure' | 'function' | 'decoration'
  slots: SlotDefinition[]
  // Compile slot values to LaTeX string
  compile: (slotValues: Record<string, string>) => string
  // Whether this is a large operator (needs 2-2.5x sizing)
  isLargeOperator: boolean
}

// All available math templates
export const mathTemplates: Record<string, MathTemplate> = {
  // === LARGE OPERATORS ===
  summation: {
    id: 'summation',
    name: 'Summation',
    category: 'operator',
    slots: [
      { name: 'lower', placeholder: 'i=1', defaultValue: '' },
      { name: 'upper', placeholder: 'n', defaultValue: '' },
      { name: 'body', placeholder: 'expr', defaultValue: '' },
    ],
    compile: (v) => {
      const lower = v.lower ? `_{${v.lower}}` : ''
      const upper = v.upper ? `^{${v.upper}}` : ''
      const body = v.body || '\\square'
      return `\\displaystyle\\sum${lower}${upper} ${body}`
    },
    isLargeOperator: true,
  },

  product: {
    id: 'product',
    name: 'Product',
    category: 'operator',
    slots: [
      { name: 'lower', placeholder: 'i=1', defaultValue: '' },
      { name: 'upper', placeholder: 'n', defaultValue: '' },
      { name: 'body', placeholder: 'expr', defaultValue: '' },
    ],
    compile: (v) => {
      const lower = v.lower ? `_{${v.lower}}` : ''
      const upper = v.upper ? `^{${v.upper}}` : ''
      const body = v.body || '\\square'
      return `\\displaystyle\\prod${lower}${upper} ${body}`
    },
    isLargeOperator: true,
  },

  integral: {
    id: 'integral',
    name: 'Integral',
    category: 'operator',
    slots: [
      { name: 'lower', placeholder: 'a', defaultValue: '' },
      { name: 'upper', placeholder: 'b', defaultValue: '' },
      { name: 'body', placeholder: 'f(x)', defaultValue: '' },
      { name: 'differential', placeholder: 'dx', defaultValue: 'dx' },
    ],
    compile: (v) => {
      const lower = v.lower ? `_{${v.lower}}` : ''
      const upper = v.upper ? `^{${v.upper}}` : ''
      const body = v.body || '\\square'
      const diff = v.differential || 'dx'
      return `\\displaystyle\\int${lower}${upper} ${body}\\, ${diff}`
    },
    isLargeOperator: true,
  },

  union: {
    id: 'union',
    name: 'Union',
    category: 'operator',
    slots: [
      { name: 'lower', placeholder: 'i=1', defaultValue: '' },
      { name: 'upper', placeholder: 'n', defaultValue: '' },
      { name: 'body', placeholder: 'A_i', defaultValue: '' },
    ],
    compile: (v) => {
      const lower = v.lower ? `_{${v.lower}}` : ''
      const upper = v.upper ? `^{${v.upper}}` : ''
      const body = v.body || '\\square'
      return `\\displaystyle\\bigcup${lower}${upper} ${body}`
    },
    isLargeOperator: true,
  },

  intersection: {
    id: 'intersection',
    name: 'Intersection',
    category: 'operator',
    slots: [
      { name: 'lower', placeholder: 'i=1', defaultValue: '' },
      { name: 'upper', placeholder: 'n', defaultValue: '' },
      { name: 'body', placeholder: 'A_i', defaultValue: '' },
    ],
    compile: (v) => {
      const lower = v.lower ? `_{${v.lower}}` : ''
      const upper = v.upper ? `^{${v.upper}}` : ''
      const body = v.body || '\\square'
      return `\\displaystyle\\bigcap${lower}${upper} ${body}`
    },
    isLargeOperator: true,
  },

  // === STRUCTURES ===
  fraction: {
    id: 'fraction',
    name: 'Fraction',
    category: 'structure',
    slots: [
      { name: 'numerator', placeholder: 'a', defaultValue: '' },
      { name: 'denominator', placeholder: 'b', defaultValue: '' },
    ],
    compile: (v) => {
      const num = v.numerator || '\\square'
      const den = v.denominator || '\\square'
      return `\\dfrac{${num}}{${den}}`
    },
    isLargeOperator: false,
  },

  sqrt: {
    id: 'sqrt',
    name: 'Square Root',
    category: 'structure',
    slots: [
      { name: 'body', placeholder: 'x', defaultValue: '' },
    ],
    compile: (v) => {
      const body = v.body || '\\square'
      return `\\sqrt{${body}}`
    },
    isLargeOperator: false,
  },

  nthroot: {
    id: 'nthroot',
    name: 'Nth Root',
    category: 'structure',
    slots: [
      { name: 'index', placeholder: 'n', defaultValue: '' },
      { name: 'body', placeholder: 'x', defaultValue: '' },
    ],
    compile: (v) => {
      const idx = v.index || 'n'
      const body = v.body || '\\square'
      return `\\sqrt[${idx}]{${body}}`
    },
    isLargeOperator: false,
  },

  power: {
    id: 'power',
    name: 'Exponent',
    category: 'structure',
    slots: [
      { name: 'base', placeholder: 'x', defaultValue: '' },
      { name: 'exponent', placeholder: 'n', defaultValue: '' },
    ],
    compile: (v) => {
      const base = v.base || '\\square'
      const exp = v.exponent || '\\square'
      return `{${base}}^{${exp}}`
    },
    isLargeOperator: false,
  },

  subscriptExpr: {
    id: 'subscriptExpr',
    name: 'Subscript',
    category: 'structure',
    slots: [
      { name: 'base', placeholder: 'x', defaultValue: '' },
      { name: 'sub', placeholder: 'i', defaultValue: '' },
    ],
    compile: (v) => {
      const base = v.base || '\\square'
      const sub = v.sub || '\\square'
      return `{${base}}_{${sub}}`
    },
    isLargeOperator: false,
  },

  superSub: {
    id: 'superSub',
    name: 'Super & Subscript',
    category: 'structure',
    slots: [
      { name: 'base', placeholder: 'x', defaultValue: '' },
      { name: 'sub', placeholder: 'i', defaultValue: '' },
      { name: 'sup', placeholder: 'n', defaultValue: '' },
    ],
    compile: (v) => {
      const base = v.base || '\\square'
      const sub = v.sub || '\\square'
      const sup = v.sup || '\\square'
      return `{${base}}_{${sub}}^{${sup}}`
    },
    isLargeOperator: false,
  },

  // === FUNCTIONS ===
  limit: {
    id: 'limit',
    name: 'Limit',
    category: 'function',
    slots: [
      { name: 'variable', placeholder: 'x', defaultValue: 'x' },
      { name: 'approaching', placeholder: '\\infty', defaultValue: '' },
      { name: 'body', placeholder: 'f(x)', defaultValue: '' },
    ],
    compile: (v) => {
      const variable = v.variable || 'x'
      const approaching = v.approaching || '\\infty'
      const body = v.body || '\\square'
      return `\\displaystyle\\lim_{${variable} \\to ${approaching}} ${body}`
    },
    isLargeOperator: true,
  },

  derivative: {
    id: 'derivative',
    name: 'Derivative',
    category: 'function',
    slots: [
      { name: 'function', placeholder: 'f', defaultValue: '' },
      { name: 'variable', placeholder: 'x', defaultValue: 'x' },
    ],
    compile: (v) => {
      const fn = v.function || '\\square'
      const variable = v.variable || 'x'
      return `\\dfrac{d${fn}}{d${variable}}`
    },
    isLargeOperator: false,
  },

  partialDerivative: {
    id: 'partialDerivative',
    name: 'Partial Derivative',
    category: 'function',
    slots: [
      { name: 'function', placeholder: 'f', defaultValue: '' },
      { name: 'variable', placeholder: 'x', defaultValue: 'x' },
    ],
    compile: (v) => {
      const fn = v.function || '\\square'
      const variable = v.variable || 'x'
      return `\\dfrac{\\partial ${fn}}{\\partial ${variable}}`
    },
    isLargeOperator: false,
  },

  // === DECORATIONS ===
  hat: {
    id: 'hat',
    name: 'Hat',
    category: 'decoration',
    slots: [
      { name: 'body', placeholder: 'x', defaultValue: '' },
    ],
    compile: (v) => {
      const body = v.body || '\\square'
      return `\\hat{${body}}`
    },
    isLargeOperator: false,
  },

  bar: {
    id: 'bar',
    name: 'Bar (overline)',
    category: 'decoration',
    slots: [
      { name: 'body', placeholder: 'x', defaultValue: '' },
    ],
    compile: (v) => {
      const body = v.body || '\\square'
      return `\\overline{${body}}`
    },
    isLargeOperator: false,
  },

  vec: {
    id: 'vec',
    name: 'Vector Arrow',
    category: 'decoration',
    slots: [
      { name: 'body', placeholder: 'v', defaultValue: '' },
    ],
    compile: (v) => {
      const body = v.body || '\\square'
      return `\\vec{${body}}`
    },
    isLargeOperator: false,
  },

  abs: {
    id: 'abs',
    name: 'Absolute Value',
    category: 'structure',
    slots: [
      { name: 'body', placeholder: 'x', defaultValue: '' },
    ],
    compile: (v) => {
      const body = v.body || '\\square'
      return `\\left|${body}\\right|`
    },
    isLargeOperator: false,
  },

  paren: {
    id: 'paren',
    name: 'Parentheses',
    category: 'structure',
    slots: [
      { name: 'body', placeholder: 'expr', defaultValue: '' },
    ],
    compile: (v) => {
      const body = v.body || '\\square'
      return `\\left(${body}\\right)`
    },
    isLargeOperator: false,
  },

  bracket: {
    id: 'bracket',
    name: 'Brackets',
    category: 'structure',
    slots: [
      { name: 'body', placeholder: 'expr', defaultValue: '' },
    ],
    compile: (v) => {
      const body = v.body || '\\square'
      return `\\left[${body}\\right]`
    },
    isLargeOperator: false,
  },

  binom: {
    id: 'binom',
    name: 'Binomial',
    category: 'structure',
    slots: [
      { name: 'n', placeholder: 'n', defaultValue: '' },
      { name: 'k', placeholder: 'k', defaultValue: '' },
    ],
    compile: (v) => {
      const n = v.n || '\\square'
      const k = v.k || '\\square'
      return `\\dbinom{${n}}{${k}}`
    },
    isLargeOperator: false,
  },
}

// Compile a template instance to LaTeX
export function compileTemplate(templateId: string, slotValues: Record<string, string>): string {
  const template = mathTemplates[templateId]
  if (!template) return ''
  return template.compile(slotValues)
}

// Get slot definitions for a template
export function getTemplateSlots(templateId: string): SlotDefinition[] {
  const template = mathTemplates[templateId]
  return template?.slots || []
}

// Simple symbol-to-LaTeX for inline symbols (non-template)
export const inlineSymbols: Record<string, { latex: string; display: string }> = {
  // Greek letters
  alpha: { latex: '\\alpha', display: 'α' },
  beta: { latex: '\\beta', display: 'β' },
  gamma: { latex: '\\gamma', display: 'γ' },
  delta: { latex: '\\delta', display: 'δ' },
  epsilon: { latex: '\\epsilon', display: 'ε' },
  theta: { latex: '\\theta', display: 'θ' },
  lambda: { latex: '\\lambda', display: 'λ' },
  mu: { latex: '\\mu', display: 'μ' },
  pi: { latex: '\\pi', display: 'π' },
  rho: { latex: '\\rho', display: 'ρ' },
  sigma_lower: { latex: '\\sigma', display: 'σ' },
  tau: { latex: '\\tau', display: 'τ' },
  phi: { latex: '\\phi', display: 'φ' },
  chi: { latex: '\\chi', display: 'χ' },
  psi: { latex: '\\psi', display: 'ψ' },
  omega: { latex: '\\omega', display: 'ω' },

  // Uppercase Greek
  Gamma: { latex: '\\Gamma', display: 'Γ' },
  Delta: { latex: '\\Delta', display: 'Δ' },
  Theta: { latex: '\\Theta', display: 'Θ' },
  Lambda: { latex: '\\Lambda', display: 'Λ' },
  Sigma: { latex: '\\Sigma', display: 'Σ' },
  Phi: { latex: '\\Phi', display: 'Φ' },
  Psi: { latex: '\\Psi', display: 'Ψ' },
  Omega: { latex: '\\Omega', display: 'Ω' },

  // Math operators
  plus: { latex: '+', display: '+' },
  minus: { latex: '-', display: '−' },
  times: { latex: '\\times', display: '×' },
  divide: { latex: '\\div', display: '÷' },
  cdot: { latex: '\\cdot', display: '·' },
  equals: { latex: '=', display: '=' },
  neq: { latex: '\\neq', display: '≠' },
  approx: { latex: '\\approx', display: '≈' },
  lt: { latex: '<', display: '<' },
  gt: { latex: '>', display: '>' },
  leq: { latex: '\\leq', display: '≤' },
  geq: { latex: '\\geq', display: '≥' },
  pm: { latex: '\\pm', display: '±' },
  infinity: { latex: '\\infty', display: '∞' },
  nabla: { latex: '\\nabla', display: '∇' },
  partial: { latex: '\\partial', display: '∂' },
  forall: { latex: '\\forall', display: '∀' },
  exists: { latex: '\\exists', display: '∃' },
  in_set: { latex: '\\in', display: '∈' },
  notin: { latex: '\\notin', display: '∉' },
  subset: { latex: '\\subset', display: '⊂' },
  supset: { latex: '\\supset', display: '⊃' },
  cup: { latex: '\\cup', display: '∪' },
  cap: { latex: '\\cap', display: '∩' },
  rightarrow: { latex: '\\rightarrow', display: '→' },
  leftarrow: { latex: '\\leftarrow', display: '←' },
  Rightarrow: { latex: '\\Rightarrow', display: '⇒' },
  Leftarrow: { latex: '\\Leftarrow', display: '⇐' },
  leftrightarrow: { latex: '\\leftrightarrow', display: '↔' },
  dots: { latex: '\\cdots', display: '⋯' },
}
