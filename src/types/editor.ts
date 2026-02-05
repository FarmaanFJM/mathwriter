// Strict block-based editor types

// Line element base
export interface LineElement {
  id: string
  type: 'text' | 'matrix' | 'math'
}

// Text line with inline segments
export interface TextLine extends LineElement {
  type: 'text'
  content: (TextSpan | SymbolSpan | MatrixSpan | MathTemplateSpan)[]
}

export interface TextSpan {
  type: 'text'
  value: string
  format?: TextFormat
}

export interface TextFormat {
  fontSize?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

export interface SymbolSpan {
  type: 'symbol'
  value: string
  display: string
  latex?: string
  format?: TextFormat
}

export interface MatrixSpan {
  id: string
  type: 'matrix'
  rows: number
  cols: number
  data: string[][]
  format?: TextFormat
}

// NEW: Inline math template with editable slots
export interface MathTemplateSpan {
  id: string
  type: 'mathTemplate'
  templateId: string           // reference to mathTemplates registry
  slotValues: Record<string, string>  // current values for each slot
  format?: TextFormat
}

// Matrix line
export interface MatrixLine extends LineElement {
  type: 'matrix'
  rows: number
  cols: number
  data: string[][]  // 2D array of cell values
  format?: TextFormat
}

export interface MathExpressionLine extends LineElement {
  type: 'math'
  latex: string
  raw?: string
  displayMode: boolean
  format?: TextFormat
}

// Document is array of lines
export type DocumentContent = (TextLine | MatrixLine | MathExpressionLine)[]

// Cursor position (zone-based)
export type CursorPosition =
  | { zone: 'text', lineId: string, charOffset: number }
  | { zone: 'matrix', lineId: string, matrixId: string, row: number, col: number }
  | { zone: 'mathTemplate', lineId: string, templateSpanId: string, slotName: string, slotOffset: number }

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
  category: 'insert' | 'symbol' | 'operator' | 'math' | 'matrix' | 'template' | 'function' | 'decoration'
  icon?: string
}
