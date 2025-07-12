// src/components/Cell.tsx

import React, { useEffect, useRef, useState } from 'react'
import { getCellId, parseCellId } from '../utils/getCellId'
import { keyboardMove } from '../utils/keyboardMove'
import { useSheetStore } from '../store/useSheetStore'
import { isFormula } from '../utils/formulas'


const NAV_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'])
const DELETE_KEYS = new Set(['Delete', 'Backspace'])

const BASE_CELL_CLASS = 'flex-none w-36 min-w-0 p-1 truncate text-sm rounded-none'

export interface CellProps {
  col: number
  row: number
  className?: string
  maxCol: number
  maxRow: number
  showGrid?: boolean
}

export function Cell({ row, col, className = '', maxCol, maxRow, showGrid = true }: CellProps) {
  const id = getCellId(col, row)
  const cols = useSheetStore((s) => s.columns)
  const dataVal = useSheetStore((s) => s.cells[id]?.value ?? '')
  const getCellValue = useSheetStore((s) => s.getCellValue)
  const selection = useSheetStore((s) => s.selection)
  const rangeAnchor = useSheetStore((s) => s.rangeAnchor)
  const rangeHead = useSheetStore((s) => s.rangeHead)

  const setCell = useSheetStore((s) => s.setCell)
  const setCol = useSheetStore((s) => s.setColumnName)
  const setSel = useSheetStore((s) => s.setSelection)
  const setRowCount = useSheetStore((s) => s.setRowCount)
  const setColCount = useSheetStore((s) => s.setColCount)
  const setAnchor = useSheetStore((s) => s.setRangeAnchor)
  const setHead = useSheetStore((s) => s.setRangeHead)
  const clearRange = useSheetStore((s) => s.clearRange)
  const copySelection = useSheetStore((s) => s.copySelection)
  const pasteToSelection = useSheetStore((s) => s.pasteToSelection)
  const editingCellId = useSheetStore((s) => s.editingCellId)
  const setEditingCellId = useSheetStore((s) => s.setEditingCellId)

  const ref = useRef<HTMLInputElement>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [hovered, setHovered] = useState(false)

  const isHeader = row === -1
  const value = isHeader ? cols[col]?.name ?? '' : dataVal
 
  // Only show input as editable if this cell is in edit mode
  const isEditing = editingCellId === id
 
  // When editing, show raw value; when not editing, show evaluated value
  const displayValue = isHeader ? value : (isEditing ? value : getCellValue(id))

  // Store the original value for cancel edit
  const [originalValue, setOriginalValue] = useState<string | null>(null)

  // When entering edit mode, store the original value
  useEffect(() => {
    if (isEditing) {
      setOriginalValue(dataVal)
    }
  }, [dataVal, isEditing])

  useEffect(() => {
    if (selection === id) {
      ref.current?.focus({ preventScroll: true })
      ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }, [selection, id])

  // Range selection logic is now handled by the useRangeSelection hook in Sheet.tsx

  // Determine if this cell should show the selection border
  const isSelected = React.useMemo(() => {
    if (selection === id) return true
    // If we have a range and this cell is the range anchor, it should be selected
    if (rangeAnchor === id) return true
    return false
  }, [selection, id, rangeAnchor])

  const inRange = React.useMemo(() => {
    if (!rangeAnchor || !rangeHead) return false
    const { col: c0, row: r0 } = parseCellId(rangeAnchor)
    const { col: c1, row: r1 } = parseCellId(rangeHead)
    const loCol = Math.min(c0, c1),
      hiCol = Math.max(c0, c1)
    const loRow = Math.min(r0, r1),
      hiRow = Math.max(r0, r1)
    return col >= loCol && col <= hiCol && row >= loRow && row <= hiRow
  }, [rangeAnchor, rangeHead, col, row])

  // Check if range has multiple cells
  const hasMultipleCells = React.useMemo(() => {
    if (!rangeAnchor || !rangeHead) return false
    const { col: c0, row: r0 } = parseCellId(rangeAnchor)
    const { col: c1, row: r1 } = parseCellId(rangeHead)
    return c0 !== c1 || r0 !== r1
  }, [rangeAnchor, rangeHead])

  const getGridBorderClasses = () => {
    if (!showGrid) return ''
    let border = ''
    if (row !== maxRow - 1) border += ' border-b border-[#e0e0e0] dark:border-[#30363d]'
    if (col !== maxCol - 1) border += ' border-r border-[#e0e0e0] dark:border-[#30363d]'
    return border
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    if (isHeader) {
      setCol(col, v)
    } else {
      setCell(id, v)
      // If user types '(', ensure we are in edit mode
      if (v.startsWith('=') && v.includes('(') && editingCellId !== id) {
        setEditingCellId(id)
        setTimeout(() => {
          const input = document.getElementById(id) as HTMLInputElement
          if (input) {
            input.focus()
            input.setSelectionRange(v.length, v.length)
          }
        }, 0)
      }
    }
  }

  const handleBlur = () => {
    // Check if we have an incomplete formula (opened parentheses but not closed)
    const currentEditingCellId = useSheetStore.getState().editingCellId
    if (currentEditingCellId) {
      const currentValue = useSheetStore.getState().cells[currentEditingCellId]?.value || ''
      const trimmed = currentValue.trim()
      
      // Only stay in edit mode if we have an incomplete formula (opened parentheses)
      if (isFormula(currentValue) && trimmed.includes('(') && !trimmed.endsWith(')')) {
        // Refocus the input to keep editing
        setTimeout(() => {
          const editingInput = document.getElementById(currentEditingCellId) as HTMLInputElement
          if (editingInput) {
            editingInput.focus()
          }
        }, 0)
        return
      }
    }
    
    // Exit edit mode for all other cases (clicking off, complete formulas, etc.)
    setEditingCellId(null)
  }

  const handleDoubleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation()
    setEditingCellId(id)
    e.currentTarget.select()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Exit edit mode on Escape and revert value
    if (e.key === 'Escape') {
      if (originalValue !== null) {
        setCell(id, originalValue)
      }
      setEditingCellId(null)
      return
    }
    // Special handling for Enter key in formulas
    if (e.key === 'Enter') {
      const currentValue = e.currentTarget.value
      if (isFormula(currentValue)) {
        e.preventDefault()
        setCell(id, currentValue)
        setEditingCellId(null)
        setSel(id)
        return
      }
      // For non-formula input, let the normal navigation happen
    }

    // Handle delete/backspace for range selection
    if (DELETE_KEYS.has(e.key) && inRange && hasMultipleCells) {
      e.preventDefault()

      // Get all cells in the range
      const { col: c0, row: r0 } = parseCellId(rangeAnchor!)
      const { col: c1, row: r1 } = parseCellId(rangeHead!)
      const loCol = Math.min(c0, c1)
      const hiCol = Math.max(c0, c1)
      const loRow = Math.min(r0, r1)
      const hiRow = Math.max(r0, r1)

      // Clear all cells in the range
      const updates: Record<string, string> = {}
      for (let r = loRow; r <= hiRow; r++) {
        for (let c = loCol; c <= hiCol; c++) {
          const cellId = getCellId(c, r)
          updates[cellId] = ''
        }
      }

      useSheetStore.getState().setCells(updates)
      return
    }

    // Handle copy/paste operations
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c') {
        e.preventDefault()
        copySelection()
        return
      } else if (e.key === 'v') {
        e.preventDefault()
        pasteToSelection()
        return
      } else if (e.key === 'x') {
        e.preventDefault()
        copySelection()
        // Clear the selection after copying
        if (inRange && hasMultipleCells) {
          const { col: c0, row: r0 } = parseCellId(rangeAnchor!)
          const { col: c1, row: r1 } = parseCellId(rangeHead!)
          const loCol = Math.min(c0, c1)
          const hiCol = Math.max(c0, c1)
          const loRow = Math.min(r0, r1)
          const hiRow = Math.max(r0, r1)

          const updates: Record<string, string> = {}
          for (let r = loRow; r <= hiRow; r++) {
            for (let c = loCol; c <= hiCol; c++) {
              const cellId = getCellId(c, r)
              updates[cellId] = ''
            }
          }
          useSheetStore.getState().setCells(updates)
        } else if (selection) {
          setCell(selection, '')
        }
        return
      }
      // Allow other Ctrl/Cmd combinations (like Ctrl+A) to work normally
      return
    }

    if (!NAV_KEYS.has(e.key)) return

    const next = keyboardMove({
      cellId: id,
      key: e.key,
      shiftKey: e.shiftKey,
    })
    if (!next) return

    e.preventDefault()

    const { col: nc, row: nr } = parseCellId(next)
    const { colCount: curCols, rowCount: curRows } = useSheetStore.getState()
    if (nc + 1 > curCols) {
      setColCount(nc + 1)
    }
    if (nr + 1 > curRows) {
      setRowCount(nr + 1)
    }

    if (e.shiftKey) {
      // Extend range selection
      if (!rangeAnchor) {
        setAnchor(id)
      }
      setHead(next)
      setSel(next)
    } else {
      // Clear range and move selection
      clearRange()
      setSel(next)
    }

    document.getElementById(next)?.focus({ preventScroll: true })
  }

  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault()
        
        // Get the current editing state
        const currentEditingCellId = useSheetStore.getState().editingCellId
        const isCurrentlyEditing = currentEditingCellId !== null
        
        // Check if we're currently editing a formula
        const isEditingFormula = isCurrentlyEditing && 
          isFormula(useSheetStore.getState().cells[currentEditingCellId!]?.value || '')
        
        if (e.shiftKey) {
          // Extend range selection
          if (!rangeAnchor) {
            setAnchor(id)
            // Keep selection at the currently editing cell if editing a formula
            if (isEditingFormula && currentEditingCellId) {
              setSel(currentEditingCellId)
            } else {
              setSel(id)
            }
          }
          setHead(id)
        } else {
          // Start new selection
          setAnchor(id)
          setHead(id)
          // Keep selection at the currently editing cell if editing a formula
          if (isEditingFormula && currentEditingCellId) {
            setSel(currentEditingCellId)
          } else {
            setSel(id)
          }
        }
        
        // Don't clear range here - let the setAnchor/setHead calls handle range creation
        // The range will be properly managed by the mouse events
        // For formula editing, we preserve the range to allow range selection during input
      }}
      onMouseOver={(e) => {
        if (e.buttons === 1 && rangeAnchor) {
          // Left mouse button is pressed
          setHead(id)
          // Keep selection at the anchor (start) of range
        }
        setHovered(true)
      }}
      onMouseLeave={() => setHovered(false)}

      className={`relative w-full h-full rounded-none ${getGridBorderClasses()} ${
        inRange && hasMultipleCells ? 'bg-blue-100/50 dark:bg-blue-100/20' : ''
      }`}
    >
      {/* Header cell: add single sort icon, right-aligned, only on hover */}
      {isHeader && (
        <button
          type="button"
          title="Sort column"
          className={`absolute top-1 right-2 z-30 text-xs px-1 py-0.5 rounded transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'} hover:bg-blue-100 dark:hover:bg-[#30363d]`}
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => {
            e.stopPropagation()
            let rowRange: [number, number] | undefined = undefined
            if (rangeAnchor && rangeHead) {
              const { col: c0, row: r0 } = parseCellId(rangeAnchor)
              const { col: c1, row: r1 } = parseCellId(rangeHead)
              const loCol = Math.min(c0, c1)
              const hiCol = Math.max(c0, c1)
              const loRow = Math.min(r0, r1)
              const hiRow = Math.max(r0, r1)
              if (col >= loCol && col <= hiCol && loRow >= 0 && hiRow >= 0) {
                rowRange = [loRow, hiRow]
              }
            }
            useSheetStore.getState().sortByColumn(col, sortDir, rowRange)
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
          }}
        >
          {sortDir === 'asc' ? '▲' : '▼'}
        </button>
      )}
      <input
        id={id}
        ref={ref}
        type="text"
        className={`
          w-full h-full
          ${BASE_CELL_CLASS}
          ${className}
          ${inRange && hasMultipleCells ? 'bg-transparent dark:bg-transparent' : 'bg-white dark:bg-transparent'}
          ${isSelected ? 'border border-blue-600 dark:border-[#58a6ff]' : ''}
          focus:border-blue-600 dark:focus:border-[#58a6ff]
          focus:outline-none
          ${inRange && hasMultipleCells ? 'focus:bg-transparent dark:focus:bg-transparent' : 'focus:bg-blue-100 dark:focus:bg-[#161b22]'}
          rounded-none
        `}
        value={displayValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onMouseDown={(e) => {
          // Range selection logic for formula editing
          // (mirrors the logic in the parent div's onMouseDown)
          e.stopPropagation();
          e.preventDefault();
          const currentEditingCellId = useSheetStore.getState().editingCellId;
          const isCurrentlyEditing = currentEditingCellId !== null;
          const isEditingFormula = isCurrentlyEditing && isFormula(useSheetStore.getState().cells[currentEditingCellId!]?.value || '');
          if (e.shiftKey) {
            if (!rangeAnchor) {
              setAnchor(id);
              if (isEditingFormula && currentEditingCellId) {
                setSel(currentEditingCellId);
              } else {
                setSel(id);
              }
            }
            setHead(id);
          } else {
            setAnchor(id);
            setHead(id);
            if (isEditingFormula && currentEditingCellId) {
              setSel(currentEditingCellId);
            } else {
              setSel(id);
            }
          }
        }}
        onClick={(e) => {
          e.stopPropagation()
          // Only clear range if we're not currently editing a formula
          const currentEditingCellId = useSheetStore.getState().editingCellId
          const isCurrentlyEditing = currentEditingCellId !== null
          const isEditingFormula = isCurrentlyEditing && 
            isFormula(useSheetStore.getState().cells[currentEditingCellId!]?.value || '')
          
          // During formula editing, don't clear range on click - let the mouse events handle range building
          if (!isEditingFormula) {
            clearRange()
            setSel(id)
          } else {
            // For formula editing, only change selection if clicking on the editing cell itself
            if (currentEditingCellId === id) {
              setSel(id)
            }
            // Don't clear range during formula editing to allow range building
          }
        }}
        onDoubleClick={handleDoubleClick}
        spellCheck="false"
        autoComplete="off"
      />

    </div>
  )
}
