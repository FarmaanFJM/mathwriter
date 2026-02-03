import type { Command, EditorState, MatrixElement, SymbolElement, TextElement } from '../types/editor';

// Insert matrix at cursor position
function insertMatrix(state: EditorState, rows: number, cols: number) {
  const matrix: MatrixElement = {
    type: 'matrix',
    rows,
    cols,
    data: Array(rows).fill(null).map(() => Array(cols).fill(''))
  };

  // Insert at current cursor position
  const insertIndex = state.cursorPosition.elementIndex + 1;
  state.content.splice(insertIndex, 0, matrix);

  // Move cursor to first cell of matrix
  state.cursorPosition = {
    type: 'matrix',
    elementIndex: insertIndex,
    row: 0,
    col: 0
  };

  // Close command palette
  state.showCommandPalette = false;
  state.commandSearchQuery = '';
}

// Insert symbol at cursor position
function insertSymbol(state: EditorState, symbol: SymbolElement['value'], display?: string) {
  const symbolElement: SymbolElement = {
    type: 'symbol',
    value: symbol,
    display
  };

  // Insert at current cursor position
  const insertIndex = state.cursorPosition.elementIndex + 1;
  state.content.splice(insertIndex, 0, symbolElement);

  // Move cursor past the symbol
  state.cursorPosition = {
    type: 'text',
    elementIndex: insertIndex + 1,
    textOffset: 0
  };

  // Close command palette
  state.showCommandPalette = false;
  state.commandSearchQuery = '';
}

// All available commands
export const commands: Command[] = [
  // Matrix commands
  {
    id: 'insert-matrix-2x2',
    name: 'matrix 2×2',
    description: 'Insert a 2×2 matrix',
    category: 'insert',
    execute: (state) => insertMatrix(state, 2, 2)
  },
  {
    id: 'insert-matrix-2x3',
    name: 'matrix 2×3',
    description: 'Insert a 2×3 matrix',
    category: 'insert',
    execute: (state) => insertMatrix(state, 2, 3)
  },
  {
    id: 'insert-matrix-3x2',
    name: 'matrix 3×2',
    description: 'Insert a 3×2 matrix',
    category: 'insert',
    execute: (state) => insertMatrix(state, 3, 2)
  },
  {
    id: 'insert-matrix-3x3',
    name: 'matrix 3×3',
    description: 'Insert a 3×3 matrix',
    category: 'insert',
    execute: (state) => insertMatrix(state, 3, 3)
  },
  {
    id: 'insert-matrix-4x4',
    name: 'matrix 4×4',
    description: 'Insert a 4×4 matrix',
    category: 'insert',
    execute: (state) => insertMatrix(state, 4, 4)
  },
  {
    id: 'insert-vector-2',
    name: 'vector 2D',
    description: 'Insert a 2D column vector',
    category: 'insert',
    execute: (state) => insertMatrix(state, 2, 1)
  },
  {
    id: 'insert-vector-3',
    name: 'vector 3D',
    description: 'Insert a 3D column vector',
    category: 'insert',
    execute: (state) => insertMatrix(state, 3, 1)
  },
  {
    id: 'insert-vector-4',
    name: 'vector 4D',
    description: 'Insert a 4D column vector',
    category: 'insert',
    execute: (state) => insertMatrix(state, 4, 1)
  },
  
  // Greek letters
  {
    id: 'symbol-alpha',
    name: 'alpha',
    description: 'Insert α symbol',
    category: 'symbol',
    execute: (state) => insertSymbol(state, 'alpha', 'α')
  },
  {
    id: 'symbol-beta',
    name: 'beta',
    description: 'Insert β symbol',
    category: 'symbol',
    execute: (state) => insertSymbol(state, 'beta', 'β')
  },
  {
    id: 'symbol-gamma',
    name: 'gamma',
    description: 'Insert γ symbol',
    category: 'symbol',
    execute: (state) => insertSymbol(state, 'gamma', 'γ')
  },
  {
    id: 'symbol-delta',
    name: 'delta',
    description: 'Insert δ symbol',
    category: 'symbol',
    execute: (state) => insertSymbol(state, 'delta', 'δ')
  },
  {
    id: 'symbol-theta',
    name: 'theta',
    description: 'Insert θ symbol',
    category: 'symbol',
    execute: (state) => insertSymbol(state, 'theta', 'θ')
  },
  {
    id: 'symbol-lambda',
    name: 'lambda',
    description: 'Insert λ symbol',
    category: 'symbol',
    execute: (state) => insertSymbol(state, 'lambda', 'λ')
  },
  {
    id: 'symbol-pi',
    name: 'pi',
    description: 'Insert π symbol',
    category: 'symbol',
    execute: (state) => insertSymbol(state, 'pi', 'π')
  },
  
  // Math symbols
  {
    id: 'symbol-sigma',
    name: 'sigma',
    description: 'Insert Σ (summation) symbol',
    category: 'symbol',
    execute: (state) => insertSymbol(state, 'sigma', 'Σ')
  },
  {
    id: 'symbol-integral',
    name: 'integral',
    description: 'Insert ∫ (integral) symbol',
    category: 'symbol',
    execute: (state) => insertSymbol(state, 'integral', '∫')
  },
  {
    id: 'symbol-sqrt',
    name: 'sqrt',
    description: 'Insert √ (square root) symbol',
    category: 'symbol',
    execute: (state) => insertSymbol(state, 'sqrt', '√')
  },
];

// Filter commands by search query
export function filterCommands(query: string): Command[] {
  if (!query) return commands;
  
  const lowerQuery = query.toLowerCase();
  
  return commands.filter(cmd => 
    cmd.name.toLowerCase().includes(lowerQuery) ||
    cmd.description.toLowerCase().includes(lowerQuery) ||
    cmd.category.toLowerCase().includes(lowerQuery)
  );
}
