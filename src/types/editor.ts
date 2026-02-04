// Strict block-based editor types

// Line element base
export interface LineElement {
  id: string
  type: 'text' | 'matrix'
}

// Text line with inline segments
export interface TextLine extends LineElement {
  type: 'text'
  content: (TextSpan | SymbolSpan)[]
}

export interface TextSpan {
  type: 'text'
  value: string
}

export interface SymbolSpan {
  type: 'symbol'
  value: 'sigma' | 'integral' | 'sqrt' | 'pi' | 'theta' | 'alpha' | 'beta' | 'gamma' | 'delta' | 'lambda'
  display: string
}

// Matrix line
export interface MatrixLine extends LineElement {
  type: 'matrix'
  rows: number
  cols: number
  data: string[][]  // 2D array of cell values
}

// Document is array of lines
export type DocumentContent = (TextLine | MatrixLine)[]

// Cursor position (zone-based)
export type CursorPosition = 
  | { zone: 'text', lineId: string, charOffset: number }
  | { zone: 'matrix', lineId: string, row: number, col: number }

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
  category: 'insert' | 'symbol' | 'special'
  icon?: string
}

// Symbol definition for keypad
export interface MathSymbol {
  id: SymbolSpan['value']
  name: string
  display: string
}
