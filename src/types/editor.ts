// Strict block-based editor types

// Line element base
export interface LineElement {
  id: string
  type: 'text' | 'matrix' | 'math'
}

// Text line with inline segments
export interface TextLine extends LineElement {
  type: 'text'
  content: (TextSpan | SymbolSpan | MatrixSpan)[]
}

export interface TextSpan {
  type: 'text'
  value: string
}

export interface SymbolSpan {
  type: 'symbol'
  value: 'sigma' | 'integral' | 'sqrt' | 'pi' | 'theta' | 'alpha' | 'beta' | 'gamma' | 'delta' | 'lambda' | 'plus' | 'minus' | 'times' | 'divide' | 'equals'
  display: string
  latex?: string
}

export interface MatrixSpan {
  id: string
  type: 'matrix'
  rows: number
  cols: number
  data: string[][]
}

// Matrix line
export interface MatrixLine extends LineElement {
  type: 'matrix'
  rows: number
  cols: number
  data: string[][]  // 2D array of cell values
}

export interface MathExpressionLine extends LineElement {
  type: 'math'
  latex: string
  raw?: string
  displayMode: boolean
}

// Document is array of lines
export type DocumentContent = (TextLine | MatrixLine | MathExpressionLine)[]

// Cursor position (zone-based)
export type CursorPosition = 
  | { zone: 'text', lineId: string, charOffset: number }
  | { zone: 'matrix', lineId: string, matrixId: string, row: number, col: number }

// Note structure
export interface Note {
  id: string
  title: string
  content: DocumentContent
  createdAt: number
  updatedAt: number
}

// Command definition
export interface Command {
  id: string
  name: string
  description: string
  category: 'insert' | 'symbol' | 'operator' | 'math' | 'matrix'
  icon?: string
}
