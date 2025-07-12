// src/utils/formulas.ts

import * as XLSX from '@formulajs/formulajs'

export interface FormulaContext {
  cells: Record<string, { value: string }>
  getCellValue: (cellId: string) => string
  parseRange: (range: string) => string[]
}

export interface FormulaFunction {
  name: string
  description: string
  syntax: string
  execute: (args: string[], context: FormulaContext) => string | number
}

// Default statistical functions for single column ranges
export const defaultFormulas: Record<string, FormulaFunction> = {
  SUM: {
    name: 'SUM',
    description: 'Returns the sum of all numbers in a range',
    syntax: 'SUM(range)',
    execute: (args: string[], context: FormulaContext) => {
      if (args.length !== 1) {
        throw new Error('SUM requires exactly one argument (range)')
      }
      
      const range = args[0]
      const cellIds = context.parseRange(range)
      const values = cellIds.map(id => context.getCellValue(id))
      
      const numbers = values
        .map(v => v.trim())
        .filter(v => v !== '')
        .map(v => Number(v))
        .filter(n => !isNaN(n) && isFinite(n))
      
      if (numbers.length === 0) return 0
      
      return XLSX.SUM(...numbers)
    }
  },

  AVERAGE: {
    name: 'AVERAGE',
    description: 'Returns the average of all numbers in a range',
    syntax: 'AVERAGE(range)',
    execute: (args: string[], context: FormulaContext) => {
      if (args.length !== 1) {
        throw new Error('AVERAGE requires exactly one argument (range)')
      }
      
      const range = args[0]
      const cellIds = context.parseRange(range)
      const values = cellIds.map(id => context.getCellValue(id))
      
      const numbers = values
        .map(v => v.trim())
        .filter(v => v !== '')
        .map(v => Number(v))
        .filter(n => !isNaN(n) && isFinite(n))
      
      if (numbers.length === 0) return 0
      
      return XLSX.AVERAGE(...numbers)
    }
  },

  MAX: {
    name: 'MAX',
    description: 'Returns the maximum value in a range',
    syntax: 'MAX(range)',
    execute: (args: string[], context: FormulaContext) => {
      if (args.length !== 1) {
        throw new Error('MAX requires exactly one argument (range)')
      }
      
      const range = args[0]
      const cellIds = context.parseRange(range)
      const values = cellIds.map(id => context.getCellValue(id))
      
      const numbers = values
        .map(v => v.trim())
        .filter(v => v !== '')
        .map(v => Number(v))
        .filter(n => !isNaN(n) && isFinite(n))
      
      if (numbers.length === 0) return 0
      
      return XLSX.MAX(...numbers)
    }
  },

  MIN: {
    name: 'MIN',
    description: 'Returns the minimum value in a range',
    syntax: 'MIN(range)',
    execute: (args: string[], context: FormulaContext) => {
      if (args.length !== 1) {
        throw new Error('MIN requires exactly one argument (range)')
      }
      
      const range = args[0]
      const cellIds = context.parseRange(range)
      const values = cellIds.map(id => context.getCellValue(id))
      
      const numbers = values
        .map(v => v.trim())
        .filter(v => v !== '')
        .map(v => Number(v))
        .filter(n => !isNaN(n) && isFinite(n))
      
      if (numbers.length === 0) return 0
      
      return XLSX.MIN(...numbers)
    }
  },

  MEDIAN: {
    name: 'MEDIAN',
    description: 'Returns the median value in a range',
    syntax: 'MEDIAN(range)',
    execute: (args: string[], context: FormulaContext) => {
      if (args.length !== 1) {
        throw new Error('MEDIAN requires exactly one argument (range)')
      }
      
      const range = args[0]
      const cellIds = context.parseRange(range)
      const values = cellIds.map(id => context.getCellValue(id))
      
      const numbers = values
        .map(v => v.trim())
        .filter(v => v !== '')
        .map(v => Number(v))
        .filter(n => !isNaN(n) && isFinite(n))
      
      if (numbers.length === 0) return 0
      
      return XLSX.MEDIAN(...numbers)
    }
  }
}

// Parse a range like "A1:A10" into an array of cell IDs
export function parseRange(range: string): string[] {
  const match = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/)
  if (!match) {
    throw new Error(`Invalid range format: ${range}. Expected format: A1:A10`)
  }
  
  const [, startCol, startRow, endCol, endRow] = match
  const startColNum = columnToNumber(startCol)
  const endColNum = columnToNumber(endCol)
  const startRowNum = parseInt(startRow) - 1 // Convert to 0-based
  const endRowNum = parseInt(endRow) - 1
  
  const cellIds: string[] = []
  
  // For single column ranges, we only iterate rows
  if (startColNum === endColNum) {
    for (let row = startRowNum; row <= endRowNum; row++) {
      cellIds.push(`${startCol}${row + 1}`)
    }
  } else {
    // For multi-column ranges, iterate both rows and columns
    for (let row = startRowNum; row <= endRowNum; row++) {
      for (let col = startColNum; col <= endColNum; col++) {
        cellIds.push(`${numberToColumn(col)}${row + 1}`)
      }
    }
  }
  
  return cellIds
}

// Convert column letter to number (A=0, B=1, etc.)
export function columnToNumber(column: string): number {
  let result = 0
  for (let i = 0; i < column.length; i++) {
    result = result * 26 + (column.charCodeAt(i) - 64)
  }
  return result - 1 // Convert to 0-based
}

// Convert number to column letter (0=A, 1=B, etc.)
export function numberToColumn(num: number): string {
  let result = ''
  num++ // Convert from 0-based to 1-based
  
  while (num > 0) {
    num--
    result = String.fromCharCode(65 + (num % 26)) + result
    num = Math.floor(num / 26)
  }
  
  return result
}

// Check if a value is a formula (starts with =)
export function isFormula(value: string): boolean {
  return value.trim().startsWith('=')
}

// Extract formula name and arguments from a formula string
export function parseFormula(formula: string): { name: string; args: string[] } {
  const trimmed = formula.trim()
  if (!trimmed.startsWith('=')) {
    throw new Error('Formula must start with =')
  }
  
  const formulaPart = trimmed.slice(1) // Remove the =
  const match = formulaPart.match(/^([A-Z]+)\((.*)\)$/)
  
  if (!match) {
    throw new Error(`Invalid formula format: ${formula}`)
  }
  
  const [, name, argsString] = match
  const args = argsString.split(',').map(arg => arg.trim())
  
  return { name: name.toUpperCase(), args }
}

// Evaluate a formula
export function evaluateFormula(
  formula: string, 
  context: FormulaContext
): string | number {
  try {
    const { name, args } = parseFormula(formula)
    
    const formulaFn = defaultFormulas[name]
    if (!formulaFn) {
      throw new Error(`Unknown formula: ${name}`)
    }
    
    return formulaFn.execute(args, context)
  } catch (error) {
    return `#ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

// Get all available formula names
export function getAvailableFormulas(): string[] {
  return Object.keys(defaultFormulas)
}

// Get formula information
export function getFormulaInfo(name: string): FormulaFunction | null {
  return defaultFormulas[name.toUpperCase()] || null
} 