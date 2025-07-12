// tests/Sheet.test.tsx

import React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet } from '../src/components/Sheet'
import { useSheetStore } from '../src/store/useSheetStore'
import mockData from '../src/api/mockData.json'
import type { ApiResponse } from '../src/types/api'
import { Toolbar } from '../src/components/Toolbar'

beforeEach(() => {
  useSheetStore.setState({
    cells: {},
    columns: [],
    rowCount: 0,
    colCount: 0,
    selection: null,
    rangeAnchor: null,
    rangeHead: null,
    rowMeta: [],
  })
  useSheetStore.getState().initFromApi(mockData as ApiResponse)
})

afterEach(() => {
  cleanup()
})

describe('Sheet', () => {
  it('renders', () => {
    const { getAllByRole } = render(<Sheet />)
    const inputs = getAllByRole('textbox')
    expect(inputs.length).toBeGreaterThan(0)
  })

  it('allows editing a cell', async () => {
    const { getAllByRole } = render(<Sheet />)
    const user = userEvent.setup()
    const inputs = getAllByRole('textbox')
    const first = inputs[0]

    // clear whatever initial value it has (could be blank or from mockData)
    await user.clear(first)
    await user.type(first, 'Hello')

    expect(first).toHaveValue('Hello')
  })
})

// Helper to get data cell input by (row, col), skipping header row
function getDataCellInput(inputs, row, col, colCount) {
  // headers are first colCount inputs
  return inputs[colCount + row * colCount + col]
}

describe('Sheet sorting, selection, copy/paste, undo/redo', () => {
  const colCount = 5 // product, 2020, 2021, 2022, 2023

  it('sorts by a numeric column ascending and descending', async () => {
    const { getAllByRole } = render(<Sheet />)
    const user = userEvent.setup()
    // Find the header input for column "2020"
    const headerInputs = getAllByRole('textbox').filter(input => (input as HTMLInputElement).value === '2020')
    expect(headerInputs.length).toBe(1)
    const header = headerInputs[0].closest('div')
    expect(header).not.toBeNull()
    // Find the sort button
    const sortBtn = header!.querySelector('button[title*="Sort column"]')
    expect(sortBtn).not.toBeNull()
    // Sort ascending (first click)
    await user.hover(header!)
    await user.click(sortBtn!)
    const inputs = getAllByRole('textbox')
    // After sort, the first data cell in 2020 should be 0 (CoreSoft Suite)
    expect(getDataCellInput(inputs, 0, 1, colCount)).toHaveValue('0')
    // Sort descending (second click)
    await user.hover(header!)
    await user.click(sortBtn!)
    // Now the first data cell in 2020 should be the largest (Total)
    expect(getDataCellInput(inputs, 0, 1, colCount)).toHaveValue('104665679.08339758')
  })

  it('sorts by a string column', async () => {
    const { getAllByRole } = render(<Sheet />)
    const user = userEvent.setup()
    // Find the header input for column "product"
    const headerInputs = getAllByRole('textbox').filter(input => (input as HTMLInputElement).value === 'product')
    expect(headerInputs.length).toBe(1)
    const header = headerInputs[0].closest('div')
    expect(header).not.toBeNull()
    const sortBtn = header!.querySelector('button[title*="Sort column"]')
    expect(sortBtn).not.toBeNull()
    await user.hover(header!)
    await user.click(sortBtn!)
    const inputs = getAllByRole('textbox')
    // After sort, the first product should be "Apex ERP Suite"
    expect(getDataCellInput(inputs, 0, 0, colCount)).toHaveValue('Apex ERP Suite')
  })

  it('sorts only a selected range', async () => {
    const { getAllByRole } = render(<Sheet />)
    const user = userEvent.setup()
    const inputs = getAllByRole('textbox')
    // Select a range: click first data cell in 2020, shift+click 3rd data row in 2020
    await user.click(getDataCellInput(inputs, 0, 1, colCount))
    await user.keyboard('{Shift>}')
    await user.click(getDataCellInput(inputs, 2, 1, colCount))
    await user.keyboard('{/Shift}')
    // Sort ascending in 2020 (should only affect first 3 rows)
    const headerInput = getAllByRole('textbox').find(input => (input as HTMLInputElement).value === '2020')
    expect(headerInput).toBeDefined()
    const header = headerInput!.closest('div')
    expect(header).not.toBeNull()
    const sortBtn = header!.querySelector('button[title*="Sort column"]')
    expect(sortBtn).not.toBeNull()
    await user.hover(header!)
    await user.click(sortBtn!)
    // The first three values in 2020 should be sorted (0, 5118724..., 10053102...)
    const v0 = parseFloat(getDataCellInput(inputs, 0, 1, colCount).value)
    const v1 = parseFloat(getDataCellInput(inputs, 1, 1, colCount).value)
    const v2 = parseFloat(getDataCellInput(inputs, 2, 1, colCount).value)
    expect(v0).toBeLessThanOrEqual(v1)
    expect(v1).toBeLessThanOrEqual(v2)
  })

  it('allows copy and paste of a cell', async () => {
    const { getAllByRole } = render(<Sheet />)
    const user = userEvent.setup()
    const inputs = getAllByRole('textbox')
    // Copy from first data cell (row 0, col 0), paste to (row 0, col 1)
    await user.click(getDataCellInput(inputs, 0, 0, colCount))
    await user.keyboard('{Control>}{c}{/Control}')
    await user.click(getDataCellInput(inputs, 0, 1, colCount))
    await user.keyboard('{Control>}{v}{/Control}')
    expect(getDataCellInput(inputs, 0, 1, colCount)).toHaveValue(getDataCellInput(inputs, 0, 0, colCount).value)
  })

  it('undoes and redoes an edit', async () => {
    const { getAllByRole } = render(<Sheet />)
    const user = userEvent.setup()
    const inputs = getAllByRole('textbox')
    // Edit a data cell (row 0, col 0)
    await user.click(getDataCellInput(inputs, 0, 0, colCount))
    await user.clear(getDataCellInput(inputs, 0, 0, colCount))
    await user.type(getDataCellInput(inputs, 0, 0, colCount), 'TestUndo')
    expect(getDataCellInput(inputs, 0, 0, colCount)).toHaveValue('TestUndo')
    await user.keyboard('{Control>}{z}{/Control}')
    expect(getDataCellInput(inputs, 0, 0, colCount)).not.toHaveValue('TestUndo')
    await user.keyboard('{Control>}{y}{/Control}')
    expect(getDataCellInput(inputs, 0, 0, colCount)).toHaveValue('TestUndo')
  })

  it('selects a range of cells', async () => {
    const { getAllByRole } = render(<Sheet />)
    const user = userEvent.setup()
    const inputs = getAllByRole('textbox')
    await user.click(getDataCellInput(inputs, 0, 0, colCount))
    await user.keyboard('{Shift>}')
    await user.click(getDataCellInput(inputs, 0, 2, colCount))
    await user.keyboard('{/Shift}')
    // The selection state is not visible, but we can check focus
    expect(document.activeElement).toBe(getDataCellInput(inputs, 0, 2, colCount))
  })

  it('selects a single cell', async () => {
    const { getAllByRole } = render(<Sheet />)
    const user = userEvent.setup()
    const inputs = getAllByRole('textbox')
    await user.click(getDataCellInput(inputs, 0, 3, colCount))
    expect(document.activeElement).toBe(getDataCellInput(inputs, 0, 3, colCount))
  })
})

describe('SheetWithToolbar', () => {
  it('allows editing cells through toolbar', async () => {
    // Test toolbar editing directly
    useSheetStore.setState({
      selection: 'A1',
      cells: { 'A1': { value: 'original' } }
    })
    
    const { getByDisplayValue } = render(<Toolbar />)
    const toolbarInput = getByDisplayValue('original')
    
    const user = userEvent.setup()
    await user.clear(toolbarInput)
    await user.type(toolbarInput, 'Toolbar Edit')
    
    // Check that the store was updated
    expect(useSheetStore.getState().cells['A1'].value).toBe('Toolbar Edit')
  })

  it('updates toolbar when cell is edited', async () => {
    // Test toolbar updates when store changes
    useSheetStore.setState({
      selection: 'A1',
      cells: { 'A1': { value: 'original' } }
    })
    
    const { getByDisplayValue, rerender } = render(<Toolbar />)
    expect(getByDisplayValue('original')).toBeInTheDocument()
    
    // Update the store
    useSheetStore.setState({
      cells: { 'A1': { value: 'Cell Edit' } }
    })
    
    // Re-render to see the update
    rerender(<Toolbar />)
    expect(getByDisplayValue('Cell Edit')).toBeInTheDocument()
  })

  it('shows range selection in toolbar', async () => {
    // Test the Toolbar component directly with range state
    useSheetStore.setState({
      rangeAnchor: 'A1',
      rangeHead: 'B1',
      selection: 'A1',
      cells: { 'A1': { value: 'foo' } }
    })
    
    const { getByText } = render(<Toolbar />)
    expect(getByText('A1:B1')).toBeInTheDocument()
  })

  it('disables toolbar when no selection', () => {
    const { getByPlaceholderText } = render(<Toolbar />)
    const toolbarInput = getByPlaceholderText('No selection')
    
    // Toolbar should be disabled when no cell is selected
    expect(toolbarInput).toBeDisabled()
  })
})
