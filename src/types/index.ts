// Core data types for MathWriter

// Math AST (Abstract Syntax Tree) types
export type MathAst =
  | SymbolNode
  | NumberNode
  | IdentifierNode
  | MatrixNode
  | VectorNode
  | OperatorNode
  | WrapperNode
  | IntegralNode
  | FractionNode
  | ExponentNode
  | SubscriptNode;

export interface SymbolNode {
  kind: 'symbol';
  value: string; // e.g., 'π', '√', '∑', '∫', '∞', etc.
}

export interface NumberNode {
  kind: 'number';
  value: string;
}

export interface IdentifierNode {
  kind: 'identifier';
  name: string; // e.g., 'x', 'A', 'theta'
}

export interface MatrixNode {
  kind: 'matrix';
  rows: number;
  cols: number;
  cells: string[][]; // Each cell is a string (can be number or expression)
}

export interface VectorNode {
  kind: 'vector';
  orientation: 'col' | 'row';
  cells: string[];
}

export interface OperatorNode {
  kind: 'op';
  op: '+' | '-' | '*' | '/' | 'dot' | 'times';
  left: MathAst;
  right: MathAst;
}

export interface WrapperNode {
  kind: 'wrapper';
  wrap: 'paren' | 'norm' | 'sqrt';
  inner: MathAst;
}

export interface IntegralNode {
  kind: 'integral';
  from?: string;
  to?: string;
  body: string;
  d?: string; // differential variable, e.g., 'x'
}

export interface FractionNode {
  kind: 'fraction';
  numerator: string;
  denominator: string;
}

export interface ExponentNode {
  kind: 'exponent';
  base: string;
  exponent: string;
}

export interface SubscriptNode {
  kind: 'subscript';
  base: string;
  subscript: string;
}

// Content blocks
export type ContentBlock = ParagraphBlock | MathBlock;

export interface ParagraphBlock {
  type: 'paragraph';
  id: string; // unique block ID
  text: string;
}

export interface MathBlock {
  type: 'math';
  id: string; // unique block ID
  inline: boolean;
  ast: MathAst;
  latex: string; // Generated from AST for rendering
}

// Note structure
export interface Note {
  id: string;
  title: string;
  content: ContentBlock[];
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

// Note index for quick access
export interface NoteIndex {
  notes: Array<{
    id: string;
    title: string;
    updatedAt: number;
  }>;
}

// Editor state
export interface EditorState {
  currentNoteId: string | null;
  caretPosition: number; // block index where caret is
  selectedBlockId: string | null;
}

// Math builder state
export interface MathBuilderState {
  mode: 'create' | 'edit';
  editingBlockId: string | null;
  currentAst: MathAst | null;
  currentLatex: string;
}
