// Convert MathAst to LaTeX for rendering
import type { MathAst } from '../types';

/**
 * Converts a MathAst node to LaTeX string for rendering with KaTeX.
 * This is deterministic and reversible for AST nodes created by our builders.
 */
export function astToLatex(ast: MathAst): string {
  switch (ast.kind) {
    case 'symbol':
      return ast.value;

    case 'number':
      return ast.value;

    case 'identifier':
      return ast.name;

    case 'matrix': {
      const rows = ast.cells
        .map(row => row.join(' & '))
        .join(' \\\\ ');
      return `\\begin{bmatrix} ${rows} \\end{bmatrix}`;
    }

    case 'vector': {
      if (ast.orientation === 'col') {
        const rows = ast.cells.join(' \\\\ ');
        return `\\begin{bmatrix} ${rows} \\end{bmatrix}`;
      } else {
        const cols = ast.cells.join(' & ');
        return `\\begin{bmatrix} ${cols} \\end{bmatrix}`;
      }
    }

    case 'op': {
      const left = astToLatex(ast.left);
      const right = astToLatex(ast.right);
      const opMap: Record<string, string> = {
        '+': '+',
        '-': '-',
        '*': '\\times',
        '/': '\\div',
        'dot': '\\cdot',
        'times': '\\times',
      };
      return `${left} ${opMap[ast.op]} ${right}`;
    }

    case 'wrapper': {
      const inner = astToLatex(ast.inner);
      switch (ast.wrap) {
        case 'paren':
          return `\\left( ${inner} \\right)`;
        case 'norm':
          return `\\left\\| ${inner} \\right\\|`;
        case 'sqrt':
          return `\\sqrt{${inner}}`;
      }
    }

    case 'integral': {
      let latex = '\\int';
      if (ast.from !== undefined && ast.to !== undefined) {
        latex += `_{${ast.from}}^{${ast.to}}`;
      }
      latex += ` ${ast.body}`;
      if (ast.d) {
        latex += ` \\, d${ast.d}`;
      }
      return latex;
    }

    case 'fraction':
      return `\\frac{${ast.numerator}}{${ast.denominator}}`;

    case 'exponent':
      return `{${ast.base}}^{${ast.exponent}}`;

    case 'subscript':
      return `{${ast.base}}_{${ast.subscript}}`;

    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = ast;
      return '';
  }
}

/**
 * Generates a unique ID for blocks
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
