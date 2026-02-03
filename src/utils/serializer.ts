import type { Element, MatrixElement, SymbolElement } from '../types/editor';

/**
 * Serialize content structure back to plain text
 */
export function serialize(content: Element[]): string {
  return content.map(element => {
    if (element.type === 'text') {
      return element.value;
    }
    if (element.type === 'matrix') {
      return serializeMatrix(element);
    }
    if (element.type === 'symbol') {
      return serializeSymbol(element);
    }
    return '';
  }).join('');
}

/**
 * Serialize matrix to text format: [ [ a b ] [ c d ] ]
 */
function serializeMatrix(matrix: MatrixElement): string {
  const rows = matrix.data.map(row => 
    `[ ${row.join(' ')} ]`
  ).join(' ');
  return `[ ${rows} ]`;
}

/**
 * Serialize symbol to display character or fallback
 */
function serializeSymbol(symbol: SymbolElement): string {
  return symbol.display || symbol.value;
}
