// tests/Sheet.test.tsx

import React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sheet } from '../src/components/Sheet'
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
