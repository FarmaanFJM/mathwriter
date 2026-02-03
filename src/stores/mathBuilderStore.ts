// Pinia store for math builder state
import { defineStore } from 'pinia';
import type { MathAst, MatrixNode, VectorNode } from '../types';
import { astToLatex } from '../utils/mathConverter';

interface MathBuilderState {
  mode: 'create' | 'edit';
  editingBlockId: string | null;
  currentAst: MathAst | null;
  activeTab: 'matrices' | 'vectors' | 'symbols' | 'calculus' | 'templates';
  
  // Matrix builder state
  matrixRows: number;
  matrixCols: number;
  matrixCells: string[][];
  
  // Vector builder state
  vectorSize: number;
  vectorOrientation: 'col' | 'row';
  vectorCells: string[];
  
  // Template builder state
  fractionNumerator: string;
  fractionDenominator: string;
  exponentBase: string;
  exponentPower: string;
  subscriptBase: string;
  subscriptValue: string;
  
  // Integral builder state
  integralBody: string;
  integralFrom: string;
  integralTo: string;
  integralVariable: string;
}

export const useMathBuilderStore = defineStore('mathBuilder', {
  state: (): MathBuilderState => ({
    mode: 'create',
    editingBlockId: null,
    currentAst: null,
    activeTab: 'matrices',
    
    matrixRows: 2,
    matrixCols: 2,
    matrixCells: [['', ''], ['', '']],
    
    vectorSize: 3,
    vectorOrientation: 'col',
    vectorCells: ['', '', ''],
    
    fractionNumerator: '',
    fractionDenominator: '',
    exponentBase: '',
    exponentPower: '',
    subscriptBase: '',
    subscriptValue: '',
    
    integralBody: '',
    integralFrom: '',
    integralTo: '',
    integralVariable: 'x',
  }),

  getters: {
    currentLatex: (state): string => {
      if (state.currentAst) {
        return astToLatex(state.currentAst);
      }
      return '';
    },
  },

  actions: {
    setActiveTab(tab: MathBuilderState['activeTab']) {
      this.activeTab = tab;
    },

    /**
     * Enter edit mode for an existing math block
     */
    enterEditMode(blockId: string, ast: MathAst) {
      this.mode = 'edit';
      this.editingBlockId = blockId;
      this.currentAst = ast;
      
      // Load AST data into builder state
      this.loadAstIntoBuilder(ast);
    },

    /**
     * Exit edit mode and return to create mode
     */
    exitEditMode() {
      this.mode = 'create';
      this.editingBlockId = null;
      this.currentAst = null;
      this.resetBuilders();
    },

    /**
     * Load AST data into the appropriate builder
     */
    loadAstIntoBuilder(ast: MathAst) {
      switch (ast.kind) {
        case 'matrix':
          this.activeTab = 'matrices';
          this.matrixRows = ast.rows;
          this.matrixCols = ast.cols;
          this.matrixCells = ast.cells.map(row => [...row]);
          break;
          
        case 'vector':
          this.activeTab = 'vectors';
          this.vectorSize = ast.cells.length;
          this.vectorOrientation = ast.orientation;
          this.vectorCells = [...ast.cells];
          break;
          
        case 'fraction':
          this.activeTab = 'templates';
          this.fractionNumerator = ast.numerator;
          this.fractionDenominator = ast.denominator;
          break;
          
        case 'exponent':
          this.activeTab = 'templates';
          this.exponentBase = ast.base;
          this.exponentPower = ast.exponent;
          break;
          
        case 'subscript':
          this.activeTab = 'templates';
          this.subscriptBase = ast.base;
          this.subscriptValue = ast.subscript;
          break;
          
        case 'integral':
          this.activeTab = 'calculus';
          this.integralBody = ast.body;
          this.integralFrom = ast.from || '';
          this.integralTo = ast.to || '';
          this.integralVariable = ast.d || 'x';
          break;
      }
    },

    /**
     * Reset all builder states
     */
    resetBuilders() {
      this.matrixRows = 2;
      this.matrixCols = 2;
      this.matrixCells = [['', ''], ['', '']];
      
      this.vectorSize = 3;
      this.vectorOrientation = 'col';
      this.vectorCells = ['', '', ''];
      
      this.fractionNumerator = '';
      this.fractionDenominator = '';
      this.exponentBase = '';
      this.exponentPower = '';
      this.subscriptBase = '';
      this.subscriptValue = '';
      
      this.integralBody = '';
      this.integralFrom = '';
      this.integralTo = '';
      this.integralVariable = 'x';
    },

    /**
     * Set matrix dimensions and resize cells array
     */
    setMatrixSize(rows: number, cols: number) {
      this.matrixRows = rows;
      this.matrixCols = cols;
      
      // Resize cells array
      const newCells: string[][] = [];
      for (let i = 0; i < rows; i++) {
        newCells[i] = [];
        for (let j = 0; j < cols; j++) {
          newCells[i][j] = this.matrixCells[i]?.[j] || '';
        }
      }
      this.matrixCells = newCells;
    },

    /**
     * Update a matrix cell value
     */
    updateMatrixCell(row: number, col: number, value: string) {
      if (this.matrixCells[row]) {
        this.matrixCells[row][col] = value;
      }
    },

    /**
     * Build matrix AST from current state
     */
    buildMatrixAst(): MatrixNode {
      return {
        kind: 'matrix',
        rows: this.matrixRows,
        cols: this.matrixCols,
        cells: this.matrixCells.map(row => [...row]),
      };
    },

    /**
     * Set vector size and resize cells array
     */
    setVectorSize(size: number) {
      this.vectorSize = size;
      
      // Resize cells array
      const newCells: string[] = [];
      for (let i = 0; i < size; i++) {
        newCells[i] = this.vectorCells[i] || '';
      }
      this.vectorCells = newCells;
    },

    /**
     * Update a vector cell value
     */
    updateVectorCell(index: number, value: string) {
      this.vectorCells[index] = value;
    },

    /**
     * Toggle vector orientation
     */
    toggleVectorOrientation() {
      this.vectorOrientation = this.vectorOrientation === 'col' ? 'row' : 'col';
    },

    /**
     * Build vector AST from current state
     */
    buildVectorAst(): VectorNode {
      return {
        kind: 'vector',
        orientation: this.vectorOrientation,
        cells: [...this.vectorCells],
      };
    },

    /**
     * Build AST for current active builder
     */
    buildCurrentAst(): MathAst | null {
      switch (this.activeTab) {
        case 'matrices':
          return this.buildMatrixAst();
          
        case 'vectors':
          return this.buildVectorAst();
          
        case 'templates':
          // Determine which template is being used based on filled fields
          if (this.fractionNumerator || this.fractionDenominator) {
            return {
              kind: 'fraction',
              numerator: this.fractionNumerator,
              denominator: this.fractionDenominator,
            };
          } else if (this.exponentBase || this.exponentPower) {
            return {
              kind: 'exponent',
              base: this.exponentBase,
              exponent: this.exponentPower,
            };
          } else if (this.subscriptBase || this.subscriptValue) {
            return {
              kind: 'subscript',
              base: this.subscriptBase,
              subscript: this.subscriptValue,
            };
          }
          return null;
          
        case 'calculus':
          return {
            kind: 'integral',
            body: this.integralBody,
            from: this.integralFrom || undefined,
            to: this.integralTo || undefined,
            d: this.integralVariable,
          };
          
        default:
          return null;
      }
    },

    /**
     * Create a symbol AST node
     */
    createSymbolAst(symbol: string): MathAst {
      return {
        kind: 'symbol',
        value: symbol,
      };
    },
  },
});
