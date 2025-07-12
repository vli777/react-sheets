// tests/formulas.test.tsx

import { describe, it, expect } from 'vitest'
import { 
  parseRange, 
  isFormula, 
  parseFormula, 
  evaluateFormula, 
  getAvailableFormulas,
  getFormulaInfo,
  type FormulaContext 
} from '../src/utils/formulas'

describe('Formula utilities', () => {
  it('detects formulas correctly', () => {
    expect(isFormula('=SUM(A1:A10)')).toBe(true)
    expect(isFormula('=AVERAGE(B1:B5)')).toBe(true)
    expect(isFormula('Hello')).toBe(false)
    expect(isFormula('123')).toBe(false)
    expect(isFormula(' =SUM(A1:A10)')).toBe(true) // Handles leading space
  })

  it('parses formulas correctly', () => {
    expect(parseFormula('=SUM(A1:A10)')).toEqual({
      name: 'SUM',
      args: ['A1:A10']
    })
    
    expect(parseFormula('=AVERAGE(B1:B5)')).toEqual({
      name: 'AVERAGE',
      args: ['B1:B5']
    })
    
    expect(parseFormula('=MAX(C1:C20)')).toEqual({
      name: 'MAX',
      args: ['C1:C20']
    })
  })

  it('parses ranges correctly', () => {
    expect(parseRange('A1:A5')).toEqual(['A1', 'A2', 'A3', 'A4', 'A5'])
    expect(parseRange('B1:B3')).toEqual(['B1', 'B2', 'B3'])
    expect(parseRange('A1:C1')).toEqual(['A1', 'B1', 'C1'])
  })

  it('parses single cells correctly', () => {
    expect(parseRange('A1')).toEqual(['A1'])
    expect(parseRange('B5')).toEqual(['B5'])
    expect(parseRange('Z10')).toEqual(['Z10'])
  })

  it('evaluates SUM formula correctly', () => {
    const context: FormulaContext = {
      cells: {
        'A1': { value: '10' },
        'A2': { value: '20' },
        'A3': { value: '30' },
        'A4': { value: '' },
        'A5': { value: '40' }
      },
      getCellValue: (id: string) => context.cells[id]?.value || '',
      parseRange: (range: string) => parseRange(range)
    }

    const result = evaluateFormula('=SUM(A1:A5)', context)
    expect(result).toBe(100) // 10 + 20 + 30 + 0 + 40
  })

  it('evaluates case-insensitive formulas correctly', () => {
    const context: FormulaContext = {
      cells: {
        'A1': { value: '10' },
        'A2': { value: '20' },
        'A3': { value: '30' }
      },
      getCellValue: (id: string) => context.cells[id]?.value || '',
      parseRange: (range: string) => parseRange(range)
    }

    // Test lowercase formula
    const result1 = evaluateFormula('=sum(A1:A3)', context)
    expect(result1).toBe(60) // 10 + 20 + 30

    // Test mixed case formula
    const result2 = evaluateFormula('=Sum(A1:A3)', context)
    expect(result2).toBe(60) // 10 + 20 + 30

    // Test uppercase formula (should still work)
    const result3 = evaluateFormula('=SUM(A1:A3)', context)
    expect(result3).toBe(60) // 10 + 20 + 30
  })

  it('evaluates AVERAGE formula correctly', () => {
    const context: FormulaContext = {
      cells: {
        'B1': { value: '10' },
        'B2': { value: '20' },
        'B3': { value: '30' }
      },
      getCellValue: (id: string) => context.cells[id]?.value || '',
      parseRange: (range: string) => parseRange(range)
    }

    const result = evaluateFormula('=AVERAGE(B1:B3)', context)
    expect(result).toBe(20) // (10 + 20 + 30) / 3
  })

  it('evaluates MAX formula correctly', () => {
    const context: FormulaContext = {
      cells: {
        'C1': { value: '5' },
        'C2': { value: '15' },
        'C3': { value: '10' }
      },
      getCellValue: (id: string) => context.cells[id]?.value || '',
      parseRange: (range: string) => parseRange(range)
    }

    const result = evaluateFormula('=MAX(C1:C3)', context)
    expect(result).toBe(15)
  })

  it('evaluates MIN formula correctly', () => {
    const context: FormulaContext = {
      cells: {
        'D1': { value: '25' },
        'D2': { value: '15' },
        'D3': { value: '30' }
      },
      getCellValue: (id: string) => context.cells[id]?.value || '',
      parseRange: (range: string) => parseRange(range)
    }

    const result = evaluateFormula('=MIN(D1:D3)', context)
    expect(result).toBe(15)
  })

  it('evaluates MEDIAN formula correctly', () => {
    const context: FormulaContext = {
      cells: {
        'E1': { value: '10' },
        'E2': { value: '20' },
        'E3': { value: '30' }
      },
      getCellValue: (id: string) => context.cells[id]?.value || '',
      parseRange: (range: string) => parseRange(range)
    }

    const result = evaluateFormula('=MEDIAN(E1:E3)', context)
    expect(result).toBe(20) // Middle value of 10, 20, 30
  })

  it('evaluates single cell formulas correctly', () => {
    const context: FormulaContext = {
      cells: {
        'A1': { value: '42' },
        'B1': { value: '100' }
      },
      getCellValue: (id: string) => context.cells[id]?.value || '',
      parseRange: (range: string) => parseRange(range)
    }

    // Test single cell SUM
    const result1 = evaluateFormula('=SUM(A1)', context)
    expect(result1).toBe(42)

    // Test single cell AVERAGE
    const result2 = evaluateFormula('=AVERAGE(B1)', context)
    expect(result2).toBe(100)

    // Test single cell MAX
    const result3 = evaluateFormula('=MAX(A1)', context)
    expect(result3).toBe(42)
  })

  it('handles empty ranges gracefully', () => {
    const context: FormulaContext = {
      cells: {},
      getCellValue: (id: string) => context.cells[id]?.value || '',
      parseRange: (range: string) => parseRange(range)
    }

    expect(evaluateFormula('=SUM(A1:A5)', context)).toBe(0)
    expect(evaluateFormula('=AVERAGE(A1:A5)', context)).toBe(0)
  })

  it('handles non-numeric values in ranges', () => {
    const context: FormulaContext = {
      cells: {
        'A1': { value: '10' },
        'A2': { value: 'Hello' },
        'A3': { value: '30' },
        'A4': { value: 'World' }
      },
      getCellValue: (id: string) => context.cells[id]?.value || '',
      parseRange: (range: string) => parseRange(range)
    }

    const result = evaluateFormula('=SUM(A1:A4)', context)
    expect(result).toBe(40) // Only 10 + 30, ignores text
  })

  it('returns error for unknown formulas', () => {
    const context: FormulaContext = {
      cells: {},
      getCellValue: (id: string) => context.cells[id]?.value || '',
      parseRange: (range: string) => parseRange(range)
    }

    const result = evaluateFormula('=UNKNOWN(A1:A5)', context)
    expect(result).toContain('#ERROR')
  })

  it('returns raw formula for incomplete formula syntax', () => {
    const context: FormulaContext = {
      cells: {},
      getCellValue: (id: string) => context.cells[id]?.value || '',
      parseRange: (range: string) => parseRange(range)
    }

    const result = evaluateFormula('=SUM(A1:A5', context) // Missing closing parenthesis
    expect(result).toBe('=SUM(A1:A5') // Should return raw formula for incomplete syntax
  })

  it('provides available formulas', () => {
    const formulas = getAvailableFormulas()
    expect(formulas).toContain('SUM')
    expect(formulas).toContain('AVERAGE')
    expect(formulas).toContain('MAX')
    expect(formulas).toContain('MIN')
    expect(formulas).toContain('MEDIAN')
  })

  it('provides formula information', () => {
    const sumInfo = getFormulaInfo('SUM')
    expect(sumInfo).toBeDefined()
    expect(sumInfo?.name).toBe('SUM')
    expect(sumInfo?.description).toContain('sum')
    expect(sumInfo?.syntax).toBe('SUM(range)')

    const unknownInfo = getFormulaInfo('UNKNOWN')
    expect(unknownInfo).toBeNull()
  })
}) 