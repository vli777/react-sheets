import { useEffect } from 'react'
import { useSheetStore } from '../store/useSheetStore'
import { getCellId, parseCellId } from '../utils/getCellId'
import { isFormula } from '../utils/formulas'

export function useRangeSelection() {
  // Extract Zustand subscriptions to separate variables for static checking
  const editingCellId = useSheetStore((s) => s.editingCellId)
  const rangeAnchor = useSheetStore((s) => s.rangeAnchor)
  const rangeHead = useSheetStore((s) => s.rangeHead)
  const cells = useSheetStore((s) => s.cells)

  useEffect(() => {
    // Only run if editing a formula and a range is selected
    const currentEditingCellId = useSheetStore.getState().editingCellId
    const currentRangeAnchor = useSheetStore.getState().rangeAnchor
    const currentRangeHead = useSheetStore.getState().rangeHead
    
    console.log('Range selection effect triggered:', {
      editingCellId: currentEditingCellId,
      rangeAnchor: currentRangeAnchor,
      rangeHead: currentRangeHead
    })
    
    if (
      currentEditingCellId &&
      currentRangeAnchor &&
      currentRangeHead
    ) {
      const cell = useSheetStore.getState().cells[currentEditingCellId]
      
      if (!cell || !isFormula(cell.value)) {
        console.log('Not a formula or no cell, returning')
        return
      }
      
      console.log('Processing range insertion for formula:', cell.value)
      
      // Compute range string - handle both single cell and multi-cell ranges
      const { col: c0, row: r0 } = parseCellId(currentRangeAnchor)
      const { col: c1, row: r1 } = parseCellId(currentRangeHead)
      const loCol = Math.min(c0, c1)
      const hiCol = Math.max(c0, c1)
      const loRow = Math.min(r0, r1)
      const hiRow = Math.max(r0, r1)
      const startId = getCellId(loCol, loRow)
      const endId = getCellId(hiCol, hiRow)
      
      // For single cell, use just the cell ID; for range, use A1:B2 format
      const rangeStr = startId === endId ? startId : `${startId}:${endId}`
      
      console.log('Computed range string:', rangeStr, {
        startId,
        endId,
        isSingleCell: startId === endId
      })

      // Get the input element for the editing cell
      const input = document.getElementById(currentEditingCellId) as HTMLInputElement
      if (!input) {
        console.log('Input element not found for:', currentEditingCellId)
        return
      }
      
      // Find the current cursor position
      const val = input.value
      const cursorPos = input.selectionStart ?? val.length
      
      // Find the last opening parenthesis before cursor
      const lastOpenParen = val.lastIndexOf('(', cursorPos)
      if (lastOpenParen === -1) {
        console.log('No opening parenthesis found')
        return
      }
      
      // Find if there's already a range after the opening parenthesis
      const afterParen = val.slice(lastOpenParen + 1, cursorPos)
      const hasExistingRange = /[A-Z]+\d+(?::[A-Z]+\d+)?/.test(afterParen)
      
      console.log('Range insertion details:', {
        currentValue: val,
        cursorPos,
        lastOpenParen,
        afterParen,
        hasExistingRange
      })
      
      let newVal: string
      if (hasExistingRange) {
        // Replace the existing range
        const beforeRange = val.slice(0, lastOpenParen + 1)
        const afterRange = val.slice(cursorPos)
        newVal = beforeRange + rangeStr + afterRange
        console.log('Replacing existing range')
      } else {
        // Insert the range at cursor position
        newVal = val.slice(0, cursorPos) + rangeStr + val.slice(cursorPos)
        console.log('Inserting new range')
      }

      console.log('New formula value:', newVal)

      // Update the cell value in the store
      useSheetStore.getState().setCell(currentEditingCellId, newVal)

      // Move cursor to after inserted range
      const newCursorPos = lastOpenParen + 1 + rangeStr.length
      setTimeout(() => {
        input.focus()
        input.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)

      // Clear range selection so user can select another range
      useSheetStore.getState().clearRange()
      console.log('Range insertion complete')
    }
  }, [editingCellId, rangeAnchor, rangeHead, cells])
} 