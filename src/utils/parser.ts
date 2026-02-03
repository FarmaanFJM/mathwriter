import type { Element, TextElement, MatrixElement } from '../types/editor';

/**
 * Parse raw text into structured elements
 * 
 * Detects patterns like:
 * - [ [ a b ] [ c d ] ] → 2×2 matrix
 * - Regular text → text element
 */
export function parseText(text: string): Element[] {
  const elements: Element[] = [];
  let currentText = '';
  let i = 0;

  while (i < text.length) {
    // Check for matrix pattern: [ [ ... ] [ ... ] ]
    if (text[i] === '[' && i + 1 < text.length && text[i + 1] === ' ') {
      // Save any accumulated text
      if (currentText.trim()) {
        elements.push({
          type: 'text',
          value: currentText
        });
        currentText = '';
      }

      // Try to parse matrix
      const matrixResult = parseMatrix(text, i);
      if (matrixResult) {
        elements.push(matrixResult.element);
        i = matrixResult.endIndex;
        continue;
      }
    }

    // Regular character
    currentText += text[i];
    i++;
  }

  // Add remaining text
  if (currentText.trim()) {
    elements.push({
      type: 'text',
      value: currentText
    });
  }

  // Ensure at least one element
  if (elements.length === 0) {
    elements.push({
      type: 'text',
      value: ''
    });
  }

  return elements;
}

/**
 * Parse matrix from text starting at given index
 * Returns null if not a valid matrix
 */
function parseMatrix(text: string, startIndex: number): { element: MatrixElement; endIndex: number } | null {
  let i = startIndex;
  
  // Expect: [ [ ... ] [ ... ] ]
  if (text[i] !== '[') return null;
  i++; // skip first [
  
  // Skip whitespace
  while (i < text.length && text[i] === ' ') i++;
  
  const rows: string[][] = [];
  
  // Parse rows
  while (i < text.length && text[i] === '[') {
    i++; // skip row [
    
    // Skip whitespace
    while (i < text.length && text[i] === ' ') i++;
    
    const row: string[] = [];
    let cellValue = '';
    
    // Parse cells in row
    while (i < text.length && text[i] !== ']') {
      if (text[i] === ' ' && cellValue.trim()) {
        row.push(cellValue.trim());
        cellValue = '';
      } else if (text[i] !== ' ' || cellValue) {
        cellValue += text[i];
      }
      i++;
    }
    
    // Add last cell
    if (cellValue.trim()) {
      row.push(cellValue.trim());
    }
    
    if (text[i] !== ']') return null;
    i++; // skip row ]
    
    rows.push(row);
    
    // Skip whitespace
    while (i < text.length && text[i] === ' ') i++;
  }
  
  // Expect closing ]
  if (text[i] !== ']') return null;
  i++; // skip final ]
  
  // Validate matrix (all rows same length)
  if (rows.length === 0) return null;
  const cols = rows[0].length;
  if (cols === 0) return null;
  if (!rows.every(row => row.length === cols)) return null;
  
  return {
    element: {
      type: 'matrix',
      rows: rows.length,
      cols,
      data: rows
    },
    endIndex: i
  };
}
