// Core editor types for keyboard-driven math text editor

export type Element = 
  | TextElement
  | MatrixElement
  | SymbolElement

export interface TextElement {
  type: 'text'
  value: string
}

export interface MatrixElement {
  type: 'matrix'
  data: string[][]  // 2D array of cell contents
  rows: number
  cols: number
}

export interface SymbolElement {
  type: 'symbol'
  value: 'sigma' | 'integral' | 'sqrt' | 'pi' | 'alpha' | 'beta' | 'gamma' | 'delta' | 'theta' | 'lambda'
  display?: string  // Optional display override
}

export interface CursorPosition {
  type: 'text' | 'matrix'
  elementIndex: number
  textOffset?: number  // For text elements (character position)
  row?: number         // For matrix elements
  col?: number         // For matrix elements
}

export interface EditorState {
  content: Element[]
  cursorPosition: CursorPosition
  showCommandPalette: boolean
  commandSearchQuery: string
  selectedCommandIndex: number
}

export interface Command {
  id: string
  name: string
  description: string
  category: 'insert' | 'symbol' | 'special'
  execute: (state: EditorState) => void
}
