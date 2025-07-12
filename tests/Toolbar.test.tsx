// tests/Toolbar.test.tsx

import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toolbar } from '../src/components/Toolbar'
import { useSheetStore } from '../src/store/useSheetStore'
import mockData from '../src/api/mockData.json'
import type { ApiResponse } from '../src/types/api'

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
  useSheetStore.getState().initFromApi(mockData as ApiResponse, false) // Disable auto-fit for tests
})

describe('Toolbar', () => {
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

  it('allows editing formulas and shows results', async () => {
    // Set up some test data
    useSheetStore.setState({
      selection: 'A1',
      cells: { 
        'A1': { value: '=SUM(B1:B3)' },
        'B1': { value: '10' },
        'B2': { value: '20' },
        'B3': { value: '30' }
      }
    })
    
    const { getByDisplayValue, getByText } = render(<Toolbar />)
    const toolbarInput = getByDisplayValue('=SUM(B1:B3)')
    
    // Should show the formula in the input
    expect(toolbarInput).toHaveValue('=SUM(B1:B3)')
    
    // Should show the result
    expect(getByText('= 60')).toBeInTheDocument()
    
    // Should allow editing the formula
    const user = userEvent.setup()
    await user.clear(toolbarInput)
    await user.type(toolbarInput, '=AVERAGE(B1:B3)')
    
    // Check that the store was updated
    expect(useSheetStore.getState().cells['A1'].value).toBe('=AVERAGE(B1:B3)')
  })

  it('shows formula result for range selection', async () => {
    // Set up range selection with formula
    useSheetStore.setState({
      rangeAnchor: 'A1',
      rangeHead: 'A3',
      selection: 'A1',
      cells: { 
        'A1': { value: '=SUM(B1:B3)' },
        'B1': { value: '10' },
        'B2': { value: '20' },
        'B3': { value: '30' }
      }
    })
    
    const { getByDisplayValue, getByText } = render(<Toolbar />)
    
    // Should show range in display
    expect(getByText('A1:A3')).toBeInTheDocument()
    
    // Should show formula in input
    const toolbarInput = getByDisplayValue('=SUM(B1:B3)')
    expect(toolbarInput).toHaveValue('=SUM(B1:B3)')
    
    // Should show result
    expect(getByText('= 60')).toBeInTheDocument()
  })
}) 